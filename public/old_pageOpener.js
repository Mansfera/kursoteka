function editTest(block, id) {
  window.location = "/testEditor/?&block=" + block + "&id=" + id;
}
function openTest(block, id) {
  window.location = "/test/?&block=" + block + "&id=" + id + "&test_type=short";
}
function openFullTest(block, id) {
  window.location = "/test/?&block=" + block + "&id=" + id + "&test_type=full";
}
function openFinalTest(block) {
  window.location = "/test/?&block=" + block + "&test_type=final";
}
function exitToMenu() {
  window.location = "/";
}
function toAdminBoard() {
  window.location = "/admin-board/";
}
function openBlock(block) {
  window.location = "/block" + block;
}
function openVideo(block, test) {
  window.location = "/video-player/?&block=" + block + "&id=" + test;
}
function updateTime() {
  var time = Math.floor((getCookie("expire_date") * 1000 - Date.now()) / 1000);
  let days = Math.floor(time / 60 / 60 / 24);
  let hours = Math.floor(time / 60 / 60) - days * 24;
  hours = hours < 10 ? "0" + hours : hours;
  let minutes = Math.floor(time / 60) - hours * 60 - days * 24 * 60;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  let seconds = time % 60;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  if (getCookie("expire_date") != "never") {
    if (time < 0) {
      clearInterval(everySecInvterval);
      window.location =
        "/login/?status_line=" +
        encodeURIComponent("⚠️ Ваш доступ закінчився ⚠️");
    }
    let warning = "";
    if (time < 900) {
      warning = " ⚠️";
    }

    let time_str = "";
    let amount_str = "";

    // відмінювання днів
    if (days >= 1) {
      if (days === 1) {
        amount_str = "день";
      } else if (days > 1 && days < 5) {
        amount_str = "дні";
      } else {
        amount_str = "днів";
      }
      time_str = days + " " + amount_str;
    }

    // відмінювання годин
    if (hours > 0) {
      if (hours === 1) {
        amount_str = "година";
      } else if (hours > 1 && hours < 5) {
        amount_str = "години";
      } else {
        amount_str = "годин";
      }
      time_str += " " + hours + " " + amount_str;
    }

    // відмінювання хвилин
    if (minutes > 0) {
      if (minutes === 1) {
        amount_str = "хвилина";
      } else if (minutes > 1 && minutes < 5) {
        amount_str = "хвилини";
      } else {
        amount_str = "хвилин";
      }
      time_str += " " + minutes + " " + amount_str;
    }

    // відмінювання секунд
    if (seconds > 0) {
      if (seconds === 1) {
        amount_str = "секунда";
      } else if (seconds > 1 && seconds < 5) {
        amount_str = "секунди";
      } else {
        amount_str = "секунд";
      }
      time_str += " " + seconds + " " + amount_str;
    }

    if (document.getElementById("remainingTime") != null) {
      if (days > 365 || getCookie("expire_date") == "never") {
        document.getElementById("remainingTime").classList.add("hidden");
      }
      document.getElementById("remainingTime").innerHTML =
        "Часу залишилося:" + time_str + warning;
    }
  }
}
