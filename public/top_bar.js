document.addEventListener("DOMContentLoaded", function () {
  $(function () {
    $("#top_bar-placeholder").load("/top_bar.html", function () {
      // This code runs after the top_bar is fully loaded
      if (auth_key != null) {
        document.getElementById("login").classList.add("display-none");
        document.getElementById("profile").classList.remove("display-none");
        document.getElementById("my_courses").classList.remove("display-none");
        document.getElementById("stats").classList.remove("display-none");
      }
      if (
        getCookie("coursesOwned") != [] &&
        getCookie("coursesOwned") != null
      ) {
        document.getElementById("admin_panel").classList.remove("display-none");
      }
      let __tag = "";
      if (window.matchMedia("(max-width: 965px)").matches) {
        $(function () {
          $("#mobile_menu-placeholder").load("/mobile_menu.html", function () {
            if (auth_key != null) {
              document
                .getElementById("mobile_menu-list-login")
                .classList.add("display-none");
              const elements_remove = [
                "mobile_menu-list-profile",
                "mobile_menu-list-logout",
                "mobile_menu-list-my_courses",
                "mobile_menu-list-stats",
              ];
              Array.from(elements_remove).forEach((element) => {
                document
                  .getElementById(element)
                  .classList.remove("display-none");
              });
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

            current_page = document.getElementById(
              "mobile_menu-list-" + pageName
            );
            if (current_page) {
              current_page.classList.add("white_text");
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

function changePage(mobile, page, params) {
  let goToLoc = `/${page}/`;
  if (params != null && params != []) {
    goToLoc += "?";
    Array.from(params).forEach((param) => {
      goToLoc += `${param}&`;
    });
  }
  if (mobile) {
    Array.from(document.getElementsByClassName("category-items-page")).forEach(
      (element) => {
        element.classList.remove("white_text");
      }
    );
    const going_page = document.getElementById("mobile_menu-list-" + page);
    if (going_page) {
      going_page.classList.add("white_text");
    }
    setTimeout(showMobileMenu, 200);
    setTimeout(() => {
      window.location = goToLoc;
    }, 700);
  } else {
    window.location = goToLoc;
  }
}
