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
                .getElementById("mobile_menu-list-login")
                .classList.add("display-none");
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
            let path = window.location.pathname;

            let pageName = path.replace(/^\/|\/$/g, "");

            document
              .getElementById("mobile_menu-list-" + pageName)
              .classList.add("white_text");
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

function changePage(page) {
  Array.from(document.getElementsByClassName("category-items-page")).forEach(
    (element) => {
      element.classList.remove("white_text");
    }
  );
  document
    .getElementById("mobile_menu-list-" + page)
    .classList.add("white_text");
  setTimeout(showMobileMenu, 200);
  setTimeout(() => {
    window.location = `/${page}/`;
  }, 700);
}
