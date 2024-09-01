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

function fetchAndDisplayUserCourses() {
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

document.addEventListener("DOMContentLoaded", fetchAndDisplayUserCourses);
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
