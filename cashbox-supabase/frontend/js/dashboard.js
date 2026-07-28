const depositModal = document.getElementById("depositModal");
const withdrawModal = document.getElementById("withdrawModal");

function typeTag(type) {
  return `<span class="type-tag ${type}">${I18N.t(type === "deposit" ? "type_deposit" : "type_withdraw")}</span>`;
}

function renderCurrencyCards(byCurrency, totalCount) {
  const wrap = document.getElementById("currencyCards");
  const cardsHtml = byCurrency
    .filter((c) => c.total_deposits > 0 || c.total_withdrawals > 0) // hide unused currencies
    .map(
      (c) => `
    <div class="card balance">
      <div class="label">${I18N.t("card_balance")} — ${currencyLabel(c.currency)}</div>
      <div class="value">${formatMoney(c.balance, c.currency)}</div>
    </div>
    <div class="card deposits">
      <div class="label">${I18N.t("card_deposits")} — ${currencyLabel(c.currency)}</div>
      <div class="value">${formatMoney(c.total_deposits, c.currency)}</div>
    </div>
    <div class="card withdrawals">
      <div class="label">${I18N.t("card_withdrawals")} — ${currencyLabel(c.currency)}</div>
      <div class="value">${formatMoney(c.total_withdrawals, c.currency)}</div>
    </div>
  `
    )
    .join("");

  wrap.innerHTML = `
    ${cardsHtml}
    <div class="card">
      <div class="label">${I18N.t("card_count")}</div>
      <div class="value">${totalCount}</div>
    </div>
  `;
}

function renderLatestTable(items) {
  const wrap = document.getElementById("latestTableWrap");
  if (!items.length) {
    wrap.innerHTML = `<p class="empty-state">${I18N.t("no_transactions_yet")}</p>`;
    return;
  }
  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>${I18N.t("th_type")}</th><th>${I18N.t("th_amount")}</th><th>${I18N.t("th_date")}</th>
          <th>${I18N.t("th_donor_reason")}</th><th>${I18N.t("th_user")}</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(t => `
          <tr>
            <td>${typeTag(t.type)}</td>
            <td class="amount ${t.type}">${t.type === "deposit" ? "+" : "-"}${formatMoney(t.amount, t.currency)}</td>
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
    renderCurrencyCards(data.by_currency, data.transaction_count);
    renderLatestTable(data.latest_transactions);
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("openDepositBtn")?.addEventListener("click", () => {
  document.getElementById("depositForm").reset();
  document.getElementById("depCurrency").innerHTML = currencyOptionsHtml(CURRENCIES[0].code);
  depositModal.classList.add("show");
});
document.getElementById("closeDepositBtn").addEventListener("click", () => depositModal.classList.remove("show"));

document.getElementById("openWithdrawBtn")?.addEventListener("click", () => {
  document.getElementById("withdrawForm").reset();
  document.getElementById("wdCurrency").innerHTML = currencyOptionsHtml(CURRENCIES[0].code);
  withdrawModal.classList.add("show");
});
document.getElementById("closeWithdrawBtn").addEventListener("click", () => withdrawModal.classList.remove("show"));

document.getElementById("depositForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await Api.deposit({
      amount: parseFloat(document.getElementById("depAmount").value),
      currency: document.getElementById("depCurrency").value,
      donor_name: document.getElementById("depDonor").value.trim(),
      date: document.getElementById("depDate").value || undefined,
      notes: document.getElementById("depNotes").value.trim() || undefined,
    });
    depositModal.classList.remove("show");
    showToast(I18N.t("toast_deposit_success"));
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
      currency: document.getElementById("wdCurrency").value,
      reason: document.getElementById("wdReason").value.trim(),
      date: document.getElementById("wdDate").value || undefined,
      notes: document.getElementById("wdNotes").value.trim() || undefined,
    });
    withdrawModal.classList.remove("show");
    showToast(I18N.t("toast_withdrawal_success"));
    loadDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// Bootstrap: everything here depends on knowing who's logged in and their role first
(async function init() {
  const session = await Auth.requireLogin();
  if (!session) return; // already redirecting to login.html

  I18N.applyStaticTranslations();
  renderTopbar("dashboard");
  if (Auth.isAdmin()) {
    document.getElementById("adminActions").style.display = "block";
  }
  loadDashboard();
})();
