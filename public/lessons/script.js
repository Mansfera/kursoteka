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

if (auth_key == null || auth_key == undefined) {
  window.location = "/login";
}
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

let course_data = null;
let current_course = params.get("id");
let uncompleted_tests =
  JSON.parse(localStorage.getItem(`uncompletedTests-${current_course}`)) || [];
let last_update = getCookie(`lastUncompletedTestsUpdate-${current_course}`);
let sync_interval;

async function syncUncompletedTests() {
  const current_time = Date.now();

  if (last_update == null) {
    localStorage.clear();
  }
  if (uncompleted_tests.length > 9) {
    uncompleted_tests = uncompleted_tests
      .sort((a, b) => b.date - a.date)
      .slice(0, 9);
    localStorage.setItem(
      `uncompletedTests-${current_course}`,
      JSON.stringify(uncompleted_tests)
    );
  }

  try {
    if (!last_update || current_time - parseInt(last_update) > 10000) {
      const response = await fetch("/api/course/getUncompletedTests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_key,
          course: current_course,
          last_update: last_update,
        }),
      });

      if (response.ok) {
        const server_data = await response.json();
        if (!last_update || server_data.last_updated > parseInt(last_update)) {
          uncompleted_tests = server_data.tests;
          localStorage.setItem(
            `uncompletedTests-${current_course}`,
            JSON.stringify(uncompleted_tests)
          );
          setCookie(
            `lastUncompletedTestsUpdate-${current_course}`,
            server_data.last_updated
          );
          last_update = server_data.last_updated;
        }
      }
    } else {
      await fetch("/api/course/updateUncompletedTests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_key,
          course: current_course,
          tests: uncompleted_tests,
          last_updated: last_update,
        }),
      });
    }
  } catch (error) {
    console.error("Error syncing uncompleted tests:", error);
  }
}

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
  await fetchUserStats().then(() => {
    fetchAndDisplayUserCourses();

    const finalTests =
      user_stats?.completed_tests.filter((test) => test.test_type == "final") ||
      [];

    // Group tests by block_id for final tests, otherwise by test_id
    const latestTestsMap = new Map();
    finalTests.forEach((test) => {
      const key = test.block; // Use block as the key for final tests
      const existingTest = latestTestsMap.get(key);
      if (!existingTest || existingTest.date < test.date) {
        latestTestsMap.set(key, test);
      }
    });

    // Convert map values back to array and sort by block number
    const lastCompletedSummaryTests = Array.from(latestTestsMap.values()).sort(
      (a, b) => a.block - b.block
    );
    if (
      lastCompletedSummaryTests.length > 0 &&
      !getCookie("ignoreSummaryTestNotification") &&
      getCookie("group") != "teacher" &&
      !getCookie("debugAnswers") &&
      !getCookie("singleSessionCode")
    ) {
      const period = 5 * 24 * 60 * 60 * 1000;
      lastCompletedSummaryTests.forEach((summaryTest) => {
        console.log(
          Date.now() - summaryTest.date > period,
          summaryTest.score < 85,
          Date.now() - summaryTest.date < period
        );
        if (
          Date.now() - summaryTest.date > period ||
          (summaryTest.score < 85 && Date.now() - summaryTest.date < period)
        ) {
          document
            .getElementById("reviseSummaryTest_notification")
            .classList.remove("display-none");
          let element = document.createElement("div");
          element.className = "rstn-alert_box-button";
          element.innerHTML = `Підсумковий тест по блоку ${summaryTest.block}`;

          element.addEventListener("click", () => {
            const first_test_id = course_data.courses
              .find((course) => course.id == current_course)
              .blocks.find((block) => block.id == summaryTest.block)
              .tests[0].id;
            const last_test_id = course_data.courses
              .find((course) => course.id == current_course)
              .blocks.find((block) => block.id == summaryTest.block)
              .tests.reverse()[0].id;
            openFinalTest(
              summaryTest.block,
              first_test_id.toString(),
              last_test_id.toString()
            );
          });

          document.getElementById("rstn-alert_box-tests").appendChild(element);
        }
      });
    }
  });

  await syncUncompletedTests();
  sync_interval = setInterval(syncUncompletedTests, 60000);
});

window.addEventListener("beforeunload", () => {
  if (sync_interval) {
    clearInterval(sync_interval);
  }
});

async function fetchUserStats() {
  try {
    const response = await fetch("/api/course/getUserStats", {
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
  fetch("/api/course/getUserCourses", {
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
        course_data = data;
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
                }', '${block.tests[0].id}', '${
              block.tests[block.tests.length - 1].id
            }')">Підсумковий тест</div>
              </div>
            `;
            material_list.appendChild(blockCard);
            const next_block = course.blocks[course.blocks.indexOf(block) + 1];
            if (
              (next_block &&
                data.allowed_tests.includes(
                  next_block.tests[next_block.tests.length - 1].id
                )) ||
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
              imageCard.style.backgroundImage = `url('/api/course/getCoverImage?course=${course.id}&blockId=${block.id}&testId=${test.id}&auth_key=${auth_key}')`;
              testCard.querySelector(
                ".test_picker-bubble_wrapper"
              ).style.backgroundImage = `url('/api/course/getCoverImage?course=${course.id}&blockId=${block.id}&testId=${test.id}&auth_key=${auth_key}')`;
              testCard.querySelector(
                ".lessons-lock_overlay"
              ).style.backgroundImage = `url('/api/course/getCoverImage?course=${course.id}&blockId=${block.id}&testId=${test.id}&auth_key=${auth_key}')`;
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
      } else {
        console.log("No courses found");
        window.location = "/my_courses";
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
