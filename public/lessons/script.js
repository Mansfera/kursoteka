function toggleLessons(id) {
  const lessons = document.getElementById("lessons_block-" + id);
  lessons.classList.toggle("display-none");
  const final_test = document.getElementById("final_test-" + id);
  final_test.classList.toggle("display-none");
  const dropdown = document.getElementById("dropdown-" + id);
  dropdown.classList.toggle("active-dropdown");
  if (
    getCookie("coursesOwned") != [] &&
    getCookie("coursesOwned") != null &&
    getCookie("coursesOwned").includes(current_course)
  ) {
    Array.from(document.getElementsByClassName("__test_editor")).forEach(
      (element) => {
        element.classList.remove("display-none");
      }
    );
  }
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

let current_course = params.get("id");

function openTest(block, test, type, test_name) {
  window.location = `/test/?course=${current_course}&block=${block}&id=${test}&test_type=${type}&test_name=${test_name}`;
}
function openFinalTest(block, first_test_id, last_test_id) {
  window.location = `/test/?course=${current_course}&block=${block}&test_type=final&first_test_id=${first_test_id}&last_test_id=${last_test_id}`;
}
function openCards(block, test, test_name) {
  window.open(
    `/remember_cards/?course=${current_course}&block=${block}&id=${test}&test_name=${test_name}`
  );
}

function openMaterials(block, tema) {
  window.open(
    `/lesson_materials/?course=${current_course}&block=${block}&tema=${tema}&scroll_to=conspects`
  );
}
function openVideo(block, tema) {
  window.open(
    `/lesson_materials/?course=${current_course}&block=${block}&tema=${tema}`
  );
}
let user_stats = null;
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    fetchUserStats(),
    fetchAndDisplayUserCourses(),
  ]).then(() => {
    // Get all final tests
    const finalTests =
      user_stats?.completed_tests.filter((test) => test.test_type == "final") ||
      [];

    // Group tests by test_id and get only the latest one for each
    const latestTestsMap = new Map();
    finalTests.forEach((test) => {
      const existingTest = latestTestsMap.get(test.test);
      if (!existingTest || existingTest.date < test.date) {
        latestTestsMap.set(test.test, test);
      }
    });

    // Convert map values back to array and sort by date
    const lastCompletedSummaryTests = Array.from(latestTestsMap.values()).sort(
      (a, b) => a.date - b.date
    );
    console.log(finalTests, lastCompletedSummaryTests);

    if (
      lastCompletedSummaryTests.length > 0 &&
      !getCookie("allowContextmenu") &&
      !getCookie("debugAnswers")
    ) {
      lastCompletedSummaryTests.forEach((summaryTest) => {
        if (Date.now() - summaryTest.date > 7 * 24 * 60 * 60 * 1000) {
          document
            .getElementById("reviseSummaryTest_notification")
            .classList.remove("display-none");
          let element = document.createElement("div");
          element.className = "rstn-alert_box-button";
          element.innerHTML = `Підсумковий тест по блоку ${summaryTest.block}`;

          element.addEventListener("click", () => {
            openFinalTest(
              summaryTest.block,
              summaryTest.first_test_id,
              summaryTest.last_test_id
            );
          });

          document.getElementById("rstn-alert_box-tests").appendChild(element);
        }
      });
    }
  });
});

async function fetchUserStats() {
  try {
    const response = await fetch("/api/getUserStats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_key,
        courseName: current_course,
        start_date: Date.now() - 9 * 30 * 24 * 60 * 60 * 1000,
        end_date: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user stats");
    }

    const data = await response.json();
    user_stats = data;
  } catch (error) {
    console.error("Error fetching user stats:", error);
  }
}

