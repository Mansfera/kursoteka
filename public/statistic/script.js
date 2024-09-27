const start_date_picker = document.getElementById("date_picker-start");
const end_date_picker = document.getElementById("date_picker-end");

const currentDate = new Date().toISOString().split("T")[0];
end_date_picker.value = currentDate;
start_date_picker.max = currentDate;
end_date_picker.max = currentDate;
let completed_tests;
let courseData;
let userDataReceived = false;

async function getUserStats() {
  const params = new URLSearchParams(window.location.search);

  const courseName = params.get("id");
  const login = params.get("user") || null;
  let start_date = null,
    end_date = null;

  if (userDataReceived) {
    start_date =
      new Date(start_date_picker.value).getTime() - 24 * 60 * 60 * 1000;
    end_date = new Date(end_date_picker.value).getTime() + 24 * 60 * 60 * 1000;
  }

  // Prepare data for the POST request
  let postData = {
    auth_key: auth_key,
    courseName: courseName,
    start_date: start_date,
    end_date: end_date,
  };

  // Conditionally add 'login' if it's not null
  if (login !== null) {
    postData.login = login;
  }

  // Send the POST request
  try {
    const response = await fetch("/api/getUserStats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    function formatDate(timestamp) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    const result = await response.json();
    if (!userDataReceived) {
      userDataReceived = true;
      start_date_picker.value = formatDate(result.join_date);
      start_date_picker.min = formatDate(result.join_date);
      end_date_picker.min = formatDate(result.join_date);
      if (result.expire_date != "never" && result.expire_date < Date.now()) {
        start_date_picker.max = formatDate(result.expire_date);
        end_date_picker.max = formatDate(result.expire_date);
        end_date_picker.value = formatDate(result.expire_date);
      }
      getUserStats();
    } else {
      completed_tests = result.completed_tests;
      fetch("/api/getUserCourses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auth_key, specific_course: courseName }),
      })
        .then((response) => response.json())
        .then((data) => {
          courseData = data.courses[0];
          fillData();
        });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
getUserStats();
start_date_picker.addEventListener("change", () => getUserStats());
end_date_picker.addEventListener("change", () => getUserStats());
function getTestStatistics(stat_type, blockValue, testValue) {
  // Function to convert time in seconds to hh:mm:ss format
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return hours > 0
      ? `${hours}:${formattedMinutes}:${formattedSeconds}`
      : `${formattedMinutes}:${formattedSeconds}`;
  }

  // Helper function to calculate the average accuracy for each question type
  function calculateAverageAccuracy(tests) {
    if (!tests.length) return null;

    Array.from(tests).forEach((t) => {
      if (t.abcd_questions_accuracy == null) {
        t.abcd_questions_accuracy =
          // Math.random() * (t.score - 100) +
          t.score;
      }
      if (t.hronology_questions_accuracy == null) {
        t.hronology_questions_accuracy =
          // Math.random() * (t.score - 100) +
          t.score;
      }
      if (t.vidpovidnist_questions_accuracy == null) {
        t.vidpovidnist_questions_accuracy =
          // Math.random() * (t.score - 100) +
          t.score;
      }
      if (t.mul_ans_questions_accuracy == null) {
        t.mul_ans_questions_accuracy =
          // Math.random() * (t.score - 100) +
          t.score;
      }
    });

    const abcdSum = tests.reduce(
      (sum, t) => sum + t.abcd_questions_accuracy,
      0
    );
    const hronologySum = tests.reduce(
      (sum, t) => sum + t.hronology_questions_accuracy,
      0
    );
    const vidpovidnistSum = tests.reduce(
      (sum, t) => sum + t.vidpovidnist_questions_accuracy,
      0
    );
    const mulAnsSum = tests.reduce(
      (sum, t) => sum + t.mul_ans_questions_accuracy,
      0
    );

    const length = tests.length;
    return {
      abcd: Math.ceil(abcdSum / length),
      hronology: Math.ceil(hronologySum / length),
      vidpovidnist: Math.ceil(vidpovidnistSum / length),
      mul_ans: Math.ceil(mulAnsSum / length),
    };
  }

  // Helper function to find the best and worst accuracy type
  function findBestAndWorst(accuracies) {
    if (!accuracies) {
      return null;
    }
    const entries = Object.entries(accuracies);
    const best = entries.reduce((best, current) =>
      current[1] > best[1] ? current : best
    );
    const worst = entries.reduce((worst, current) =>
      current[1] < worst[1] ? current : worst
    );
    return {
      bestType: best[0],
      bestValue: best[1],
      worstType: worst[0],
      worstValue: worst[1],
    };
  }

  switch (stat_type) {
    case "total": {
      const totalTests = completed_tests.length;
      const totalShortTests = completed_tests.filter(
        (t) => t.test_type === "short"
      ).length;
      const totalFullTests = completed_tests.filter(
        (t) => t.test_type === "full"
      ).length;
      const totalFinalTests = completed_tests.filter(
        (t) => t.test_type === "final"
      ).length; // Assuming final tests exist

      const totalScore = completed_tests.reduce((sum, t) => sum + t.score, 0);
      const averageTotalScore = Math.ceil(totalScore / totalTests);

      // Best test score
      const bestScore = Math.max(...completed_tests.map((t) => t.score));

      // Calculate average accuracy for all types
      const averageAccuracy = calculateAverageAccuracy(completed_tests);

      // Find best and worst accuracy types
      const { bestType, bestValue, worstType, worstValue } =
        findBestAndWorst(averageAccuracy);

      return {
        totalTests,
        totalShortTests,
        totalFullTests,
        totalFinalTests,
        averageTotalScore,
        bestScore,
        averageAccuracy,
        bestAccuracy: { type: bestType, value: bestValue },
        worstAccuracy: { type: worstType, value: worstValue },
      };
    }
    case "block": {
      const blockTests = completed_tests.filter((t) => t.block === blockValue);
      if (blockTests.length == 0) break;
      const blockScoreSum = blockTests.reduce((sum, t) => sum + t.score, 0);
      const averageBlockScore = Math.ceil(
        blockTests.length ? blockScoreSum / blockTests.length : 0
      );

      const testGroups = {};
      blockTests.forEach((test) => {
        if (!testGroups[test.test]) {
          testGroups[test.test] = [];
        }
        testGroups[test.test].push(test.score);
      });

      const averageScores = Object.entries(testGroups).map(([test, scores]) => {
        const averageScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return { test, averageScore };
      });
      const worstTema = averageScores.reduce((worst, current) =>
        current.averageScore < worst.averageScore ? current : worst
      );
      const bestTema = averageScores.reduce((best, current) =>
        current.averageScore > best.averageScore ? current : best
      );

      // Calculate average accuracy for all types
      const averageAccuracy = calculateAverageAccuracy(blockTests);

      // Find best and worst accuracy types
      const { bestType, bestValue, worstType, worstValue } =
        findBestAndWorst(averageAccuracy);

      return {
        blockTests,
        averageBlockScore,
        worstTema,
        bestTema,
        averageAccuracy,
        bestAccuracy: { type: bestType, value: bestValue },
        worstAccuracy: { type: worstType, value: worstValue },
      };
    }
    case "tema": {
      const temaTests = completed_tests.filter((t) => t.test === testValue);
      const testScoreSum = temaTests.reduce((sum, t) => sum + t.score, 0);
      const averageTestScore = temaTests.length
        ? testScoreSum / temaTests.length
        : 0;

      const temaShortTests = temaTests.filter((t) => t.test_type == "short");
      const temaFullTests = temaTests.filter((t) => t.test_type == "full");

      const totalShortTestTime = temaShortTests.reduce(
        (sum, t) => sum + t.time,
        0
      );
      const totalFullTestTime = temaFullTests.reduce(
        (sum, t) => sum + t.time,
        0
      );
      const averageShortTestTime = formatTime(
        Math.ceil(
          temaShortTests.length ? totalShortTestTime / temaTests.length : 0
        )
      );
      const averageFullTestTime = formatTime(
        Math.ceil(
          temaFullTests.length ? totalFullTestTime / temaTests.length : 0
        )
      );

      // Best test score for the test
      const bestScore = temaTests.length
        ? Math.max(...temaTests.map((t) => t.score))
        : 0;

      // Calculate average accuracy for all types
      const averageAccuracy = calculateAverageAccuracy(temaTests);

      // Find best and worst accuracy types
      const { bestType, bestValue, worstType, worstValue } =
        findBestAndWorst(averageAccuracy);

      return {
        temaTests,
        averageTestScore,
        averageShortTestTime,
        averageFullTestTime,
        bestScore,
        averageAccuracy,
        bestAccuracy: { type: bestType, value: bestValue },
        worstAccuracy: { type: worstType, value: worstValue },
      };
    }
  }
}
let tempDebugData;
function fillData() {
  document.getElementById("course_name").innerHTML = courseData.name;

  function formatAccuracyTypeName(type) {
    switch (type) {
      case "abcd":
        return "Питання з одною правильною відповіддю";
      case "hronology":
        return "Питання на хронологію";
      case "vidpovidnist":
        return "Питання на відповідність";
      case "mul_ans":
        return "Питання з декількома відповідями";
    }
  }

  const totalStats = getTestStatistics("total");
  document.getElementById("total-tests_completed").innerHTML =
    totalStats.totalTests;
  document.getElementById("total-short-tests_completed").innerHTML =
    totalStats.totalShortTests;
  document.getElementById("total-full-tests_completed").innerHTML =
    totalStats.totalFullTests;
  document.getElementById("total-final-tests_completed").innerHTML =
    totalStats.totalFinalTests;

  document.getElementById(
    "total-good_at"
  ).innerHTML = `${formatAccuracyTypeName(totalStats.bestAccuracy.type)} (${
    totalStats.bestAccuracy.value
  }%)`;
  document.getElementById("total-bad_at").innerHTML = `${formatAccuracyTypeName(
    totalStats.worstAccuracy.type
  )} (${totalStats.worstAccuracy.value}%)`;
  Array.from(courseData.blocks).forEach(async (blockData) => {
    // Create a new div element
    const blockItem = document.createElement("div");
    blockItem.classList.add("block_list-item");
    blockItem.id = `block-${blockData.id}`;

    // Await the async getTestStatistics call to resolve
    const blockStats = getTestStatistics("block", blockData.id);
    let blockBestTema = blockData.tests.find(
      (t) => t.id == blockStats?.bestTema?.test
    );
    let blockWorstTema = blockData.tests.find(
      (t) => t.id == blockStats?.worstTema?.test
    );
    if (blockBestTema == null) {
      blockBestTema = { name: "Недостатньо даних" };
    }
    if (blockWorstTema == null) {
      blockWorstTema = { name: "Недостатньо даних" };
    }
    // Set the inner HTML for the block
    blockItem.innerHTML = `
      <div class="block-name" onclick="showBlock(${blockData.id})">
        <div class="block-name-number white_text">0${blockData.id}</div>
        <div class="block-name-text white_text title_text">
          ${blockData.name}
        </div>
        <img class="dropdown" src="/assets/dropdown.svg" id="dropdown-${
          blockData.id
        }" />
      </div>
      <div class="block-info display-none" id="block_info-${blockData.id}">
        <div class="block-info-item stat_item">
          <div class="stat_name">Тестів пройдено</div>
          <div
            class="stat_info white_text"
            id="block-${blockData.id}-test_completed"
          >
            ${blockStats?.blockTests?.length || 0}
          </div>
        </div>
        <div class="block-info-item stat_item">
          <div class="stat_name">Тобі найкраще дається ця тема</div>
          <div
            class="stat_info white_text"
            id="block-${blockData.id}-best_tema"
          >
            ${blockBestTema.name || "N/A"}
          </div>
        </div>
        <div class="block-info-item stat_item">
          <div class="stat_name">Тобі варто попрацювати над цією темою</div>
          <div
            class="stat_info white_text"
            id="block-${blockData.id}-worst_tema"
          >
            ${blockWorstTema.name || "N/A"}
          </div>
        </div>
      </div>
      <div class="block-temas display-none" id="block-${
        blockData.id
      }-temas"></div>
    `;
    // Append the newly created block item to the block_list element
    document.getElementById("block_list").appendChild(blockItem);
    Array.from(blockData.tests).forEach(async (temaData) => {
      const temaItem = document.createElement("div");
      temaItem.classList.add("tema-item");
      temaItem.id = `tema-${temaData.id}`;
      const temaStats = getTestStatistics("tema", blockData.id, temaData.id);
      // Set the inner HTML for the tema item
      temaItem.innerHTML = `
    <div class="tema-name" onclick="showTema(${temaData.id})">
      <div class="tema-name-number white_text">Тема №${temaData.id}</div>
      <div class="tema-name-text white_text title_text">${
        temaData.name || ""
      }</div>
      <img class="dropdown" src="/assets/dropdown.svg" id="dropdown-tema-${
        temaData.id
      }" />
    </div>
    <div class="tema-info display-none" id="tema_info-${temaData.id}">
      <div class="tema-info-item stat_item">
        <div class="stat_name">Середня оцінка</div>
        <div class="stat_info white_text" id="tema-${
          temaData.id
        }-average_grade">
          ${Math.ceil(temaStats.averageTestScore)}%
        </div>
      </div>
      <div class="tema-info-item stat_item">
        <div class="stat_name">Середній час проходження тренувальних тестів</div>
        <div class="stat_info white_text" id="tema-${
          temaData.id
        }-average_time_short">
          ${temaStats.averageShortTestTime}
        </div>
      </div>
      <div class="tema-info-item stat_item">
        <div class="stat_name">Середній час проходження розширених тестів</div>
        <div class="stat_info white_text" id="tema-${
          temaData.id
        }-average_time_full">
          ${temaStats.averageFullTestTime}
        </div>
      </div>
      <div class="tema-info-item stat_item">
        <div class="stat_name">${
          formatAccuracyTypeName(temaStats.accuracies[0].type) ||
          "Питання з одною правильною відповіддю"
        }</div>
        <div class="stat_info white_text" id="tema-${temaData.id}-good_at">
           ${temaStats.averageAccuracy[0].value}%
        </div>
      </div>
      <div class="tema-info-item stat_item">
        <div class="stat_name">${
          formatAccuracyTypeName(temaStats.accuracies[1].type) ||
          "Питання на відповідність"
        }</div>
        <div class="stat_info white_text" id="tema-${temaData.id}-good_at">
           ${temaStats.averageAccuracy[1].value}%
        </div>
      </div>
      <div class="tema-info-item stat_item">
        <div class="stat_name">${
          formatAccuracyTypeName(temaStats.accuracies[2].type) ||
          "Питання на хронологію"
        }</div>
        <div class="stat_info white_text" id="tema-${temaData.id}-good_at">
           ${temaStats.averageAccuracy[2].value}%
        </div>
      </div>
      <div class="tema-info-item stat_item">
        <div class="stat_name">${
          formatAccuracyTypeName(temaStats.accuracies[3].type) ||
          "Питання з декількома відповідями"
        }</div>
        <div class="stat_info white_text" id="tema-${temaData.id}-good_at">
           ${temaStats.averageAccuracy[3].value}%
        </div>
      </div>
    </div>
  `;
      // Append the newly created tema item to the correct block element
      const blockTemasElement = document.getElementById(
        `block-${blockData.id}-temas`
      );

      blockTemasElement.appendChild(temaItem);
    });
  });
}

function showBlock(id) {
  document.getElementById(`dropdown-${id}`).classList.toggle("active-dropdown");
  document.getElementById(`block_info-${id}`).classList.toggle("display-none");
  document.getElementById(`block-${id}-temas`).classList.toggle("display-none");
}
function showTema(id) {
  document
    .getElementById(`dropdown-tema-${id}`)
    .classList.toggle("active-dropdown");
  document.getElementById(`tema_info-${id}`).classList.toggle("display-none");
}
