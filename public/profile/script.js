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
