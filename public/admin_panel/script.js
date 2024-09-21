const auth_key = getCookie("auth_key");
let selected_course = "";
current_page = 1;
let courseData;

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
      courseData = data;
      courseData.courses.forEach((course) => {
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
      const course = courseData.courses.find(
        (crs) => crs.id == selected_course
      );
      Array.from(course.blocks).forEach((block_obj) => {
        Array.from(block_obj.tests).forEach((test_obj) => {
          const option = document.createElement("option");
          option.value = test_obj.id;
          if (test_obj.name != "") {
            option.textContent = `Тема №${test_obj.id}: ${test_obj.name}`;
          } else {
            option.textContent = `Тема №${test_obj.id}`;
          }
          document.getElementById("promocode-start_temas").appendChild(option);
        });
      });
      document.getElementById(
        "main_wrapper"
      ).style.backgroundImage = `url('/api/getCoverImage?course=${selected_course}&auth_key=${auth_key}&image_name=admin_panel')`;
      getUsers();
      document.getElementById("existing_promocodes").innerHTML = "";

      fetch("/api/getPromoCodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auth_key, course: selected_course }),
      })
        .then((response) => response.json())
        .then((data) => {
          data.promocodes.forEach((promocode) => {
            let usedBy = "ні";
            let usedDate = "";

            // Check if promocode.used_by is not empty
            if (promocode.used_by) {
              usedBy = "користувачем ";

              if (promocode.used_by_name) {
                usedBy +=
                  promocode.used_by_name + " " + promocode.used_by_surname;
              } else {
                usedBy += promocode.used_by;
              }

              usedDate = "о " + formatDate(promocode.used_date);
            }

            const element = createPromocodeElement(promocode, usedBy, usedDate);
            document.getElementById("existing_promocodes").appendChild(element);
          });
        });
      if (courseSelector.children[0].value == "") {
        courseSelector.children[0].remove();
        document
          .getElementById("show_promocode_generator")
          .classList.remove("display-none");
      }
    }
  });
});
async function changeUserAllowedCourse(username, allowed_tests) {
  try {
    const response = await fetch("/api/changeUserAllowedCourse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_key,
        courseName: selected_course,
        username: username,
        allowed_tests: allowed_tests,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to change allowed course for user");
    }

    const result = await response.json(); // Parse the JSON response
    return result;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
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
          if (user.surname != "") {
            username += " " + user.surname;
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
              <div class="action_buttons-item action_buttons-course_selector">
                <select id="action_buttons-course_selector-${login}">
                  <option value="all">Всі теми</option>
                </select>
              </div>
            </div>
          </div>
          `;
          student_list.appendChild(wrapper);
          const stats = document.getElementById(
            `action_buttons-stats-${login}`
          );

          stats.addEventListener("click", function () {
            window.location.href = `/stats/?user=${login}&id=${course.id}`;
          });

          const accessElement = document.getElementById(
            `action_buttons-course_access-${login}`
          );
          const switchElement = document.getElementById(
            `course_access-switch-${login}`
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

          const course = courseData.courses.find(
            (crs) => crs.id == selected_course
          );
          const user_max_tema = document.getElementById(
            `action_buttons-course_selector-${login}`
          );

          // Populate the select element with test options
          Array.from(course.blocks).forEach((block_obj) => {
            Array.from(block_obj.tests).forEach((test_obj) => {
              const option = document.createElement("option");
              option.value = test_obj.id;
              if (test_obj.name !== "") {
                option.textContent = `Тема №${test_obj.id}: ${test_obj.name}`;
              } else {
                option.textContent = `Тема №${test_obj.id}`;
              }
              user_max_tema.appendChild(option);
            });
          });

          // Set the last allowed test as the selected value
          const allowed_tests = user.courses[0].allowed_tests; // Get the list of allowed tests
          const last_allowed_test = allowed_tests[allowed_tests.length - 1]; // Get the last one
          user_max_tema.value = last_allowed_test; // Set the value directly to the last allowed test ID

          user_max_tema.addEventListener("change", function () {
            var start_tema = user_max_tema.value;
            var start_temas_list = [];

            if (start_tema !== "all") {
              const course = courseData.courses.find(
                (crs) => crs.id == selected_course
              );

              course.blocks.some((block_obj) => {
                return block_obj.tests.some((test_obj) => {
                  if (test_obj.id != start_tema) {
                    start_temas_list.push(test_obj.id);
                    return false;
                  } else {
                    return true;
                  }
                });
              });
              start_temas_list.push(start_tema);
            } else {
              start_temas_list.push(start_tema);
            }
            changeUserAllowedCourse(login, start_temas_list)
              .then((result) => {
                if (result) {
                  console.log("Success:", result);
                }
              })
              .catch((error) => {
                console.error("Failed to change allowed course:", error);
              });
          });
        }
      });
    })
    .catch((error) => {
      console.log(error.message);
    });
}
let promocodesVisible = false;
document
  .getElementById("show_promocode_generator")
  .addEventListener("click", function () {
    if (!promocodesVisible) {
      document.getElementById("show_promocode_generator").innerHTML =
        "Приховати генератор промокодів";
    } else {
      document.getElementById("show_promocode_generator").innerHTML =
        "Показати генератор промокодів";
    }
    document
      .getElementById("promocode-section")
      .classList.toggle("display-none");
    promocodesVisible = !promocodesVisible;
  });

document
  .getElementById("create_promocode")
  .addEventListener("click", function () {
    const access_duration = document.getElementById("promocode-duration").value;
    const expire_date = document.getElementById("promocode-expire_date").value;
    var start_tema = document.getElementById("promocode-start_temas").value;
    var start_temas_list = [];

    if (start_tema !== "all") {
      const course = courseData.courses.find(
        (crs) => crs.id == selected_course
      );

      course.blocks.some((block_obj) => {
        return block_obj.tests.some((test_obj) => {
          if (test_obj.id != start_tema) {
            start_temas_list.push(test_obj.id);
            return false;
          } else {
            return true;
          }
        });
      });
      start_temas_list.push(start_tema);
    } else {
      start_temas_list.push(start_tema);
    }

    requestCode(expire_date, access_duration, start_temas_list);
  });
function requestCode(expire_date, access_duration, start_temas) {
  fetch("/api/generateCode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_key,
      course: selected_course,
      expire_date,
      access_duration,
      start_temas,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to generate code");
      }
      return response.json();
    })
    .then((data) => {
      const element = createPromocodeElement(data.promocode, "ні", "");
      document.getElementById("existing_promocodes").appendChild(element);
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("code").innerHTML = "Error generating code";
    });
}
function createPromocodeElement(promocode, used_by, used_date) {
  // Create the main wrapper div
  const wrapper = document.createElement("div");
  wrapper.className = "promocodes_list-item-wrapper";
  wrapper.id = `promocodes_list-item-${promocode.code}`;

  // Use template literal to create inner HTML
  wrapper.innerHTML = `
  <div class="promocodes_list-item-info_wrapper">
    <div class="promocodes_list-item promocode" id="code-${
      promocode.code
    }" onclick="copyInnerHtml('code-${promocode.code}')">
        ${promocode.code}
    </div>
    <div class="promocodes_list-item" id="code-expire_date-${promocode.code}">
        Дійсний до ${formatDate(promocode.expire_date)}
    </div>
    <div class="promocodes_list-item" id="code-course_duration-${
      promocode.code
    }">
        Кількість днів, що надається: ${
          promocode.access_duration / (24 * 60 * 60 * 1000)
        }
    </div>
    <div class="promocodes_list-item" id="code-used_by-${promocode.code}">
        Використаний: ${used_by} ${used_date}
    </div>
  </div>
  <div class="promocodes_list-item-remove-item" id="code-remove-${
    promocode.code
  }" onclick="deleteCode('${promocode.code}')">
    <img src="/assets/cross.svg" alt="">
  </div>
  `;

  return wrapper;
}
function copyInnerHtml(elementId) {
  var element = document.getElementById(elementId);
  var content = element.innerHTML;

  // Change innerHTML to "Скопійовано!"
  element.innerHTML = "Скопійовано!";

  // Use a function in setTimeout to reset innerHTML after 3 seconds
  setTimeout(function () {
    element.innerHTML = content;
  }, 3000);

  // Create a temporary textarea to copy the content
  var tempTextarea = document.createElement("textarea");
  tempTextarea.value = content;
  document.body.appendChild(tempTextarea);
  tempTextarea.select();
  document.execCommand("copy");
  document.body.removeChild(tempTextarea);
}

function formatDate(timestamp) {
  // Create a new Date object using the timestamp
  var date = new Date(timestamp);

  // Get the individual components of the date
  var day = String(date.getDate()).padStart(2, "0"); // Day with leading zero
  var month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-based
  var year = date.getFullYear(); // Full year
  var hours = String(date.getHours()).padStart(2, "0"); // Hours with leading zero
  var minutes = String(date.getMinutes()).padStart(2, "0"); // Minutes with leading zero

  // Construct the formatted date string
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
function deleteCode(code) {
  fetch("/api/deletePromoCode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_key,
      code,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to delete code");
      }
      const element = document.getElementById(`promocodes_list-item-${code}`);
      element.remove();
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("code").innerHTML = "Error generating code";
    });
}
