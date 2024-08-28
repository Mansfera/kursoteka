let testList = getCookie("allowedTests")
  .split(",")
  .map((item) => (isNaN(item) ? item : parseInt(item)));
if (!testList.includes("all")) {
  for (var i = 6; i <= 11; i++) {
    var block = document.getElementById("t" + i);
    if (!testList.includes(i)) {
      block.classList.add("blurred");
    }
  }
}
Array.from(document.getElementsByClassName("edit-test")).forEach((elem) => {
  if (getCookie("group") === "admin") {
    elem.classList.remove("hidden");
  }
});
