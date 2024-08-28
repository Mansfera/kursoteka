var queryString = window.location.search;
var params = new URLSearchParams(queryString);

if (window.innerHeight < window.innerWidth) {
  Array.from(document.getElementsByClassName("exit_btn")).forEach((button) => {
    button.classList.add("hidden");
  });
} else {
  Array.from(document.getElementsByClassName("exit_btn")).forEach((button) => {
    button.classList.remove("hidden");
  });
}

checkForAccess();
// setInterval(checkForAccess, 1000);
function checkForAccess() {
  if (
    !window.location.pathname.includes("login") &&
    // (getCookie("login") == null || getCookie("password") == null)
    getCookie("auth_key") == null
  ) {
    window.location =
      "/login/?status_line=" +
      encodeURIComponent("Будь ласка увійдіть в акаунт");
  } else {
    if (getCookie("login") != null && getCookie("password") != null) {
      sendLoginInfo(getCookie("login"), getCookie("password"));
    }
  }
}