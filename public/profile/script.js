document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("login").value = getCookie("login");
  document.getElementById("name").value = getCookie("name");
  document.getElementById("surname").value = getCookie("surname");
  var codeInput = document.getElementById("activation-code");

  function formatCode(value) {
    // Remove any non-alphanumeric characters
    value = value.replace(/[^a-zA-Z0-9]/g, "");

    // Convert to uppercase
    value = value.toUpperCase();

    // Add hyphens
    var formattedValue = "";
    for (var i = 0; i < value.length; i++) {
      if (i > 0 && i % 5 === 0 && i < 15) {
        formattedValue += "-";
      }
      formattedValue += value[i];
    }

    return formattedValue;
  }

  codeInput.addEventListener("input", function (e) {
    var cursorPosition = e.target.selectionStart;
    var oldLength = e.target.value.length;

    e.target.value = formatCode(e.target.value);

    var newLength = e.target.value.length;
    cursorPosition += newLength - oldLength;

    // Adjust cursor position if a hyphen was added or removed
    if (cursorPosition > 5 && e.target.value[5] === "-") cursorPosition++;
    if (cursorPosition > 11 && e.target.value[11] === "-") cursorPosition++;

    e.target.setSelectionRange(cursorPosition, cursorPosition);

    if (e.target.value.length > 16) {
      document
        .getElementById("course_activation-button")
        .classList.remove("display-none");
    }
  });

  codeInput.addEventListener("paste", function (e) {
    e.preventDefault();
    var pastedText = (e.clipboardData || window.clipboardData).getData("text");
    e.target.value = formatCode(pastedText);
    if (e.target.value.length > 16) {
      document
        .getElementById("course_activation-button")
        .classList.remove("display-none");
    }
  });
});
const authKey = getCookie("auth_key");

function redeemCode() {
  const activationCode = document.getElementById("activation-code").value;
  const data = {
    auth_key: authKey,
    code: activationCode,
  };

  fetch("/api/activateCode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => {
      if (json.message) {
        const button = document.getElementById("course_activation-button");
        button.textContent = json.message;
        document.getElementById("activation-code").value = "";
        setTimeout(() => {
          button.textContent = "Активувати код";
        }, 5000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function saveUserData() {
  const login = document.getElementById("login").value;
  const name = document.getElementById("name").value;
  const surname = document.getElementById("surname").value;
  var _login;
  if (login != "") {
    _login = login;
  }
  var _name;
  if (name != "") {
    _name = name;
  }
  var _surname;
  if (surname != "") {
    _surname = surname;
  }

  const data = {
    auth_key: authKey,
    login: _login,
    name: _name,
    surname: _surname,
  };
  fetch("/api/changeUserCredentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => {
      if (json.message) {
        const button = document.getElementById("save_user_data");
        button.textContent = json.message;
        if (login != "") {
          setCookie("login", login);
        }
        if (name != "") {
          setCookie("name", name);
        }
        if (surname != "") {
          setCookie("surname", surname);
        }
        setTimeout(() => {
          button.textContent = "Зберегти";
        }, 3000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
