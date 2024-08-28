if (getCookie("group") == "admin") {
  Array.from(document.getElementsByClassName("admin-btn")).forEach((btn) => {
    btn.classList.remove("hidden");
  });
}
let testList = getCookie("allowedTests")
  .split(",")
  .map((item) => (isNaN(item) ? item : parseInt(item)));
if (!testList.includes("all")) {
  for (var l = 1; l <= 5; l++) {
    if (testList.includes(l)) {
      document.getElementById("b1").classList.remove("blurred");
    }
  }
  for (var l = 6; l <= 11; l++) {
    if (testList.includes(l)) {
      document.getElementById("b2").classList.remove("blurred");
    }
  }
  for (var l = 12; l <= 19; l++) {
    if (testList.includes(l)) {
      document.getElementById("b3").classList.remove("blurred");
    }
  }
  for (var l = 20; l <= 25; l++) {
    if (testList.includes(l)) {
      document.getElementById("b4").classList.remove("blurred");
    }
  }
  for (var l = 26; l <= 32; l++) {
    if (testList.includes(l)) {
      document.getElementById("b5").classList.remove("blurred");
    }
  }
  if (testList.includes("нмт")) {
    document.getElementById("NMT").classList.remove("blurred");
  }
} else {
  Array.from(document.getElementsByClassName("blurred")).forEach((element) => {
    element.classList.remove("blurred");
  });
}
