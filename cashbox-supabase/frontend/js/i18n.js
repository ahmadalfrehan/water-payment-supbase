const translations = {
  en: {
    brand: "💰 Cash Box",
    nav_dashboard: "Dashboard",
    nav_transactions: "Transactions",
    logout: "Log out",
    role_admin: "admin",
    role_viewer: "viewer",

    login_subtitle: "Sign in to continue",
    label_email: "Email",
    label_password: "Password",
    btn_login: "Log in",
    btn_login_loading: "Signing in...",
    err_login_default: "Login failed. Check your credentials.",

    card_balance: "Current Balance",
    card_deposits: "Total Deposits",
    card_withdrawals: "Total Withdrawals",
    card_count: "Transactions",
    quick_actions: "Quick Actions",
    btn_add_money: "＋ Add Money",
    btn_withdraw_money: "－ Withdraw Money",
    latest_transactions: "Latest Transactions",
    view_all: "View all transactions →",
    loading: "Loading…",
    no_transactions_yet: "No transactions yet.",

    modal_add_money_title: "Add Money",
    label_amount: "Amount",
    label_currency: "Currency",
    th_currency: "Currency",
    label_donor_name: "Donor Name",
    label_date: "Date",
    label_notes: "Notes",
    btn_save_deposit: "Save Deposit",
    btn_cancel: "Cancel",

    modal_withdraw_title: "Withdraw Money",
    label_reason: "Reason",
    btn_save_withdrawal: "Save Withdrawal",

    transactions_title: "Transactions",
    label_search: "Search",
    placeholder_search: "Donor, reason, notes…",
    label_from_date: "From date",
    label_to_date: "To date",
    btn_apply: "Apply",
    btn_export: "⬇ Export CSV",
    no_transactions_found: "No transactions found.",
    th_type: "Type",
    th_amount: "Amount",
    th_date: "Date",
    th_donor_reason: "Donor / Reason",
    th_notes: "Notes",
    th_user: "User",
    th_created_at: "Created At",
    th_actions: "Actions",
    btn_edit: "Edit",
    btn_delete: "Delete",
    pagination_prev: "← Prev",
    pagination_next: "Next →",
    pagination_page_of: "Page {page} of {totalPages} ({total} total)",

    modal_edit_title: "Edit Transaction",
    btn_save_changes: "Save Changes",

    modal_delete_title: "Delete Transaction",
    delete_confirm_text: "This cannot be undone. Are you sure you want to delete this transaction?",
    btn_confirm_delete: "Delete",

    toast_deposit_success: "Deposit recorded successfully.",
    toast_withdrawal_success: "Withdrawal recorded successfully.",
    toast_updated: "Transaction updated.",
    toast_deleted: "Transaction deleted.",
    toast_export_failed: "Export failed.",

    type_deposit: "Deposit",
    type_withdraw: "Withdrawal",

    lang_toggle: "العربية",
  },

  ar: {
    brand: "💰 صندوق النقدية",
    nav_dashboard: "لوحة التحكم",
    nav_transactions: "المعاملات",
    logout: "تسجيل الخروج",
    role_admin: "مسؤول",
    role_viewer: "مشاهد",

    login_subtitle: "سجّل الدخول للمتابعة",
    label_email: "البريد الإلكتروني",
    label_password: "كلمة المرور",
    btn_login: "تسجيل الدخول",
    btn_login_loading: "جارٍ تسجيل الدخول...",
    err_login_default: "فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.",

    card_balance: "الرصيد الحالي",
    card_deposits: "إجمالي الإيداعات",
    card_withdrawals: "إجمالي السحوبات",
    card_count: "عدد المعاملات",
    quick_actions: "إجراءات سريعة",
    btn_add_money: "＋ إضافة مبلغ",
    btn_withdraw_money: "－ سحب مبلغ",
    latest_transactions: "أحدث المعاملات",
    view_all: "عرض جميع المعاملات ←",
    loading: "جارٍ التحميل…",
    no_transactions_yet: "لا توجد معاملات بعد.",

    modal_add_money_title: "إضافة مبلغ",
    label_amount: "المبلغ",
    label_currency: "العملة",
    th_currency: "العملة",
    label_donor_name: "اسم المتبرع",
    label_date: "التاريخ",
    label_notes: "ملاحظات",
    btn_save_deposit: "حفظ الإيداع",
    btn_cancel: "إلغاء",

    modal_withdraw_title: "سحب مبلغ",
    label_reason: "السبب",
    btn_save_withdrawal: "حفظ السحب",

    transactions_title: "المعاملات",
    label_search: "بحث",
    placeholder_search: "المتبرع، السبب، الملاحظات…",
    label_from_date: "من تاريخ",
    label_to_date: "إلى تاريخ",
    btn_apply: "تطبيق",
    btn_export: "⬇ تصدير CSV",
    no_transactions_found: "لم يتم العثور على معاملات.",
    th_type: "النوع",
    th_amount: "المبلغ",
    th_date: "التاريخ",
    th_donor_reason: "المتبرع / السبب",
    th_notes: "ملاحظات",
    th_user: "المستخدم",
    th_created_at: "تاريخ الإنشاء",
    th_actions: "إجراءات",
    btn_edit: "تعديل",
    btn_delete: "حذف",
    pagination_prev: "السابق",
    pagination_next: "التالي",
    pagination_page_of: "صفحة {page} من {totalPages} (الإجمالي {total})",

    modal_edit_title: "تعديل المعاملة",
    btn_save_changes: "حفظ التغييرات",

    modal_delete_title: "حذف المعاملة",
    delete_confirm_text: "لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد أنك تريد حذف هذه المعاملة؟",
    btn_confirm_delete: "حذف",

    toast_deposit_success: "تم تسجيل الإيداع بنجاح.",
    toast_withdrawal_success: "تم تسجيل السحب بنجاح.",
    toast_updated: "تم تحديث المعاملة.",
    toast_deleted: "تم حذف المعاملة.",
    toast_export_failed: "فشل التصدير.",

    type_deposit: "إيداع",
    type_withdraw: "سحب",

    lang_toggle: "English",
  },
};

const I18N = {
  STORAGE_KEY: "cb_lang",

  get lang() {
    return localStorage.getItem(this.STORAGE_KEY) || "en";
  },

  set lang(value) {
    localStorage.setItem(this.STORAGE_KEY, value);
  },

  t(key, vars = {}) {
    let str = (translations[this.lang] && translations[this.lang][key]) || translations.en[key] || key;
    Object.keys(vars).forEach((k) => {
      str = str.replace(`{${k}}`, vars[k]);
    });
    return str;
  },

  applyDirection() {
    document.documentElement.lang = this.lang;
    document.documentElement.dir = this.lang === "ar" ? "rtl" : "ltr";
  },

  applyStaticTranslations() {
    this.applyDirection();
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
  },

  toggle() {
    this.lang = this.lang === "en" ? "ar" : "en";
    window.location.reload();
  },
};

I18N.applyDirection(); // run immediately so RTL applies before the page paints
