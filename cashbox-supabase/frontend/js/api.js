// Requires supabaseClient.js loaded first (defines `supabaseClient`)

const Auth = {
  user: null,
  role: null,
  username: null,

  async requireLogin() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = "login.html";
      return null;
    }
    await this._loadProfile(session.user);
    return session;
  },

  async redirectIfLoggedIn(target = "index.html") {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) window.location.href = target;
  },

  async _loadProfile(user) {
    this.user = user;
    const { data } = await supabaseClient
      .from("profiles")
      .select("role, username")
      .eq("id", user.id)
      .single();
    this.role = data?.role || "viewer";
    this.username = data?.username || user.email;
  },

  isAdmin() {
    return this.role === "admin";
  },

  async logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  },
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

function mapTransaction(t) {
  return {
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    donor_name: t.donor_name,
    withdrawal_reason: t.withdrawal_reason,
    notes: t.notes,
    date: t.date,
    created_by_username: t.profiles?.username || "unknown",
    created_at: t.created_at,
  };
}

function csvEscape(val) {
  const s = String(val ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildSearchFilter(query, search) {
  if (!search) return query;
  const like = `%${search}%`;
  return query.or(
    `donor_name.ilike.${like},withdrawal_reason.ilike.${like},notes.ilike.${like}`
  );
}

const Api = {
  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  async getDashboard() {
    const { data: all, error: e1 } = await supabaseClient.from("transactions").select("type, amount");
    if (e1) throw new Error(e1.message);

    const totalDeposits = all.filter((t) => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
    const totalWithdrawals = all.filter((t) => t.type === "withdraw").reduce((s, t) => s + Number(t.amount), 0);

    const { data: latest, error: e2 } = await supabaseClient
      .from("transactions")
      .select("*, profiles(username)")
      .order("date", { ascending: false })
      .order("id", { ascending: false })
      .limit(10);
    if (e2) throw new Error(e2.message);

    return {
      balance: round2(totalDeposits - totalWithdrawals),
      total_deposits: round2(totalDeposits),
      total_withdrawals: round2(totalWithdrawals),
      transaction_count: all.length,
      latest_transactions: latest.map(mapTransaction),
    };
  },

  async getTransactions({ page = 1, pageSize = 15, search = "", dateFrom = "", dateTo = "" } = {}) {
    let query = supabaseClient
      .from("transactions")
      .select("*, profiles(username)", { count: "exact" })
      .order("date", { ascending: false })
      .order("id", { ascending: false });

    query = buildSearchFilter(query, search);
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return { total: count, page, page_size: pageSize, items: data.map(mapTransaction) };
  },

  async deposit({ amount, donor_name, notes, date }) {
    const { data, error } = await supabaseClient
      .from("transactions")
      .insert({
        type: "deposit",
        amount,
        donor_name,
        notes: notes || null,
        date: date || undefined,
        created_by: Auth.user.id,
      })
      .select("*, profiles(username)")
      .single();
    if (error) throw new Error(error.message);
    return mapTransaction(data);
  },

  async withdraw({ amount, reason, notes, date }) {
    const { data, error } = await supabaseClient
      .from("transactions")
      .insert({
        type: "withdraw",
        amount,
        withdrawal_reason: reason,
        notes: notes || null,
        date: date || undefined,
        created_by: Auth.user.id,
      })
      .select("*, profiles(username)")
      .single();
    if (error) throw new Error(error.message);
    return mapTransaction(data);
  },

  async updateTransaction(id, payload) {
    const { data, error } = await supabaseClient
      .from("transactions")
      .update(payload)
      .eq("id", id)
      .select("*, profiles(username)")
      .single();
    if (error) throw new Error(error.message);
    return mapTransaction(data);
  },

  async deleteTransaction(id) {
    const { error } = await supabaseClient.from("transactions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async exportCsv({ search = "", dateFrom = "", dateTo = "" } = {}) {
    let query = supabaseClient
      .from("transactions")
      .select("*, profiles(username)")
      .order("date", { ascending: false });

    query = buildSearchFilter(query, search);
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const header = ["ID", "Type", "Amount", "Donor/Reason", "Notes", "Date", "User", "Created At"];
    const rows = data.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.donor_name || t.withdrawal_reason || "",
      t.notes || "",
      t.date,
      t.profiles?.username || "",
      t.created_at,
    ]);
    return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
  },
};

function showToast(message, type = "success") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.className = `show ${type}`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.className = "";
  }, 3500);
}

function formatMoney(n) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderTopbar(activePage) {
  const el = document.getElementById("topbar");
  if (!el) return;
  el.innerHTML = `
    <div class="brand">💰 Cash Box</div>
    <nav>
      <a href="index.html" class="${activePage === "dashboard" ? "active" : ""}">Dashboard</a>
      <a href="transactions.html" class="${activePage === "transactions" ? "active" : ""}">Transactions</a>
    </nav>
    <div class="user-info">
      <span>${Auth.username}</span>
      <span class="role-badge ${Auth.role}">${Auth.role}</span>
      <button class="btn btn-sm" id="logoutBtn">Log out</button>
    </div>
  `;
  document.getElementById("logoutBtn").addEventListener("click", () => Auth.logout());
}
