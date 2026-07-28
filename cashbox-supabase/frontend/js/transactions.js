const PAGE_SIZE = 15;
let currentPage = 1;
let currentFilters = {};
let pendingDeleteId = null;

function typeTag(type) {
  return `<span class="type-tag ${type}">${I18N.t(type === "deposit" ? "type_deposit" : "type_withdraw")}</span>`;
}

function renderTable(items) {
  const wrap = document.getElementById("tableWrap");
  if (!items.length) {
    wrap.innerHTML = `<p class="empty-state">${I18N.t("no_transactions_found")}</p>`;
    return;
  }
  const isAdmin = Auth.isAdmin();
  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>${I18N.t("th_type")}</th><th>${I18N.t("th_amount")}</th><th>${I18N.t("th_currency")}</th>
          <th>${I18N.t("th_date")}</th><th>${I18N.t("th_donor_reason")}</th>
          <th>${I18N.t("th_notes")}</th><th>${I18N.t("th_user")}</th><th>${I18N.t("th_created_at")}</th>
          ${isAdmin ? `<th>${I18N.t("th_actions")}</th>` : ""}
        </tr>
      </thead>
      <tbody>
        ${items.map(t => `
          <tr>
            <td>${typeTag(t.type)}</td>
            <td class="amount ${t.type}">${t.type === "deposit" ? "+" : "-"}${formatMoney(t.amount, t.currency)}</td>
            <td>${currencyLabel(t.currency)}</td>
            <td>${t.date}</td>
            <td>${t.donor_name || t.withdrawal_reason || "—"}</td>
            <td>${t.notes || "—"}</td>
            <td>${t.created_by_username}</td>
            <td>${new Date(t.created_at).toLocaleString()}</td>
            ${isAdmin ? `
              <td>
                <button class="btn btn-sm" data-edit="${t.id}">${I18N.t("btn_edit")}</button>
                <button class="btn btn-sm btn-danger" data-delete="${t.id}">${I18N.t("btn_delete")}</button>
              </td>` : ""}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  if (isAdmin) {
    wrap.querySelectorAll("[data-edit]").forEach(btn =>
      btn.addEventListener("click", () => openEditModal(items.find(t => t.id == btn.dataset.edit)))
    );
    wrap.querySelectorAll("[data-delete]").forEach(btn =>
      btn.addEventListener("click", () => openDeleteModal(btn.dataset.delete))
    );
  }
}

function renderPagination(total, page) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const el = document.getElementById("pagination");
  el.innerHTML = `
    <button class="btn btn-sm" id="prevPageBtn" ${page <= 1 ? "disabled" : ""}>${I18N.t("pagination_prev")}</button>
    <span>${I18N.t("pagination_page_of", { page, totalPages, total })}</span>
    <button class="btn btn-sm" id="nextPageBtn" ${page >= totalPages ? "disabled" : ""}>${I18N.t("pagination_next")}</button>
  `;
  document.getElementById("prevPageBtn").addEventListener("click", () => { currentPage--; loadTransactions(); });
  document.getElementById("nextPageBtn").addEventListener("click", () => { currentPage++; loadTransactions(); });
}

async function loadTransactions() {
  try {
    const data = await Api.getTransactions({ page: currentPage, pageSize: PAGE_SIZE, ...currentFilters });
    renderTable(data.items);
    renderPagination(data.total, data.page);
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("applyFiltersBtn").addEventListener("click", () => {
  currentFilters = {
    search: document.getElementById("searchInput").value.trim(),
    dateFrom: document.getElementById("dateFrom").value,
    dateTo: document.getElementById("dateTo").value,
  };
  currentPage = 1;
  loadTransactions();
});

document.getElementById("searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("applyFiltersBtn").click();
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  try {
    const csv = await Api.exportCsv(currentFilters);
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "transactions.csv";
    link.click();
  } catch (err) {
    showToast(I18N.t("toast_export_failed"), "error");
  }
});

// ---------- Edit modal ----------
const editModal = document.getElementById("editModal");

function openEditModal(t) {
  document.getElementById("editId").value = t.id;
  document.getElementById("editAmount").value = t.amount;
  document.getElementById("editCurrency").innerHTML = currencyOptionsHtml(t.currency);
  document.getElementById("editDate").value = t.date;
  document.getElementById("editNotes").value = t.notes || "";
  document.getElementById("editDonorLabel").textContent = I18N.t(t.type === "deposit" ? "label_donor_name" : "label_reason");
  document.getElementById("editDonor").value = t.donor_name || t.withdrawal_reason || "";
  editModal.dataset.type = t.type;
  editModal.classList.add("show");
}
document.getElementById("closeEditBtn").addEventListener("click", () => editModal.classList.remove("show"));

document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const type = editModal.dataset.type;
  const payload = {
    amount: parseFloat(document.getElementById("editAmount").value),
    currency: document.getElementById("editCurrency").value,
    date: document.getElementById("editDate").value,
    notes: document.getElementById("editNotes").value.trim() || null,
  };
  if (type === "deposit") payload.donor_name = document.getElementById("editDonor").value.trim();
  else payload.withdrawal_reason = document.getElementById("editDonor").value.trim();

  try {
    await Api.updateTransaction(id, payload);
    editModal.classList.remove("show");
    showToast(I18N.t("toast_updated"));
    loadTransactions();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// ---------- Delete modal ----------
const deleteModal = document.getElementById("deleteModal");
function openDeleteModal(id) {
  pendingDeleteId = id;
  deleteModal.classList.add("show");
}
document.getElementById("closeDeleteBtn").addEventListener("click", () => deleteModal.classList.remove("show"));
document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
  try {
    await Api.deleteTransaction(pendingDeleteId);
    deleteModal.classList.remove("show");
    showToast(I18N.t("toast_deleted"));
    loadTransactions();
  } catch (err) {
    showToast(err.message, "error");
  }
});

// Bootstrap
(async function init() {
  const session = await Auth.requireLogin();
  if (!session) return;

  I18N.applyStaticTranslations();
  renderTopbar("transactions");
  loadTransactions();
})();
