// Edit this list to change which currencies your cash box tracks.
// The first entry is the default selected in the deposit/withdraw forms.
//
// If you add/remove/rename codes here, also update the matching
// `check (currency in (...))` constraint in database/supabase_schema.sql
// (or run a new migration like database/migration_add_currency.sql).
const CURRENCIES = [
  { code: "USD", symbol: "$", label_en: "US Dollar", label_ar: "دولار أمريكي" },
  { code: "SYP", symbol: "ل.س", label_en: "Syrian Pound", label_ar: "ليرة سورية" },
];

function currencyLabel(code) {
  const c = CURRENCIES.find((x) => x.code === code);
  if (!c) return code;
  return I18N.lang === "ar" ? c.label_ar : c.label_en;
}

function currencySymbol(code) {
  const c = CURRENCIES.find((x) => x.code === code);
  return c ? c.symbol : code;
}

function currencyOptionsHtml(selectedCode) {
  return CURRENCIES.map(
    (c) => `<option value="${c.code}" ${c.code === selectedCode ? "selected" : ""}>${currencyLabel(c.code)} (${c.symbol})</option>`
  ).join("");
}
