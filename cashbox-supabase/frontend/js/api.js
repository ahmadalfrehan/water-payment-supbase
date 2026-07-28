// Requires supabaseClient.js, i18n.js, and currencies.js loaded first

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
    currency: t.currency,
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
    const { data: all, error: e1 } = await supabaseClient.from("transactions").select("type, amount, currency");
    if (e1) throw new Error(e1.message);

    // Group totals per currency — balances from different currencies are never summed together
    const byCurrency = {};
    for (const c of CURRENCIES) {
      byCurrency[c.code] = { currency: c.code, total_deposits: 0, total_withdrawals: 0, balance: 0 };
    }
    for (const t of all) {
      if (!byCurrency[t.currency]) {
        byCurrency[t.currency] = { currency: t.currency, total_deposits: 0, total_withdrawals: 0, balance: 0 };
      }
      const amt = Number(t.amount);
      if (t.type === "deposit") byCurrency[t.currency].total_deposits += amt;
      else byCurrency[t.currency].total_withdrawals += amt;
    }
    Object.values(byCurrency).forEach((c) => {
      c.total_deposits = round2(c.total_deposits);
      c.total_withdrawals = round2(c.total_withdrawals);
      c.balance = round2(c.total_deposits - c.total_withdrawals);
    });

    const { data: latest, error: e2 } = await supabaseClient
      .from("transactions")
      .select("*, profiles(username)")
      .order("date", { ascending: false })
      .order("id", { ascending: false })
      .limit(10);
    if (e2) throw new Error(e2.message);

    return {
      by_currency: Object.values(byCurrency),
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

  async deposit({ amount, currency, donor_name, notes, date }) {
    const { data, error } = await supabaseClient
      .from("transactions")
      .insert({
        type: "deposit",
        amount,
        currency,
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

  async withdraw({ amount, currency, reason, notes, date }) {
    const { data, error } = await supabaseClient
      .from("transactions")
      .insert({
        type: "withdraw",
        amount,
        currency,
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

    const header = ["ID", "Type", "Amount", "Currency", "Donor/Reason", "Notes", "Date", "User", "Created At"];
    const rows = data.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.currency,
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

// Always uses Western digits/formatting regardless of UI language, for consistent
// financial readability. Prefixes the currency symbol.
function formatMoney(n, currencyCode) {
  const num = Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currencyCode ? `${currencySymbol(currencyCode)} ${num}` : num;
}

function renderTopbar(activePage) {
  const el = document.getElementById("topbar");
  if (!el) return;
  el.innerHTML = `
    <div class="brand">${I18N.t("brand")}</div>
    <nav>
      <a href="index.html" class="${activePage === "dashboard" ? "active" : ""}">${I18N.t("nav_dashboard")}</a>
      <a href="transactions.html" class="${activePage === "transactions" ? "active" : ""}">${I18N.t("nav_transactions")}</a>
    </nav>
    <div class="user-info">
      <button class="btn btn-sm" id="langToggleBtn">${I18N.t("lang_toggle")}</button>
      <span>${Auth.username}</span>
      <span class="role-badge ${Auth.role}">${I18N.t(Auth.role === "admin" ? "role_admin" : "role_viewer")}</span>
      <button class="btn btn-sm" id="logoutBtn">${I18N.t("logout")}</button>
    </div>
  `;
  document.getElementById("logoutBtn").addEventListener("click", () => Auth.logout());
  document.getElementById("langToggleBtn").addEventListener("click", () => I18N.toggle());
}
