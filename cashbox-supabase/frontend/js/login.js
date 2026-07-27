Auth.redirectIfLoggedIn();

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("loginBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.className = "error-msg";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in...";

  try {
    await Api.login(email, password);
    window.location.href = "index.html";
  } catch (err) {
    errorMsg.textContent = err.message || "Login failed. Check your credentials.";
    errorMsg.className = "error-msg show";
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Log in";
  }
});