//make request to get user stats and save them to user_stats
function fetchAndDisplayUserCourses() {
  fetch("/api/getUserCourses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auth_key, specific_course: current_course }),
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
                <div class="material_list-element-number white_text">0${
                  block.id
                }</div>
                <div class="material_list-element-text white_text title_text" onclick="toggleLessons('${
                  block.id
                }')">${block.name}</div>
                <img src="/assets/dropdown.svg" id="dropdown-${
                  block.id
                }" onclick="toggleLessons('${block.id}')" />
              </div>
              <div class="material_list-lessons display-none" id="lessons_block-${
                block.id
              }"></div>
              <div class="material_list-final_test display-none restricted" id="final_test-${
                block.id
              }">
                <div class="final_test-button" onclick="openFinalTest('${
                  block.id
                }', ${block.tests[0].id}, ${
              block.tests[block.tests.length - 1].id
            })">Підсумковий тест</div>
              </div>
            `;
            material_list.appendChild(blockCard);
            const next_block = course.blocks[course.blocks.indexOf(block) + 1];
            if (
              data.allowed_tests.includes(
                next_block.tests[next_block.tests.length - 1].id
              ) ||
              data.allowed_tests.includes("all") ||
              (user_stats?.completed_tests || []).find(
                (test) => test.test == block.tests[block.tests.length - 1].id
              )
            ) {
              document
                .getElementById(`final_test-${block.id}`)
                .classList.remove("restricted");
            }
            const block_tests = document.getElementById(
              `lessons_block-${block.id}`
            );
            Array.from(block.tests).forEach((test) => {
              const testCard = document.createElement("div");
              testCard.className = "lessons-card_wrapper";
              testCard.innerHTML = `
                <div class="lessons-card" id="lesson_card_${test.id}">
                  <div class="lesson-card-top_buttons">
                    <div class="lessons-card-materials circle_button" onclick="openMaterials('${block.id}', '${test.id}')">
                      <img src="/assets/attachment.svg" alt="" />
                    </div>
                    <div class="lessons-card-tests circle_button" onclick="openTestWindow('${test.id}')">
                      <img src="/assets/test.svg" alt="" />
                    </div>
                    <div
                      class="lessons-card-video circle_button video_link_button" onclick="openVideo('${block.id}', '${test.id}')"
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
                    <div class="test_picker-test_bubble" onclick="openTest('${block.id}', '${test.id}', 'short', '${test.name}')">Тренувальний тест</div>
                    <div class="test_picker-test_bubble" onclick="openTest('${block.id}', '${test.id}', 'full', '${test.name}')">Розширений тест</div>
                    <div class="test_picker-test_bubble" onclick="openCards('${block.id}', '${test.id}', '${test.name}')">Зоображення</div>
                    <div class="test_picker-test_bubble __test_editor display-none" onclick="openTestEditor('${block.id}', '${test.id}')">Редактор тесту</div>
                  </div>
                </div>
                <div class="lessons-lock_overlay" id="lesson_lock-${test.id}">
                  <div class="lessons-lock_overlay-wrapper">
                    <div class="lock_overlay-lock_blob">
                      <img src="/assets/lock.svg" alt="locked lesson" />
                    </div>
                    <div class="lock_blob-text">Будь ласка, пройдіть попередню тему</div>
                  </div>
                </div>
              `;
              const imageCard = testCard.querySelector(".lessons-card");
              imageCard.style.backgroundImage = `url('/api/getCoverImage?course=${course.id}&blockId=${block.id}&testId=${test.id}&auth_key=${auth_key}')`;
              testCard.querySelector(
                ".test_picker-bubble_wrapper"
              ).style.backgroundImage = `url('/api/getCoverImage?course=${course.id}&blockId=${block.id}&testId=${test.id}&auth_key=${auth_key}')`;
              testCard.querySelector(
                ".lessons-lock_overlay"
              ).style.backgroundImage = `url('/api/getCoverImage?course=${course.id}&blockId=${block.id}&testId=${test.id}&auth_key=${auth_key}')`;
              block_tests.appendChild(testCard);
              if (!data.allowed_tests.includes("all")) {
                Array.from(data.allowed_tests).forEach((item) => {
                  if (item == test.id) {
                    const lesson_card = document.getElementById(
                      `lesson_lock-${test.id}`
                    );
                    if (lesson_card) {
                      lesson_card.classList.toggle("display-none");
                    }
                  }
                });
              } else {
                const lesson_card = document.getElementById(
                  `lesson_lock-${test.id}`
                );
                lesson_card.classList.toggle("display-none");
              }
            });
          });
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching user courses:", error);
    });
}

function openTestEditor(block, test) {
  window.open(
    `/test_editor?course=${current_course}&block=${block}&test=${test}`
  );
}
