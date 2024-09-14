var queryString = window.location.search;
var params = new URLSearchParams(queryString);
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function eraseCookie(name) {
  document.cookie = name + "=; Max-Age=-99999999; path=/";
}
function clearCookies() {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
}
function getCookie(name) {
  const nameEQ = name + "=";
  const cookiesArray = document.cookie.split(";");
  for (let i = 0; i < cookiesArray.length; i++) {
    let cookie = cookiesArray[i];
    while (cookie.charAt(0) === " ")
      cookie = cookie.substring(1, cookie.length);
    if (cookie.indexOf(nameEQ) === 0)
      return cookie.substring(nameEQ.length, cookie.length);
  }
  return null;
}
function logout() {
  window.location = "/login";
  clearCookies();
}
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

const g_auth_key = getCookie("auth_key");
fetch("/api/getUserDetails", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    g_auth_key,
  }),
})
  .then((response) => {
    switch (response.status) {
      case 200: {
        return response.json();
      }
      case 404: {
        if (g_auth_key != null) {
          logout();
        }
        break;
      }
    }
  })
  .then((data) => {
    setCookie("login", data.username);
    setCookie("name", data.name);
    setCookie("surname", data.surname);
  })
  .catch((error) => {
    console.log(error.message);
  });
