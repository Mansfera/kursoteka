document.addEventListener("DOMContentLoaded", function () {
  $(function () {
    $("#top_bar-placeholder").load("/top_bar.html", function () {
      // This code runs after the top_bar is fully loaded
      if (getCookie("auth_key") != null) {
        document.getElementById("login").classList.add("display-none");
        document.getElementById("profile").classList.remove("display-none");
        document.getElementById("my_courses").classList.remove("display-none");
      }
      if (
        getCookie("coursesOwned") != [] &&
        getCookie("coursesOwned") != null
      ) {
        document.getElementById("admin_panel").classList.remove("display-none");
      }
      let __tag = "";
      if (window.matchMedia("(max-width: 576px)").matches) {
        $(function () {
          $("#mobile_menu-placeholder").load("/mobile_menu.html", function () {
            if (getCookie("auth_key") != null) {
              document
                .getElementById("mobile_menu-list-profile")
                .classList.remove("display-none");
              document
                .getElementById("mobile_menu-list-my_courses")
                .classList.remove("display-none");
            }
            if (
              getCookie("coursesOwned") != [] &&
              getCookie("coursesOwned") != null
            ) {
              document
                .getElementById("mobile_menu-list-admin_panel")
                .classList.remove("display-none");
            }
          });
        });
        __tag = "__tag-pc";
      } else {
        document
          .getElementById("mobile_menu-placeholder")
          .classList.add("display-none");
        __tag = "__tag-mobile";
      }
      Array.from(document.getElementsByClassName(__tag)).forEach((element) => {
        element.classList.add("display-none");
      });
    });
  });
});

function showMobileMenu() {
  const mobile_menu = document.getElementById("mobile_menu-placeholder");
  mobile_menu.classList.toggle("collapsed");
}

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
function goToCourses() {
  window.location = "/my_courses/";
}
function goToProfile() {
  window.location = "/profile/";
}
