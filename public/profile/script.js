function fetchAndDisplayUserCourses() {
  let auth_key = getCookie("auth_key");
  fetch("/api/getUserCourses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auth_key }),
  })
    .then((response) => response.json())
    .then((data) => {
      const courseListElement = document.getElementById("course_list");

      if (data.courses.length > 0) {
        data.courses.forEach((course) => {
          const courseCard = document.createElement("div");
          courseCard.className = "courses-card-wrapper";
          courseCard.innerHTML = `
            <div class="courses-card" id="course_card-${course.id}">
              <div class="card-top_buttons">
                <div
                  class="card-course_stats card-blob white_text"
                  id="course_stats-${course.id}"
                >Статистика</div>
                <div class="card-course_start_btn card-blob" id="course_start-${course.id}">
                  <img src="/assets/play-triangle.png" alt="" />
                </div>
              </div>
              <div class="card-bottom">
                <div class="card-course_type card-blob white_text" id="course_type-${course.id}">${course.type}</div>
                <div
                  class="card-course_name white_text"
                  id="course_name-${course.id}"
                >${course.name}</div>
              </div>
            </div>
          `;
          const courseCardElement = courseCard.querySelector(".courses-card");
          courseCardElement.style.backgroundImage = `url('/api/getCoverImage?course=${course.id}&auth_key=${auth_key}')`;
          courseCardElement.addEventListener("click", function () {
            window.location.href = `/lessons/?id=${course.id}`;
          });
          courseListElement.appendChild(courseCard);
        });
      } else {
        const noCoursesElement = document.getElementById("no_courses_text");
        if (noCoursesElement) {
          noCoursesElement.classList.remove("display-none");
        } else {
          console.error("Element with ID 'no_courses_text' not found");
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching user courses:", error);
    });
}

document.addEventListener("DOMContentLoaded", fetchAndDisplayUserCourses);
document.addEventListener("DOMContentLoaded", function () {
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
  });

  codeInput.addEventListener("paste", function (e) {
    e.preventDefault();
    var pastedText = (e.clipboardData || window.clipboardData).getData("text");
    e.target.value = formatCode(pastedText);
  });
});

function redeemCode() {
  // Get the value from the input field with id "activation-code"
  const activationCode = document.getElementById("activation-code").value;

  // Get the auth_key from cookies
  const authKey = getCookie("auth_key");

  // Prepare the data to be sent in the POST request
  const data = {
    auth_key: authKey,
    code: activationCode,
  };

  // Send a POST request to /api/activateCode
  fetch("/api/activateCode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((json) => {
      // Check if the response has a "message"
      if (json.message) {
        const button = document.getElementById("course_activation-button");
        // Set the button text to the response message
        button.textContent = json.message;

        document.getElementById("course_list").innerHTML = "";
        document.getElementById("activation-code").value = "";
        fetchAndDisplayUserCourses();
        // Change the button text back to "Активувати код" after 5 seconds
        setTimeout(() => {
          button.textContent = "Активувати код";
        }, 5000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
