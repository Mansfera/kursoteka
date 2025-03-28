var queryString = window.location.search;
var params = new URLSearchParams(queryString);
if (auth_key != null && params.get("noRedirect") == null) {
  window.location = "/";
}

function register() {
  const username = document.getElementById("name").value.toString();
  const surname = document.getElementById("surname").value.toString();
  const login = document.getElementById("login").value.toString().toLowerCase();
  const password = document.getElementById("password").value.toString();
  document.getElementById("status_wrapper").classList.remove("display-none");

  if (
    !login.includes(" ") &&
    !password.includes(" ") &&
    !login.includes('"') &&
    !password.includes('"')
  ) {
    if (login.length <= 32 && password.length <= 32) {
      if (login.length > 2) {
        if (username.length >= 2 && surname.length >= 2) {
          sendRegisterInfo(login, password, username, surname);
        }
        {
          document.getElementById("status_line").innerHTML =
            "Введіть ваше прізвище та імʼя";
        }
      } else {
        document.getElementById("status_line").innerHTML =
          "Логін має бути довшим ніж 2 символи";
      }
    } else {
      document.getElementById("status_line").innerHTML =
        "Логін чи пароль не можуть бути довшими ніж 32 символи";
    }
  } else {
    document.getElementById("status_line").innerHTML =
      "Логін чи пароль можуть містити БУДЬ ЯКІ символи крім пробілів, \" та '";
  }
}
function sendRegisterInfo(login, password, name, surname) {
  fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login, password, name, surname }),
  })
    .then((response) => {
      switch (response.status) {
        case 200: {
          return response.json();
        }
        case 403: {
          document.getElementById("status_line").innerHTML =
            "Пробачте, але користувач з таким логіном вже існує";
          break;
        }
        default: {
          console.log("Unexpected response status:", response.status);
          break;
        }
      }
    })
    .then((data) => {
      if (data) {
        setCookie("group", data.group, 730);
        setCookie("auth_key", data.auth_key, 730);
        setCookie("coursesOwned", data.coursesOwned, 730);
        setCookie("login", login);
        setCookie("name", name);
        setCookie("surname", surname);
        window.location = "/";
      }
    })
    .catch((error) => {
      console.log("Error:", error.message);
    });
}
let password_warning = false;
function login_func() {
  document.getElementById("status_wrapper").classList.remove("display-none");
  const form_fields = document.getElementById("form-fields");
  form_fields.style.marginBottom = "0";
  const login = document.getElementById("login").value.toString().toLowerCase();
  const password = document.getElementById("password").value.toString();

  if (login.length > 2) {
    Array.from(form_fields.children).forEach((half) => {
      half.classList.add("move");
      document.getElementById("form-name").innerHTML = "Ще трішки";
    });
  }

  if (
    !login.includes(" ") &&
    !login.includes('"') &&
    !password.includes(" ") &&
    !password.includes('"')
  ) {
    if (login.length <= 32 && password.length <= 32) {
      if (login.length > 2) {
        if (password.length > 6) {
          sendLoginInfo(login.toLowerCase(), password);
        } else {
          if (password_warning) {
            document.getElementById("status_line").innerHTML =
              "Пароль має бути довшим за 6 символів";
          } else {
            document.getElementById("status_line").innerHTML = "Введіть пароль";
          }
          password_warning = true;
        }
      } else {
        document.getElementById("status_line").innerHTML =
          "Логін має бути довшим ніж 2 символи";
      }
    } else {
      document.getElementById("status_line").innerHTML =
        "Логін чи пароль не можуть бути довшими ніж 32 символи";
    }
  } else {
    document.getElementById("status_line").innerHTML =
      "Логін чи пароль можуть містити БУДЬ ЯКІ символи крім пробілів, \" та '";
  }
}
function sendLoginInfo(login, password) {
  fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ login, password }),
  })
    .then((response) => {
      switch (response.status) {
        case 200: {
          return response.json();
        }
        case 403: {
          document
            .getElementById("status_wrapper")
            .classList.remove("display-none");
          document.getElementById("status_line").innerHTML =
            "Пароль не правильний. Якщо ви його забули - зверніться у підтримку!";
          break;
        }
        case 404: {
          document
            .getElementById("registerBtn")
            .classList.remove("display-none");
          document
            .getElementById("status_wrapper")
            .classList.remove("display-none");
          document.getElementById("status_line").innerHTML =
            "Користувача не знайдено, бажаєте зареєструватися?";
          document.getElementById("password").value = "";
          document.getElementById("password").ariaAutoComplete = "new-password";
          Array.from(document.getElementsByClassName("register_input")).forEach(
            (input) => {
              input.classList.remove("display-none");
            }
          );
          document.getElementById("form-name").innerHTML =
            "Необхідна інформація";

          document.getElementById("loginBtn").innerHTML = "Увійти";
          document.getElementById("loginBtn").classList.add("display-none");
          break;
        }
      }
    })
    .then((data) => {
      if (data) {
        setCookie("group", data.group, 730);
        setCookie("auth_key", data.auth_key, 730);
        setCookie("coursesOwned", data.coursesOwned, 730);
        setCookie("login", login);
        setCookie("name", data.name);
        setCookie("surname", data.surname);
        window.location = "/";
      }
    })
    .catch((error) => {
      console.log(error.message);
    });
}
