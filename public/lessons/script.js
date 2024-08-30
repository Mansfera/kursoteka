function toggleLessons(id) {
  const lessons = document.getElementById("lessons_block-" + id);
  lessons.classList.toggle("display-none");
  const final_test = document.getElementById("final_test-" + id);
  final_test.classList.toggle("display-none");
}
let closeTimeout;
function closeTestWindow(test) {
  const test_picker = document.getElementById("test_picker-" + test);
  if (test_picker) {
    test_picker.classList.add("display-none");
  }
}
function openTestWindow(test) {
  const allTestPickers = document.querySelectorAll(".lessons-test_picker");
  allTestPickers.forEach((picker) => picker.classList.add("display-none"));

  const test_picker = document.getElementById("test_picker-" + test);
  if (test_picker) {
    test_picker.classList.remove("display-none");
  }

  if (closeTimeout) {
    clearTimeout(closeTimeout);
  }
  closeTimeout = setTimeout(() => {
    closeTestWindow(test);
  }, 30000);
}

function openTest(course, block, test, type, test_name) {
  window.location = `/test/?course=${course}&block=${block}&id=${test}&test_type=${type}&test_name=${test_name}`;
}
function openFinalTest(course, block, first_test_id, last_test_id) {
  window.location = `/test/?course=${course}&block=${block}&test_type=final&first_test_id=${first_test_id}&last_test_id=${last_test_id}`;
}

function openMaterials(course, block, test) {}
function openVideo(course, block, test) {}

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
      const material_list = document.getElementById("modules-material_list");

      if (data.courses.length > 0) {
        data.courses.forEach((course) => {
          Array.from(course.blocks).forEach((block) => {
            const blockCard = document.createElement("div");
            blockCard.className = "material_list-element";
            blockCard.innerHTML = `
              <div class="material_list-element-info">
                <div class="material_list-element-number white_text">0${block.id}</div>
                <div class="material_list-element-text white_text title_text" onclick="toggleLessons('${block.id}')">${block.name}</div>
                <img src="/assets/expand.svg" onclick="toggleLessons('${block.id}')" />
              </div>
              <div class="material_list-lessons display-none" id="lessons_block-${block.id}"></div>
              <div class="material_list-final_test display-none" id="final_test-${block.id}">
                <div class="final_test-button" onclick="openFinalTest('${course.id}', '${block.id}', ${block.tests[0].id}, ${block.tests[block.tests.length-1].id})">Підсумковий тест</div>
              </div>
            `;
            material_list.appendChild(blockCard);
            const block_tests = document.getElementById(
              `lessons_block-${block.id}`
            );
            Array.from(block.tests).forEach((test) => {
              const testCard = document.createElement("div");
              testCard.className = "lessons-card_wrapper";
              testCard.innerHTML = `
                <div class="lessons-card" id="lesson_card_${test.id}">
                  <div class="lesson-card-top_buttons">
                    <div class="lessons-card-materials circle_button" onclick="openMaterials('${course.id}', '${block.id}', '${test.id}')">
                      <img src="/assets/attachment.svg" alt="" />
                    </div>
                    <div class="lessons-card-tests circle_button" onclick="openTestWindow('${test.id}')">
                      <img src="/assets/test.svg" alt="" />
                    </div>
                    <div
                      class="lessons-card-video circle_button video_link_button" onclick="openVideo('${course.id}', '${block.id}', '${test.id}')"
                    >
                      <img src="/assets/play.svg" alt="" />
                    </div>
                  </div>
                  <div class="lessons-card-text">
                    <div class="card-text subtitle_text white_text">
                      Тема №${test.id}
                    </div>
                    <div class="card-text white_text">${test.name}</div>
                  </div>
                </div>
                <div class="lessons-test_picker display-none" id="test_picker-${test.id}">
                  <div class="test_picker-close_btn-wrapper">
                    <div class="test_picker-close_btn" onclick=closeTestWindow('${test.id}')>
                      <img src="/assets/cross.svg" alt="" />
                    </div>
                  </div>
                  <div class="test_picker-bubble_wrapper">
                    <div class="test_picker-test_bubble" onclick="openTest('${course.id}', '${block.id}', '${test.id}', 'short', '${test.name}')">Тренувальний тест</div>
                    <div class="test_picker-test_bubble" onclick="openTest('${course.id}', '${block.id}', '${test.id}', 'full', '${test.name}')">Розширений тест</div>
                  </div>
                </div>
              `;
              const imageCard = testCard.querySelector(".lessons-card");
              imageCard.style.backgroundImage = `url('/api/getCoverImage?course=${course.id}&blockId=${block.id}&testId=${test.id}&auth_key=${auth_key}')`;
              block_tests.appendChild(testCard);
            });
          });
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching user courses:", error);
    });
}

document.addEventListener("DOMContentLoaded", fetchAndDisplayUserCourses);
