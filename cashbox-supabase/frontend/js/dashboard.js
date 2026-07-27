const depositModal = document.getElementById("depositModal");
const withdrawModal = document.getElementById("withdrawModal");

function typeTag(type) {
  return `<span class="type-tag ${type}">${type === "deposit" ? "Deposit" : "Withdrawal"}</span>`;
}

function renderLatestTable(items) {
  const wrap = document.getElementById("latestTableWrap");
  if (!items.length) {
    wrap.innerHTML = `<p class="empty-state">No transactions yet.</p>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead>
        <tr><th>Type</th><th>Amount</th><th>Date</th><th>Donor / Reason</th><th>User</th></tr>
      </thead>
      <tbody>
        ${items.map(t => `
          <tr>
            <td>${typeTag(t.type)}</td>
            <td class="amount ${t.type}">${t.type === "deposit" ? "+" : "-"}${formatMoney(t.amount)}</td>
            <td>${t.date}</td>
            <td>${t.donor_name || t.withdrawal_reason || "—"}</td>
            <td>${t.created_by_username}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function loadDashboard() {
  try {
    const data = await Api.getDashboard();
    document.getElementById("balanceVal").textContent = formatMoney(data.balance);
    document.getElementById("depositsVal").textContent = formatMoney(data.total_deposits);
    document.getElementById("withdrawalsVal").textContent = formatMoney(data.total_withdrawals);
    document.getElementById("countVal").textContent = data.transaction_count;
    renderLatestTable(data.latest_transactions);
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("openDepositBtn")?.addEventListener("click", () => {
  document.getElementById("depositForm").reset();
  depositModal.classList.add("show");
});
document.getElementById("closeDepositBtn").addEventListener("click", () => depositModal.classList.remove("show"));

document.getElementById("openWithdrawBtn")?.addEventListener("click", () => {
  document.getElementById("withdrawForm").reset();
  withdrawModal.classList.add("show");
});
document.getElementById("closeWithdrawBtn").addEventListener("click", () => withdrawModal.classList.remove("show"));

document.getElementById("depositForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await Api.deposit({
      amount: parseFloat(document.getElementById("depAmount").value),
      donor_name: document.getElementById("depDonor").value.trim(),
      date: document.getElementById("depDate").value || undefined,
      notes: document.getElementById("depNotes").value.trim() || undefined,
    });
    depositModal.classList.remove("show");
    showToast("Deposit recorded successfully.");
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
});

document.getElementById("withdrawForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await Api.withdraw({
      amount: parseFloat(document.getElementById("wdAmount").value),
      reason: document.getElementById("wdReason").value.trim(),
      date: document.getElementById("wdDate").value || undefined,
      notes: document.getElementById("wdNotes").value.trim() || undefined,
    });
    withdrawModal.classList.remove("show");
    showToast("Withdrawal recorded successfully.");
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// Bootstrap: everything here depends on knowing who's logged in and their role first
(async function init() {
  const session = await Auth.requireLogin();
  if (!session) return; // already redirecting to login.html

  renderTopbar("dashboard");
  if (Auth.isAdmin()) {
    document.getElementById("adminActions").style.display = "block";
  }
  loadDashboard();
})();
