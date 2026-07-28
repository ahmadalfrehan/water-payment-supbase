I18N.applyStaticTranslations();
Auth.redirectIfLoggedIn();

document.getElementById("langToggleBtn").addEventListener("click", () => I18N.toggle());

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("loginBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.className = "error-msg";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginBtn.disabled = true;
  loginBtn.textContent = I18N.t("btn_login_loading");

  try {
    await Api.login(email, password);
    window.location.href = "index.html";
  } catch (err) {
    errorMsg.textContent = err.message || I18N.t("err_login_default");
    errorMsg.className = "error-msg show";
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = I18N.t("btn_login");
  }
});
