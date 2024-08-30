const auth_key = getCookie("auth_key");
let selected_course = "";
current_page = 1;

document.addEventListener("DOMContentLoaded", function () {
  const courseSelector = document.getElementById("course_selector-list");

  fetch("/api/getOwnedCourses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auth_key }),
  })
    .then((response) => response.json())
    .then((data) => {
      data.courses.forEach((course) => {
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = course.name;
        courseSelector.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching courses:", error);
    });
  courseSelector.addEventListener("change", function () {
    selected_course = this.value;
    if (selected_course != "") {
      document.getElementById(
        "main_wrapper"
      ).style.backgroundImage = `url('/api/getCoverImage?course=${selected_course}&auth_key=${auth_key}')`;
      getUsers();
      if (courseSelector.children[0].value == "") {
        courseSelector.children[0].remove();
      }
    }
  });
});
function getUsers() {
  fetch("/api/getUsers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_key,
      courseName: selected_course,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Invalid login or password");
      }
      return response.json();
    })
    .then((data) => {
      let students = data.students;
      const student_list = document.getElementById("student_list");
      student_list.innerHTML = "";
      Array.from(students).forEach((user) => {
        if (user.group != "admin") {
          let login = user.login;
          let username = login;
          if (user.name != "") {
            username = user.name;
          }
          let hasAccess = !user.courses[0].restricted;
          const wrapper = document.createElement("div");
          wrapper.className = "student_list-user_wrapper";

          wrapper.innerHTML = `
          <div class="student_list-user" id="user-${login}">
            <div class="user-name white_text" id="user-name-${login}">Імʼя: ${username}</div>
            <div class="user-action_buttons">
              <div class="action_buttons-item action_buttons-stats" id="action_buttons-stats-${login}">Статистика</div>
              <div class="action_buttons-item action_buttons-course_access" id="action_buttons-course_access-${login}">
                <div class="course_access-text" id="course_access-text-${login}">Доступ</div>
                <div class="course_access-switch ${
                  hasAccess ? "switch-active" : ""
                }" id="course_access-switch-${login}">
                  <div class="course_access-switch-circle"></div>
                </div>
              </div>
            </div>
          </div>
          `;
          const stats = wrapper.querySelector(`#action_buttons-stats-${login}`);

          stats.addEventListener("click", function () {
            window.location.href = `/stats/?user=${login}&id=${course.id}`;
          });

          const accessElement = wrapper.querySelector(
            `#action_buttons-course_access-${login}`
          );
          const switchElement = wrapper.querySelector(
            `#course_access-switch-${login}`
          );

          accessElement.addEventListener("click", function () {
            switchElement.classList.toggle("switch-active");
            const isActive = switchElement.classList.contains("switch-active");

            fetch("/api/changeAccessCourseForUser", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                auth_key,
                courseName: selected_course,
                login,
                access: isActive,
              }),
            })
              .then((response) => response.json())
              .then((data) => {
                // console.log("Access changed:", data);
              })
              .catch((error) => {
                console.error("Error changing access:", error);
                switchElement.classList.toggle("switch-active");
              });
          });

          student_list.appendChild(wrapper);
        }
      });
    })
    .catch((error) => {
      console.log(error.message);
    });
}

function requestCode() {
  fetch("/api/generateCode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auth_key, selected_course }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to generate code");
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("code").innerHTML = data.code;
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("code").innerHTML = "Error generating code";
    });
}
