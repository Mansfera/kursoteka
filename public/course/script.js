document.addEventListener("DOMContentLoaded", function () {
  function updateDisplay() {
    const isMobile = window.innerWidth <= 576;

    const mobileElements = document.querySelectorAll(".__tag-mobile");
    const pcElements = document.querySelectorAll(".__tag-pc");

    mobileElements.forEach((element) => {
      if (isMobile) {
        element.classList.remove("display-none");
      } else {
        element.classList.add("display-none");
      }
    });

    pcElements.forEach((element) => {
      if (isMobile) {
        element.classList.add("display-none");
      } else {
        element.classList.remove("display-none");
      }
    });
  }
  updateDisplay();

  window.addEventListener("resize", updateDisplay);
});
const current_course = params.get("course");

function getCourseInfo() {
  fetch("/api/marketplace/getCourseInfo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ specific_course: current_course }),
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("course_name").innerHTML = data.courseName;
      document.getElementById("master-key_feature").innerHTML =
        data.masterFeature;
      currentCardId = 0;
      Array.from(data.courseDetails).forEach((card) => {
        currentCardId++;
        document.getElementById(
          "details_card-title-" + currentCardId
        ).innerHTML = card.title;
        document.getElementById(
          "details_card-text-" + currentCardId
        ).innerHTML = card.text;
      });
      document.getElementById("teacher_name").innerHTML = data.authorName;
      document.getElementById("teacher_bio").innerHTML = data.authorAbout;
      currentKeyFeatureId = 0;
      Array.from(data.keyFeatures).forEach((card) => {
        currentKeyFeatureId++;
        document.getElementById(
          "key_feature-top-" + currentKeyFeatureId
        ).innerHTML = card.top;
        document.getElementById(
          "key_feature-bottom-" + currentKeyFeatureId
        ).innerHTML = card.bottom;
      });

      const material_list = document.getElementById("segment-material_list");
      data.blocks.forEach((block) => {
        const blockCard = document.createElement("div");
        blockCard.className = "material_list-element";
        blockCard.innerHTML = `
                <div class="material_list-element-number white_text">0${block.id}</div>
                <div class="material_list-element-text white_text title_text">
                    ${block.name}
                </div>
              `;
        material_list.appendChild(blockCard);
      });
    })
    .catch((error) => {
      console.error("Error fetching user courses:", error);
    });
}

document.addEventListener("DOMContentLoaded", getCourseInfo);
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById(
    "about_course-horizontal"
  ).src = `/api/marketplace/getCourseImage?course=${current_course}&image_name=about_course-horizontal`;
  document.getElementById(
    "about_course-square-1"
  ).src = `/api/marketplace/getCourseImage?course=${current_course}&image_name=about_course-square-1`;
  document.getElementById(
    "about_course-square-2"
  ).src = `/api/marketplace/getCourseImage?course=${current_course}&image_name=about_course-square-2`;
  document.getElementById(
    "about_course-vertical"
  ).src = `/api/marketplace/getCourseImage?course=${current_course}&image_name=about_course-vertical`;
  document.getElementById(
    "about_course-square-3"
  ).src = `/api/marketplace/getCourseImage?course=${current_course}&image_name=about_course-square-3`;
  document.getElementById(
    "segment-half_screen_picture"
  ).style.backgroundImage = `url('/api/marketplace/getCourseImage?course=${current_course}&image_name=about_teacher_bg')`;
});
document.getElementByI("start_course").addEventListener("click", () => {
  if (g_auth_key) {
    fetch("/api/getUserCourses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ g_auth_key }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data) {
          if (data.courses.find((crs) => crs.id == current_course)) {
            window.location = `/lessons/?id=${current_course}`;
          }
        } else {
          window.location = `/my_courses/?showActivatoinCode=1`
        }
      });
  }
});
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

function redeemCode() {
  // Get the value from the input field with id "activation-code"
  const activationCode = document.getElementById("activation-code").value;

  // Get the auth_key from cookies

  // Prepare the data to be sent in the POST request
  const data = {
    auth_key,
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
        getCourseInfo();
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
