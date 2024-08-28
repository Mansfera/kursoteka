document.addEventListener("DOMContentLoaded", function () {
    $(function () {
      $("#top_bar-placeholder").load("/top_bar.html", function () {
        // This code runs after the top_bar is fully loaded
        if (getCookie("auth_key") != null) {
          document.getElementById("login").classList.add("display-none");
          document.getElementById("profile").classList.remove("display-none");
        }
        if (getCookie("coursesOwned") != [] && getCookie("coursesOwned") != null) {
            document.getElementById("admin_panel").classList.remove("display-none");
          }
      });
    });
  });
  

function goToHomepage() {
  window.location = "/landing/";
}
function goToContacts() {
  window.location = "/contacts/";
}
function goToControlPanel() {
  window.location = "/admin-board/";
}
function goToLogin() {
  window.location = "/login/";
}
function goToProfile() {
  window.location = "/profile/";
}
