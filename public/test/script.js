const questionNumber = document.getElementById("question_number");
const topLine = document.getElementById("top_line");
const middleLines = document.getElementById("middle_lines");
const bottomLine = document.getElementById("bottom_line");
const answerButtons = document.getElementById("answer-buttons");
const finishTestButton = document.getElementById("finishTestButton");
const block_answers = document.getElementById("block_answers");
const ansSheetBtns = document.getElementById("ansSheetBtns");
const ansSheetGrid = document.getElementsByClassName(
  "answer_sheet-column-square"
);
const numeric_answers = document.getElementById("text_fields");
const numericInputs = document.querySelectorAll(".text_input");
const commentWindow = document.getElementById("comment_window");
const commentText = document.getElementById("comment_text");
const readExplanationBtn = document.getElementById("read-explanation-btn");

var queryString = window.location.search;
var params = new URLSearchParams(queryString);
var test_id = params.get("id");
var block_id = params.get("block");
var test_type = params.get("test_type");
var course = params.get("course");

let test_uuid;

let test_name;
let first_test_id = params.get("first_test_id");
let last_test_id = params.get("last_test_id");
let questions = [];
let vidpovidnist_questions = [];
let hronology_questions = [];
let mul_ans_questions = [];
let questionCount = 0;
let ignore_non_answered = false;
let promises = [];

let questions_length;
let vidpovidnist_length;
let hronology_length;
let mul_ans_length;

let score = 0;
let currentQuestionIndex = 0;
var test_completed = false;
let RND_question = 0;
let test_questions = [];
let clicked_variant;
let displayedQuestion;
let inputAnswerQuestion = false;
let chosen_answers_from_sheet = "";
let startingMinutes;
let time;
let timerInterval;
let testIsPaused = false;
let has_user_interacted = false;
const uncompletedTestsData = localStorage.getItem(`uncompletedTests-${course}`);
let uncompletedTests = uncompletedTestsData
  ? JSON.parse(uncompletedTestsData)
  : [];

const currentTest =
  uncompletedTests.find(
    (test) =>
      test.id == test_id &&
      test.test_type == test_type &&
      test.block_id == block_id
  ) || {};
if (
  currentTest != {} &&
  Date.now() - currentTest.date < 90 * 24 * 60 * 60 * 1000
) {
  document
    .getElementById("choose_new_or_old_test_dialogue")
    .classList.toggle("display-none");
} else {
  uncompletedTests = uncompletedTests.filter((test) => {
    if (test_type === "final") {
      return !(test.block_id == block_id && test.test_type == test_type);
    } else {
      return !(
        test.id == test_id &&
        test.block_id == block_id &&
        test.test_type == test_type
      );
    }
  });
  localStorage.setItem(
    `uncompletedTests-${course}`,
    JSON.stringify(uncompletedTests)
  );
  setCookie(`lastUncompletedTestsUpdate-${course}`, Date.now());
  syncUncompletedTests();
  loadTestQuestions(false);
}

function chooseNewOrOldTest(answer) {
  document
    .getElementById("choose_new_or_old_test_dialogue")
    .classList.toggle("display-none");
  loadTestQuestions(answer);
  if (answer) {
    uncompletedTests = uncompletedTests.filter((test) => {
      if (test_type === "final") {
        return !(test.block_id == block_id && test.test_type == test_type);
      } else {
        return !(
          test.id == test_id &&
          test.block_id == block_id &&
          test.test_type == test_type
        );
      }
    });
    localStorage.setItem(
      `uncompletedTests-${course}`,
      JSON.stringify(uncompletedTests)
    );
  }
}
async function loadTestDataFromServer(
  auth_key,
  course,
  block,
  firstTest,
  lastTest,
  testType = null
) {
  try {
    const url = new URL("/api/course/loadTestData", window.location.origin);
    url.searchParams.append("auth_key", auth_key);
    url.searchParams.append("course", course);
    url.searchParams.append("block", block);
    url.searchParams.append("firstTest", firstTest);
    url.searchParams.append("lastTest", lastTest);
    if (testType) {
      url.searchParams.append("testType", testType);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load test data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}
function loadTestQuestions(newTestData) {
  switch (test_type) {
    case "short":
    case "full":
      test_name = params.get("test_name");
      loadTestDataFromServer(
        auth_key,
        course,
        block_id,
        test_id,
        test_id,
        test_type
      )
        .then((testData) => {
          if (testData) {
            questions = testData.questions;
            vidpovidnist_questions = testData.vidpovidnistQuestions;
            hronology_questions = testData.hronologyQuestions;
            mul_ans_questions = testData.mulAnsQuestions;
            prepareTest(newTestData);
          } else {
            console.error("Failed to load test data");
          }
        })
        .catch((error) => {
          console.error("Error loading test data:", error);
        });
      break;
    case "final":
      test_name = `<i>Підсумковий тест по блоку ${block_id}</i>`;
      loadTestDataFromServer(
        auth_key,
        course,
        block_id,
        first_test_id,
        last_test_id,
        test_type
      )
        .then((testData) => {
          if (testData) {
            questions = testData.questions;
            vidpovidnist_questions = testData.vidpovidnistQuestions;
            hronology_questions = testData.hronologyQuestions;
            mul_ans_questions = testData.mulAnsQuestions;
            final_tema_amount = testData.final_tema_amount;
            prepareTest(newTestData, final_tema_amount);
          } else {
            console.error("Failed to load test data");
          }
        })
        .catch((error) => {
          console.error("Error loading test data:", error);
        });
      break;
    case "summary":
      test_name = `<i>Симуляція НМТ</i>`;
      loadTestDataFromServer(
        auth_key,
        course,
        block_id,
        first_test_id,
        last_test_id,
        test_type
      )
        .then((testData) => {
          if (testData) {
            questions = testData.questions;
            vidpovidnist_questions = testData.vidpovidnistQuestions;
            hronology_questions = testData.hronologyQuestions;
            mul_ans_questions = testData.mulAnsQuestions;
            final_tema_amount = testData.final_tema_amount;
            prepareTest(newTestData, final_tema_amount);
          } else {
            console.error("Failed to load test data");
          }
        })
        .catch((error) => {
          console.error("Error loading test data:", error);
        });
      break;
  }
}
function prepareTest(loadNewData, final_tema_amount = 1) {
  test_completed = false;
  currentQuestionIndex = 0;
  finishTestButton.innerHTML = "Завершити тест";
  document
    .getElementById("read-explanation-btn")
    .classList.remove("display-none");
  numeric_answers.classList.add("display-none");
  block_answers.innerHTML = "";
  if (
    questions.length != 0 &&
    vidpovidnist_questions.length != 0 &&
    hronology_questions.length != 0 &&
    mul_ans_questions.length != 0
  ) {
    switch (test_type) {
      case "short":
        startShortTest();
        break;
      case "full":
        startFullTest();
        break;
      case "final":
        startFinalTest(final_tema_amount);
        break;
      case "summary":
        startSummaryTest(final_tema_amount);
        break;
    }
    if (loadNewData) {
      continueOldTest();
    }
  } else {
    document.getElementById("initial_black_screen-text").innerHTML =
      "Тест не знайдено";
    let secondsLeft = 10;
    const dotsPerSecond = 3;
    const updateText = () => {
      const patternPosition = (10 - secondsLeft) % 3;
      const dots = ".".repeat(patternPosition + 1);

      document.getElementById(
        "initial_black_screen-text"
      ).innerHTML = `Тест не знайдено, повернення на сторінку курсу через ${secondsLeft}${dots}`;
      secondsLeft--;
      if (secondsLeft >= 0) {
        setTimeout(updateText, 1000);
      }
    };
    updateText();
    setTimeout(() => {
      window.location.href = `/lessons/?id=${course}`;
    }, 10000);
    return;
  }

  Array.from(numeric_answers.children).forEach((field) => {
    field.disabled = false;
  });
  for (var i = 1; i <= questionCount; i++) {
    var btn = document.createElement("div");
    btn.classList.add("block_answers-item");
    btn.id = "q" + i;
    btn.innerHTML = i;
    block_answers.appendChild(btn);
  }
  Array.from(block_answers.children).forEach((item) => {
    if (
      test_questions[+item.innerHTML - 1]?.selected != "" &&
      test_questions[+item.innerHTML - 1]?.selected != null
    ) {
      item.classList.add("answered");
      if (test_questions[+item.innerHTML - 1]?.correct) {
        if (
          test_questions[+item.innerHTML - 1]?.selected ==
          test_questions[+item.innerHTML - 1]?.correct
        ) {
          item.classList.add("correct");
        } else {
          item.classList.add("incorrect");
        }
      } else if (test_questions[+item.innerHTML - 1]?.answers) {
        if (
          test_questions[+item.innerHTML - 1]?.selected ==
          Array.from(test_questions[+item.innerHTML - 1]?.answers).find(
            (ans) => ans.correct
          ).text
        ) {
          item.classList.add("correct");
        } else {
          item.classList.add("incorrect");
        }
      }
    }
    item.addEventListener("click", () => {
      if (!testIsPaused) {
        saveNumAnswer();
        currentQuestionIndex = item.innerHTML - 1;
        showQuestion();
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        if (test_type != "summary") {
          saveUncompletedTest();
        }
      }
    });
  });
  showQuestion();
  document.getElementById("initial_black_screen").classList.add("display-none");
}

function startShortTest() {
  currentTest.id = test_id;
  currentTest.test_type = test_type;
  currentTest.block_id = block_id;
  document.getElementById("test_name").innerHTML =
    "Тема " + test_id + ": " + test_name;
  document.getElementById("result-test_name").innerHTML =
    "Тема " + test_id + ": " + test_name;
  questions_length = 12;
  vidpovidnist_length = 1;
  hronology_length = 1;
  mul_ans_length = 1;
  questionCount =
    questions_length + vidpovidnist_length + hronology_length + mul_ans_length;
  startingMinutes = questionCount;
  currentTest.startingMinutes = startingMinutes;
  time = startingMinutes * 60;
  startTime = time;
  test_uuid = Math.random().toString(36).substring(2, 10);
  timerInterval = setInterval(updateCountdown, 1000);

  questions.forEach((q) => {
    q.q_type = "abcd";
  });
  vidpovidnist_questions.forEach((q) => {
    q.q_type = "vidp";
  });
  hronology_questions.forEach((q) => {
    q.q_type = "hron";
  });
  mul_ans_questions.forEach((q) => {
    q.q_type = "mul_ans";
  });

  for (let i = 0; i < questionCount; i++) {
    let currentQuestion;
    if (i < 12) {
      let randomQuestionIndex = Math.floor(Math.random() * questions.length);
      currentQuestion = questions[randomQuestionIndex];
      while (test_questions.includes(currentQuestion)) {
        randomQuestionIndex = Math.floor(Math.random() * questions.length);
        currentQuestion = questions[randomQuestionIndex];
      }
    } else if (i == 12) {
      test_questions.sort((p1, p2) =>
        p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
      );
      let randomQuestionIndex = Math.floor(
        Math.random() * vidpovidnist_questions.length
      );
      currentQuestion = vidpovidnist_questions[randomQuestionIndex];
      while (test_questions.includes(currentQuestion)) {
        randomQuestionIndex = Math.floor(
          Math.random() * vidpovidnist_questions.length
        );
        currentQuestion = vidpovidnist_questions[randomQuestionIndex];
      }
    } else if (i == 13) {
      let randomQuestionIndex = Math.floor(
        Math.random() * hronology_questions.length
      );
      currentQuestion = hronology_questions[randomQuestionIndex];
      while (test_questions.includes(currentQuestion)) {
        randomQuestionIndex = Math.floor(
          Math.random() * hronology_questions.length
        );
        currentQuestion = hronology_questions[randomQuestionIndex];
      }
    } else if (i == 14) {
      let randomQuestionIndex = Math.floor(
        Math.random() * mul_ans_questions.length
      );
      currentQuestion = mul_ans_questions[randomQuestionIndex];
      while (test_questions.includes(currentQuestion)) {
        randomQuestionIndex = Math.floor(
          Math.random() * mul_ans_questions.length
        );
        currentQuestion = mul_ans_questions[randomQuestionIndex];
      }
    }
    test_questions.push(currentQuestion);
  }
}
function startFinalTest(final_tema_amount) {
  currentTest.id = test_id;
  currentTest.test_type = test_type;
  currentTest.block_id = block_id;
  document.getElementById("test_name").innerHTML = test_name;
  document.getElementById("result-test_name").innerHTML = test_name;
  questions_length = final_tema_amount * 3;
  vidpovidnist_length = final_tema_amount * 1;
  hronology_length = final_tema_amount * 1;
  mul_ans_length = final_tema_amount * 1;
  questionCount =
    questions_length + vidpovidnist_length + hronology_length + mul_ans_length;
  startingMinutes = questionCount;
  currentTest.startingMinutes = startingMinutes;
  time = startingMinutes * 60;
  startTime = time;
  timerInterval = setInterval(updateCountdown, 1000);
  let temp_questions = [];
  let temp_vidpovidnist = [];
  let temp_hronology = [];
  let temp_mul_ans = [];
  test_uuid = Math.random().toString(36).substring(2, 10);

  questions.forEach((q) => {
    q.q_type = "abcd";
  });
  vidpovidnist_questions.forEach((q) => {
    q.q_type = "vidp";
  });
  hronology_questions.forEach((q) => {
    q.q_type = "hron";
  });
  mul_ans_questions.forEach((q) => {
    q.q_type = "mul_ans";
  });

  // Track used test_ids
  let used_test_ids = {
    abcd: {}, // Will store count per test_id
    vidp: new Set(), // Will store used test_ids
    hron: new Set(),
    mul_ans: new Set(),
  };

  for (let i = 0; i < questionCount; i++) {
    let currentQuestion;
    if (i < final_tema_amount * 3) {
      // Handle ABCD questions - 3 per test_id
      let availableQuestions = questions.filter((q) => {
        // Only include questions where we haven't used 3 from that test_id yet
        return (
          !used_test_ids.abcd[q.test_id] || used_test_ids.abcd[q.test_id] < 3
        );
      });

      if (availableQuestions.length > 0) {
        let randomQuestionIndex = Math.floor(
          Math.random() * availableQuestions.length
        );
        currentQuestion = availableQuestions[randomQuestionIndex];

        // Initialize or increment counter for this test_id
        used_test_ids.abcd[currentQuestion.test_id] =
          (used_test_ids.abcd[currentQuestion.test_id] || 0) + 1;

        temp_questions.push(currentQuestion);
      }
    } else if (i > final_tema_amount * 3 - 1 && i < final_tema_amount * 4) {
      // Handle vidpovidnist questions - 1 per test_id
      let availableQuestions = vidpovidnist_questions.filter(
        (q) =>
          !used_test_ids.vidp.has(q.test_id) && !temp_vidpovidnist.includes(q)
      );

      if (availableQuestions.length > 0) {
        let randomQuestionIndex = Math.floor(
          Math.random() * availableQuestions.length
        );
        currentQuestion = availableQuestions[randomQuestionIndex];
        used_test_ids.vidp.add(currentQuestion.test_id);
        temp_vidpovidnist.push(currentQuestion);
      }
    } else if (i > final_tema_amount * 4 - 1 && i < final_tema_amount * 5) {
      // Handle hronology questions - 1 per test_id
      let availableQuestions = hronology_questions.filter(
        (q) => !used_test_ids.hron.has(q.test_id) && !temp_hronology.includes(q)
      );

      if (availableQuestions.length > 0) {
        let randomQuestionIndex = Math.floor(
          Math.random() * availableQuestions.length
        );
        currentQuestion = availableQuestions[randomQuestionIndex];
        used_test_ids.hron.add(currentQuestion.test_id);
        temp_hronology.push(currentQuestion);
      }
    } else if (i > final_tema_amount * 5 - 1 && i < final_tema_amount * 6) {
      // Handle multiple answer questions - 1 per test_id
      let availableQuestions = mul_ans_questions.filter(
        (q) =>
          !used_test_ids.mul_ans.has(q.test_id) && !temp_mul_ans.includes(q)
      );

      if (availableQuestions.length > 0) {
        let randomQuestionIndex = Math.floor(
          Math.random() * availableQuestions.length
        );
        currentQuestion = availableQuestions[randomQuestionIndex];
        used_test_ids.mul_ans.add(currentQuestion.test_id);
        temp_mul_ans.push(currentQuestion);
      }
    }
  }

  // Sort and combine all questions
  test_questions.push(
    ...temp_questions
      .sort((p1, p2) => {
        if (p1.year !== p2.year) {
          return p1.year - p2.year;
        }
      })
      .sort((p1, p2) => {
        return compareTestIds(p1.test_id, p2.test_id);
      }),
    ...temp_vidpovidnist.sort((p1, p2) => {
      return compareTestIds(p1.test_id, p2.test_id);
    }),
    ...temp_hronology.sort((p1, p2) => {
      return compareTestIds(p1.test_id, p2.test_id);
    }),
    ...temp_mul_ans.sort((p1, p2) => {
      return compareTestIds(p1.test_id, p2.test_id);
    })
  );
}
function startFullTest() {
  currentTest.id = test_id;
  currentTest.test_type = test_type;
  currentTest.block_id = block_id;
  document.getElementById("test_name").innerHTML =
    "Тема " + test_id + ": " + test_name;
  document.getElementById("result-test_name").innerHTML =
    "Тема " + test_id + ": " + test_name;
  questions_length = questions.length;
  vidpovidnist_length = vidpovidnist_questions.length;
  hronology_length = hronology_questions.length;
  mul_ans_length = mul_ans_questions.length;
  questionCount =
    questions_length + vidpovidnist_length + hronology_length + mul_ans_length;
  startingMinutes = questionCount;
  currentTest.startingMinutes = startingMinutes;
  time = startingMinutes * 60;
  startTime = time;
  timerInterval = setInterval(updateCountdown, 1000);
  test_uuid = Math.random().toString(36).substring(2, 10);

  questions.forEach((q) => {
    q.q_type = "abcd";
  });
  vidpovidnist_questions.forEach((q) => {
    q.q_type = "vidp";
  });
  hronology_questions.forEach((q) => {
    q.q_type = "hron";
  });
  mul_ans_questions.forEach((q) => {
    q.q_type = "mul_ans";
  });
  let temp_1 = [];
  test_questions = temp_1
    .concat(
      questions.sort((p1, p2) => {
        if (p1.year !== p2.year) {
          return p1.year - p2.year;
        }
        return compareTestIds(p1.test_id, p2.test_id);
      })
    )
    .concat(
      vidpovidnist_questions.sort((p1, p2) => {
        return compareTestIds(p1.test_id, p2.test_id);
      })
    )
    .concat(
      hronology_questions.sort((p1, p2) => {
        return compareTestIds(p1.test_id, p2.test_id);
      })
    )
    .concat(
      mul_ans_questions.sort((p1, p2) => {
        return compareTestIds(p1.test_id, p2.test_id);
      })
    );
}
function continueOldTest() {
  currentQuestionIndex = currentTest.currentQuestionIndex;
  time = currentTest.time;
  startTime = time;
  clearInterval(timerInterval);
  timerInterval = setInterval(updateCountdown, 1000);
  test_uuid = currentTest.uuid;
  const savedAnswers = currentTest.answers;

  // Reset test_questions array before populating it
  test_questions = [];

  // Add questions in the correct order based on the saved answers
  savedAnswers.forEach((savedAnswer) => {
    // Find matching question from our loaded questions
    let matchingQuestion;
    if (
      savedAnswer.question ===
      questions.find(
        (q) =>
          q.question === savedAnswer.question &&
          (!savedAnswer.test_id || savedAnswer.test_id === q.test_id)
      )?.question
    ) {
      matchingQuestion = questions.find(
        (q) =>
          q.question === savedAnswer.question &&
          (!savedAnswer.test_id || savedAnswer.test_id === q.test_id)
      );
    } else if (
      savedAnswer.question ===
      vidpovidnist_questions.find(
        (q) =>
          q.question === savedAnswer.question &&
          (!savedAnswer.test_id || savedAnswer.test_id === q.test_id)
      )?.question
    ) {
      matchingQuestion = vidpovidnist_questions.find(
        (q) =>
          q.question === savedAnswer.question &&
          (!savedAnswer.test_id || savedAnswer.test_id === q.test_id)
      );
    } else if (
      savedAnswer.question ===
      hronology_questions.find(
        (q) =>
          q.question === savedAnswer.question &&
          (!savedAnswer.test_id || savedAnswer.test_id === q.test_id)
      )?.question
    ) {
      matchingQuestion = hronology_questions.find(
        (q) =>
          q.question === savedAnswer.question &&
          (!savedAnswer.test_id || savedAnswer.test_id === q.test_id)
      );
    } else if (
      savedAnswer.question ===
      mul_ans_questions.find(
        (q) =>
          q.question === savedAnswer.question &&
          (!savedAnswer.test_id || savedAnswer.test_id === q.test_id)
      )?.question
    ) {
      matchingQuestion = mul_ans_questions.find(
        (q) =>
          q.question === savedAnswer.question &&
          (!savedAnswer.test_id || savedAnswer.test_id === q.test_id)
      );
    }

    if (matchingQuestion) {
      matchingQuestion.selected = savedAnswer.selected;

      if (matchingQuestion.q_type !== "abcd") {
        let correct_percentage = matchingQuestion.q_type === "mul_ans" ? 1 : 0;
        let add_percentage = matchingQuestion.q_type === "mul_ans" ? 33 : 25;

        for (let i = 0; i < matchingQuestion.correct.length; i++) {
          if (matchingQuestion.correct[i] === matchingQuestion.selected[i]) {
            correct_percentage += add_percentage;
          }
        }
        matchingQuestion.correct_percentage = correct_percentage;
        if (correct_percentage == 100) {
          matchingQuestion.isCorrect = true;
        }
      } else {
        matchingQuestion.isCorrect =
          matchingQuestion.answers.find((a) => a.correct).text ===
          matchingQuestion.selected;

        if (matchingQuestion.isCorrect) {
          matchingQuestion.correct_percentage = 100;
        }
      }

      test_questions.push(matchingQuestion);
    }
  });

  // Update questionCount to match the actual number of questions
  questionCount = test_questions.length;

  if (test_type != "summary") {
    saveUncompletedTest();
  }
}
function saveUncompletedTest() {
  let temp_answers = [];
  test_questions.forEach((q) => {
    temp_answers.push({
      question: q.question,
      selected: q.selected,
      test_id: q.test_id,
    });
  });
  currentTest.answers = temp_answers;
  currentTest.time = time;
  currentTest.startingMinutes = startingMinutes;
  currentTest.uuid = test_uuid;
  currentTest.date = Date.now();
  currentTest.currentQuestionIndex = currentQuestionIndex;
  currentTest.id = test_id;
  currentTest.block_id = block_id;
  currentTest.test_type = test_type;

  // Filter out old test with same ID
  uncompletedTests = uncompletedTests.filter(
    (test) =>
      !(
        test.id == test_id &&
        test.block_id == block_id &&
        test.test_type == test_type
      )
  );
  uncompletedTests.push(currentTest);
  localStorage.setItem(
    `uncompletedTests-${course}`,
    JSON.stringify(uncompletedTests)
  );
  setCookie(`lastUncompletedTestsUpdate-${course}`, Date.now());
}

async function syncUncompletedTests() {
  const current_time = Date.now();
  let last_update = getCookie(`lastUncompletedTestsUpdate-${course}`);

  if (last_update == null) {
    localStorage.clear();
  }
  if (uncompletedTests.length > 9) {
    uncompletedTests = uncompletedTests
      .sort((a, b) => b.date - a.date)
      .slice(0, 9);
    localStorage.setItem(
      `uncompletedTests-${course}`,
      JSON.stringify(uncompletedTests)
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
          course,
          last_update,
        }),
      });

      if (response.ok) {
        const server_data = await response.json();
        if (!last_update || server_data.last_updated > parseInt(last_update)) {
          uncompletedTests = server_data.tests;
          localStorage.setItem(
            `uncompletedTests-${course}`,
            JSON.stringify(uncompletedTests)
          );
          setCookie(
            `lastUncompletedTestsUpdate-${course}`,
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
          course,
          tests: uncompletedTests,
          last_updated: last_update,
        }),
      });
    }
  } catch (error) {
    console.error("Error syncing uncompleted tests:", error);
  }
}

syncInterval = setInterval(syncUncompletedTests, 300000);

window.addEventListener("beforeunload", (event) => {
  if (has_user_interacted && !test_completed) {
    if (test_type != "summary") {
      saveUncompletedTest();
    }
    syncUncompletedTests();
  }
});

Array.from(ansSheetGrid).forEach((button) => {
  button.addEventListener("click", selectAnswer);
});
const countdownEl = document.getElementById("timer");
function updateCountdown() {
  if (!testIsPaused) {
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    countdownEl.innerHTML = `Часу залишилося: ${minutes}:${seconds}`;
    if (time == 0) {
      showScore();
      clearInterval(timerInterval);
      countdownEl.innerHTML = "Час вийшов!";
    } else {
      time--;
    }
    if (time < startTime / 2) {
      document.getElementById("timer_line").style.background =
        "rgb(140, 126, 0)";
    }
    if (time < startTime / 4) {
      document.getElementById("timer_line").style.background =
        "rgb(84, 26, 26)";
    }
    document.getElementById("timer_line").style.width =
      (time / (startingMinutes * 60)) * 100 + "%";

    var today = new Date();
    let day = today.getDate();
    day = day < 10 ? "0" + day : day;
    let month = today.getMonth() + 1;
    month = month < 10 ? "0" + month : month;
    var date = day + "/" + month + "/" + today.getFullYear();
    var time_str =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + " " + time_str;
    // document.getElementById("date").innerHTML = dateTime;
  }
}
function showScore() {
  topLine.innerHTML = "";
  middleLines.innerHTML = "";
  bottomLine.innerHTML = "";
  document.getElementById("question_image").src = "";
  document.getElementById("read-explanation-btn").classList.add("display-none");
  Array.from(document.getElementsByClassName("answered")).forEach((item) => {
    item.classList.remove("answered");
  });
  Array.from(
    document.getElementsByClassName("question_answers_list-element-text")
  ).forEach((field) => {
    if (field.innerHTML == "" || field.innerHTML == "undefined") {
      field.parentElement.classList.add("display-none");
    }
  });
  clearInterval(timerInterval);
  score = 100;
  let q_points = 100 / test_questions.length;
  test_questions.forEach((q) => {
    if (!q.isCorrect) {
      score = score - q_points;
      console.log(q.q_type, q.test_id, q.question);
    }
  });
  sendTestResult()
    .then(() => {
      finishTestButton.innerHTML = "Пройти знову";
      currentQuestionIndex = 0;
      showQuestion();
      document.getElementById("test_result").classList.remove("display-none");
      document.getElementById("test_result-block_answers").innerHTML =
        block_answers.innerHTML;
      Array.from(
        document.getElementById("test_result-block_answers").children
      ).forEach((qId) => {
        qId.id = "_" + qId.id;
        qId.classList.remove("selected");
        qId.addEventListener("click", () => {
          document.getElementById("test_result").classList.add("display-none");
          if (!testIsPaused) {
            saveNumAnswer();
            currentQuestionIndex = qId.innerHTML - 1;
            showQuestion();
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }
        });
      });
      document
        .getElementById("test_result-close")
        .addEventListener("click", () => {
          document
            .getElementById("test_result")
            .classList.toggle("display-none");
        });
    })
    .catch((error) => {
      console.error("Failed to complete test submission:", error);
    });
}

async function sendTestResult() {
  test_completed = true;
  const updatedUncompletedTests = uncompletedTests.filter(
    (test) => !(test.uuid == test_uuid)
  );
  uncompletedTests = updatedUncompletedTests;
  localStorage.setItem(
    `uncompletedTests-${course}`,
    JSON.stringify(uncompletedTests)
  );
  syncUncompletedTests();
  let _test_id = test_id || last_test_id;
  let test_abcd_q = [];
  let test_hron_q = [];
  let test_vidp_q = [];
  let test_mul_ans_q = [];
  Array.from(test_questions).forEach((q) => {
    switch (q.q_type) {
      case "abcd": {
        test_abcd_q.push(q);
        break;
      }
      case "hron": {
        test_hron_q.push(q);
        break;
      }
      case "vidp": {
        test_vidp_q.push(q);
        break;
      }
      case "mul_ans": {
        test_mul_ans_q.push(q);
        break;
      }
    }
  });
  let temp_abcd_questions_accuracy = 0;
  let temp_hronology_questions_accuracy = 0;
  let temp_vidpovidnist_questions_accuracy = 0;
  let temp_mul_ans_questions_accuracy = 0;

  test_abcd_q.forEach((q) => {
    if (q.isCorrect) {
      temp_abcd_questions_accuracy++;
    }
  });
  test_hron_q.forEach((q) => {
    temp_hronology_questions_accuracy += q.correct_percentage;
  });
  test_vidp_q.forEach((q) => {
    temp_vidpovidnist_questions_accuracy += q.correct_percentage;
  });
  test_mul_ans_q.forEach((q) => {
    temp_mul_ans_questions_accuracy += q.correct_percentage;
  });

  // For summary tests, use "summary" as the block ID
  const blockIdToSend = test_type === "summary" ? "summary" : block_id;
  
  let testData = {
    date: Date.now(),
    time: startingMinutes * 60 - time,
    test_type,
    block: blockIdToSend,
    test: _test_id,
    score: Math.ceil(score),
    auth_key,
    uuid: test_uuid,
    test_name: test_name,
    courseName: course,
    abcd_questions_accuracy: Math.ceil(
      (temp_abcd_questions_accuracy * 100) / test_abcd_q.length
    ),
    hronology_questions_accuracy: Math.ceil(
      temp_hronology_questions_accuracy / test_hron_q.length
    ),
    vidpovidnist_questions_accuracy: Math.ceil(
      temp_vidpovidnist_questions_accuracy / test_vidp_q.length
    ),
    mul_ans_questions_accuracy: Math.ceil(
      temp_mul_ans_questions_accuracy / test_mul_ans_q.length
    ),
  };
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
  document.getElementById(
    "test_result-correct_amount"
  ).innerHTML = `${Math.ceil(testData.score)}%`;
  document.getElementById("test_result-abcd").innerHTML = `${Math.ceil(
    testData.abcd_questions_accuracy
  )}%`;
  document.getElementById(
    "test_result-date"
  ).innerHTML = `${new Date().toLocaleDateString()} • ${String(
    new Date().getHours()
  ).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
  document.getElementById("test_result-vidp").innerHTML = `${Math.ceil(
    testData.vidpovidnist_questions_accuracy
  )}%`;
  document.getElementById("test_result-hron").innerHTML = `${Math.ceil(
    testData.hronology_questions_accuracy
  )}%`;
  document.getElementById("test_result-mul_ans").innerHTML = `${Math.ceil(
    testData.mul_ans_questions_accuracy
  )}%`;
  document.getElementById("test_result-time").innerHTML = `${formatTime(
    testData.time
  )}`;
  return fetch("/api/course/sendTestResult", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...testData,
      questions_data: test_questions,
    }),
  })
    .then((response) => {
      if (response.status == 403) {
        window.location.reload();
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Test result sent successfully");
      // Create floating buttons after test completion
      createFloatingButtons();

      const testUrl = `${window.location.origin}/test_results/?uuid=${test_uuid}&course=${course}`;
      showSharePopup(testUrl);
      if (data.test_params) {
        const testUrl = `${window.location.origin}${window.location.pathname}${data.test_params}`;
        showTestUrlModal(testUrl);
      }
    })
    .catch((error) => {
      console.error("Error sending test result:", error);
      throw error;
    });
}

function readExplanation() {
  commentWindow.classList.remove("display-none");
  commentText.classList.remove("display-none");
  readExplanationBtn.classList.add("display-none");

  // Reset animation by removing and re-adding the element
  commentText.style.animation = "none";
  commentText.offsetHeight; // Trigger reflow
  commentText.style.animation = null;
}

readExplanationBtn.addEventListener("click", () => {
  readExplanation();
});

function resetState() {
  commentText.innerHTML = "";
  commentText.classList.add("display-none");
  commentWindow.classList.add("display-none");
  readExplanationBtn.classList.remove("display-none");
  Array.from(document.getElementsByClassName("block_answers-item")).forEach(
    (q_id) => {
      q_id.classList.remove("selected");
    }
  );
  middleLines.innerHTML = "";
  ansSheetBtns.classList.add("display-none");
  if (currentQuestionIndex == 0) {
    document.getElementById("back_arrow").classList.add("invisible");
  } else {
    document.getElementById("back_arrow").classList.remove("invisible");
  }
  if (currentQuestionIndex == questionCount - 1) {
    document.getElementById("next_arrow").classList.add("invisible");
  } else {
    document.getElementById("next_arrow").classList.remove("invisible");
  }
  numeric_answers.classList.add("display-none");
  inputAnswerQuestion = false;
  Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
    (element) => {
      element.classList.add("blurred");
    }
  );
  Array.from(
    document.getElementsByClassName("question_answers_list-element-row")
  ).forEach((field) => {
    field.classList.remove("display-none");
  });
  Array.from(document.getElementsByClassName("zoomed")).forEach((el) => {
    el.classList.remove("zoomed");
  });
  Array.from(ansSheetGrid).forEach((button) => {
    if (button.classList.contains("selected")) {
      button.classList.remove("selected");
    }
  });
  Array.from(ansSheetGrid).forEach((button) => {
    button.classList.remove("incorrect");
    button.classList.remove("correct");
    button.classList.remove("yellow-selected");
    button.classList.remove("debug_answer1");
    button.classList.remove("debug_answer2");
    button.classList.remove("debug_answer3");
  });
  Array.from(
    document.getElementsByClassName("question_answers_list-element-text")
  ).forEach((field) => {
    field.classList.remove("debug_answer1");
    field.classList.remove("debug_answer2");
    field.classList.remove("debug_answer3");
  });
  Array.from(
    document.getElementsByClassName("question_answers_list-element-text")
  ).forEach((field) => {
    field.classList.remove("incorrect");
    field.classList.remove("correct");
    field.classList.remove("yellow-selected");
  });
  for (i = 1; i < 4; i++) {
    let answer_field = document.getElementById("text_input" + i);
    answer_field.value = "";
    answer_field.classList.remove("correct");
    answer_field.classList.remove("incorrect");
    answer_field.classList.remove("yellow-selected");
    answer_field.disabled = false;
  }
  chosen_answers_from_sheet = "XXXX";
  while (answerButtons.firstChild) {
    answerButtons.removeChild(answerButtons.firstChild);
  }
  document.getElementById("af").innerHTML = "";
  document.getElementById("bf").innerHTML = "";
  document.getElementById("cf").innerHTML = "";
  document.getElementById("df").innerHTML = "";
  document.getElementById("f1").innerHTML = "";
  document.getElementById("f2").innerHTML = "";
  document.getElementById("f3").innerHTML = "";
  document.getElementById("f4").innerHTML = "";
  document.getElementById("f5").innerHTML = "";
  document.getElementById("f6").innerHTML = "";
  document.getElementById("f7").innerHTML = "";
  image_xhr.abort();
}

function removeFromArray(array, element) {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
  }
}

if (getCookie("debugAnswers") != null) {
  let autofill = false;
  let autofillInterval;

  function toggleFillAnswers(interval = 1000, randomTime = false) {
    if (autofill) {
      // Stop if running
      autofill = false;
      if (autofillInterval) {
        clearTimeout(autofillInterval);
      }
      console.log("Autofill stopped");
    } else {
      // Start if stopped
      autofill = true;
      autofillInterval = interval;
      fillAnswers(interval, randomTime);
      console.log("Autofill started with interval:", interval);
    }
  }

  function fillAnswers(interval = 1000, randomTime = false) {
    if (autofill) {
      if (currentQuestionIndex < questionCount) {
        console.log(displayedQuestion.correct);
        if (
          displayedQuestion.q_type == "hron" ||
          displayedQuestion.q_type == "vidp"
        ) {
          // Handle chronology and correspondence questions
          for (let i = 0; i < 4; i++) {
            const correctAnswer = displayedQuestion.correct[i];
            const button = document.getElementById(
              `${String.fromCharCode(97 + i)}${correctAnswer}`
            );
            if (button) button.click();
          }
        } else if (displayedQuestion.q_type == "abcd") {
          // Handle multiple choice questions
          const correctAnswer = displayedQuestion.answers.find(
            (answer) => answer.correct
          );
          if (correctAnswer) {
            const buttons = document.querySelectorAll(".abcd_button");
            buttons.forEach((button) => {
              if (button.innerHTML === correctAnswer.text) {
                button.click();
              }
            });
          }
        } else if (displayedQuestion.q_type == "mul_ans") {
          // Handle multiple answer questions
          for (let i = 0; i < 3; i++) {
            const input = document.getElementById("text_input" + (i + 1));
            if (input) {
              input.value = displayedQuestion.correct[i];
              // Trigger input event to save the answer
              input.dispatchEvent(new Event("input"));
            }
          }
        }
        displayedQuestion.correct_percentage = 100;
        displayedQuestion.isCorrect = true;

        if (autofill) {
          autofillInterval = setTimeout(() => {
            if (currentQuestionIndex < questionCount - 1) {
              if (randomTime) {
                time = time - Math.floor(Math.random() * (20 - 10 + 1) + 10);
              }
              handleNextButton();
            } else {
              autofill = false;
              console.log("Autofill completed");
            }
            fillAnswers(interval, randomTime);
          }, interval);
        }
      } else {
        autofill = false;
        console.log("Autofill completed");
      }
    }
  }
}

let image_xhr = new XMLHttpRequest();
function checkIfImageExists(blockId, testId, imageId) {
  image_xhr = new XMLHttpRequest();
  image_xhr.onreadystatechange = function () {
    if (image_xhr.readyState === XMLHttpRequest.DONE) {
      if (image_xhr.status === 200) {
        // Construct the image URL with a cache buster
        const imageUrl = `/api/course/getImage?auth_key=${auth_key}&course=${course}&blockId=${blockId}&testId=${testId}&imageId=${imageId}&t=${new Date().getTime()}`;

        const questionImageElement = document.getElementById("question_image");
        if (questionImageElement) {
          questionImageElement.src = imageUrl;
          questionImageElement.onload = function () {
            // Check if mobile device using window width
            const isMobile = window.innerWidth <= 768;
            document.getElementById("question_image").style.height = isMobile
              ? "120px"
              : "300px";
            Array.from(
              document.getElementsByClassName("__can_be_blurred")
            ).forEach((element) => {
              element.classList.remove("blurred");
            });
          };
        } else {
          console.error("Element with ID 'question_image' not found.");
        }
      } else {
        if (false) {
          console.error(`Failed to fetch image. Status: ${image_xhr.status}`);
        }
        document.getElementById("question_image").src = "";
        document.getElementById("question_image").style.height = "0px";
        Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
          (element) => {
            element.classList.remove("blurred");
          }
        );
      }
    }
  };

  image_xhr.ontimeout = function () {
    console.error("The request for the image timed out.");
    document.getElementById("question_image").src = "";
    Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
      (element) => {
        element.classList.remove("blurred");
      }
    );
  };

  image_xhr.open(
    "GET",
    `/api/course/getImage?auth_key=${auth_key}&course=${course}&blockId=${blockId}&testId=${testId}&imageId=${imageId}`,
    true
  );
  image_xhr.send();
}

function showQuestion() {
  resetState();
  currentTest.currentQuestionIndex = currentQuestionIndex;
  let currentQuestion = test_questions[currentQuestionIndex];
  const q_id = document.getElementById("q" + (currentQuestionIndex + 1));
  if (q_id) {
    q_id.classList.add("selected");
  } else {
    console.log("q_id not found: q" + (currentQuestionIndex + 1));
  }
  displayedQuestion = currentQuestion;
  if (!displayedQuestion) {
    console.log("displayedQuestion not found: q" + (currentQuestionIndex + 1));
  }
  let questionNo = currentQuestionIndex + 1;
  questionNumber.innerHTML = questionNo;
  if (displayedQuestion.comment && displayedQuestion.comment != "") {
    commentText.innerHTML = displayedQuestion.comment;
    if (test_completed) {
      commentWindow.classList.remove("display-none");
    }
  }
  topLine.classList.remove("display-none");
  currentQuestion.top_question
    ? (topLine.innerHTML = currentQuestion.top_question)
    : topLine.classList.add("display-none");
  middleLines.classList.remove("display-none");
  currentQuestion.middle_rows
    ? currentQuestion.middle_rows.forEach((row) => {
        const mid_row = document.createElement("div");
        mid_row.innerHTML = row;
        mid_row.classList.add("middle_lines-element");
        middleLines.appendChild(mid_row);
      })
    : (middleLines.innerHTML = "");
  bottomLine.classList.remove("display-none");
  currentQuestion.bottom_question
    ? (bottomLine.innerHTML = currentQuestion.bottom_question)
    : bottomLine.classList.add("display-none");
  checkIfImageExists(
    block_id,
    currentQuestion.test_id,
    currentQuestion.question
  );
  document.getElementById("af").innerHTML = currentQuestion.af
    ? currentQuestion.af
    : "";
  document.getElementById("bf").innerHTML = currentQuestion.bf
    ? currentQuestion.bf
    : "";
  document.getElementById("cf").innerHTML = currentQuestion.cf
    ? currentQuestion.cf
    : "";
  document.getElementById("df").innerHTML = currentQuestion.df
    ? currentQuestion.df
    : "";

  if (currentQuestion.q_type == "abcd") {
    document.getElementById("list_num-fields").classList.add("display-none");
    document
      .getElementById("list_abcd-fields")
      .classList.remove("display-none");
    currentQuestion.answers.forEach((answer) => {
      const button = document.createElement("div");
      button.innerHTML = answer.text;
      button.classList.add("abcd_button");
      if (getCookie("debugAnswers") != null) {
        if (answer.correct) {
          button.classList.add("debug_answer1");
        } else {
          button.classList.add("debug_answer2");
        }
      }
      if (answer.text == currentQuestion.selected && !test_completed) {
        button.classList.add("selected");
      }
      answerButtons.appendChild(button);
      if (answer.correct) {
        button.dataset.correct = answer.correct;
      }
      if (test_completed) {
        if (button.innerHTML == currentQuestion.selected) {
          button.classList.add("incorrect");
        }
        if (button.dataset.correct) {
          button.classList.add("correct");
        }
        if (
          !(
            button.classList.contains("correct") ||
            button.classList.contains("incorrect")
          )
        ) {
          button.classList.add("half-visible");
        }
      }
      button.addEventListener("click", selectAnswer);
    });
  } else {
    if (currentQuestion.q_type == "vidp") {
      document
        .getElementById("list_abcd-fields")
        .classList.remove("display-none");
      document
        .getElementById("list_num-fields")
        .classList.remove("display-none");
      ansSheetBtns.classList.remove("display-none");
      document
        .getElementById("answer_sheet_column-5")
        .classList.remove("display-none");
      document.getElementById("f1").innerHTML = currentQuestion.f1;
      document.getElementById("f2").innerHTML = currentQuestion.f2;
      document.getElementById("f3").innerHTML = currentQuestion.f3;
      document.getElementById("f4").innerHTML = currentQuestion.f4;
      document.getElementById("f5").innerHTML = currentQuestion.f5;
      Array.from(ansSheetGrid).forEach((button) => {
        const index = button.id[0].charCodeAt(0) - "a".charCodeAt(0); // Calculate the index based on 'a', 'b', 'c', 'd'

        if (index >= 0 && index < 4) {
          if (test_completed) {
            if (button.id[1] == currentQuestion.correct[index]) {
              if (
                button.id[1] == currentQuestion.selected[index] &&
                currentQuestion.selected != currentQuestion.correct
              ) {
                button.classList.add("yellow-selected");
              } else {
                button.classList.add("correct");
              }
            } else {
              if (button.id[1] == currentQuestion.selected[index]) {
                button.classList.add("incorrect");
              }
            }
          } else {
            if (button.id[1] == currentQuestion.selected[index]) {
              button.classList.add("selected");
            }
            if (getCookie("debugAnswers") != null) {
              if (button.id[1] == currentQuestion.correct[index]) {
                button.classList.add("debug_answer1");
              } else {
                button.classList.add("debug_answer2");
              }
            }
          }
        }
      });
    } else if (currentQuestion.q_type == "hron") {
      document
        .getElementById("list_abcd-fields")
        .classList.remove("display-none");
      document.getElementById("list_num-fields").classList.add("display-none");
      ansSheetBtns.classList.remove("display-none");
      document
        .getElementById("answer_sheet_column-5")
        .classList.add("display-none");
      Array.from(ansSheetGrid).forEach((button) => {
        const index = button.id[0].charCodeAt(0) - "a".charCodeAt(0); // Calculate the index based on 'a', 'b', 'c', 'd'

        if (index >= 0 && index < 4) {
          if (test_completed) {
            if (button.id[1] == currentQuestion.correct[index]) {
              if (
                button.id[1] == currentQuestion.selected[index] &&
                currentQuestion.selected != currentQuestion.correct
              ) {
                button.classList.add("yellow-selected");
              } else {
                button.classList.add("correct");
              }
            } else {
              if (button.id[1] == currentQuestion.selected[index]) {
                button.classList.add("incorrect");
              }
            }
          } else {
            if (button.id[1] == currentQuestion.selected[index]) {
              button.classList.add("selected");
            }
            if (getCookie("debugAnswers") != null) {
              if (button.id[1] == currentQuestion.correct[index]) {
                button.classList.add("debug_answer1");
              } else {
                button.classList.add("debug_answer2");
              }
            }
          }
        }
      });
    } else if (currentQuestion.q_type == "mul_ans") {
      document.getElementById("f1").innerHTML = currentQuestion.f1;
      document.getElementById("f2").innerHTML = currentQuestion.f2;
      document.getElementById("f3").innerHTML = currentQuestion.f3;
      document.getElementById("f4").innerHTML = currentQuestion.f4;
      document.getElementById("f5").innerHTML = currentQuestion.f5;
      document.getElementById("f6").innerHTML = currentQuestion.f6;
      document.getElementById("f7").innerHTML = currentQuestion.f7;
      if (getCookie("debugAnswers") != null) {
        for (let i = 0; i < 3; i++) {
          document
            .getElementById("f" + currentQuestion.correct[i] + "_num")
            .classList.add("debug_answer3");
        }
      }
      numeric_answers.classList.remove("display-none");
      document
        .getElementById("list_num-fields")
        .classList.remove("display-none");
      document.getElementById("list_abcd-fields").classList.add("display-none");
      inputAnswerQuestion = true;
      if (currentQuestion.selected != "") {
        for (i = 1; i < 4; i++) {
          let answer_field = document.getElementById("text_input" + i);
          if (currentQuestion.selected[i - 1] != undefined) {
            answer_field.value = currentQuestion.selected[i - 1];
          } else {
            answer_field.value = "0";
          }
        }
      }
      if (test_completed) {
        for (i = 1; i < 4; i++) {
          let answer_field = document.getElementById("text_input" + i);
          answer_field.disabled = true;
          if (currentQuestion.selected != "") {
            if (currentQuestion.isCorrect) {
              answer_field.classList.add("correct");
            } else if (
              currentQuestion.correct.includes(currentQuestion.selected[i - 1])
            ) {
              answer_field.classList.add("yellow-selected", "noImg");
            } else {
              answer_field.classList.add("incorrect");
            }
          }
        }
        for (j = 1; j < 8; j++) {
          if (currentQuestion.isCorrect) {
            if (currentQuestion.selected.includes(j)) {
              document.getElementById("f" + j).classList.add("correct");
            }
          } else {
            if (currentQuestion.correct.includes(j)) {
              if (currentQuestion.selected.includes(j)) {
                document
                  .getElementById("f" + j)
                  .classList.add("yellow-selected", "noImg");
              } else {
                document.getElementById("f" + j).classList.add("correct");
              }
            } else if (currentQuestion.selected.includes(j)) {
              document.getElementById("f" + j).classList.add("incorrect");
            }
          }
        }
      }
    }
    if (currentQuestionIndex == questionCount - 1 && !test_completed) {
      finishTestButton.classList.remove("display-none");
    }
  }
  Array.from(
    document.getElementsByClassName("question_answers_list-element-text")
  ).forEach((field) => {
    if (field.innerHTML == "" || field.innerHTML == "undefined") {
      field.parentElement.classList.add("display-none");
    }
  });
  const showTestID =
    test_type == "final" || test_type == "summary"
      ? `${currentQuestion.test_id}/`
      : "";
  document.getElementById("question_id").innerHTML =
    showTestID + "ID#" + currentQuestion.question;
  if (getCookie("debugAnswers") != null) {
    if (displayedQuestion.correct != null) {
      console.log(
        `${displayedQuestion.question} → ${displayedQuestion.correct}`
      );
    } else {
      console.log(
        `${displayedQuestion.question} → ${
          displayedQuestion.answers.filter((a) => a.correct)[0].text
        }`
      );
    }
  }
  renderMathInElement(document.body);
}

function selectAnswer(e) {
  has_user_interacted = true;
  if (!test_completed && !testIsPaused) {
    const q_id = document.getElementById("q" + (currentQuestionIndex + 1));
    const selectedBtn = e.target;
    let currentQuestion = displayedQuestion;

    if (currentQuestion.q_type == "abcd") {
      Array.from(answerButtons.children).forEach((button) => {
        button.classList.remove("selected");
      });
      q_id.classList.remove("incorrect");
      q_id.classList.remove("correct");
      selectedBtn.classList.add("selected");
      const isCorrect = selectedBtn.dataset.correct === "true";
      if (isCorrect) {
        q_id.classList.add("correct");
        currentQuestion.isCorrect = true;
      } else {
        q_id.classList.add("incorrect");
        currentQuestion.isCorrect = false;
      }
      q_id.classList.add("answered");
      currentQuestion.selected = selectedBtn.innerHTML;
    }
    if (currentQuestion.q_type == "vidp" || currentQuestion.q_type == "hron") {
      let selected_answers = [];
      Array.from(ansSheetGrid).forEach((button) => {
        if (button.classList.contains("selected")) {
          selected_answers.push(button);
        }
      });
      selectedBtn.classList.add("selected");
      Array.from(selected_answers).forEach((answer) => {
        if (answer.id[0] == selectedBtn.id[0]) {
          answer.classList.remove("selected");
          selected_answers.splice(selected_answers.indexOf(answer), 1);
        }
      });
      selected_answers.push(selectedBtn);
      let chosen_answers_from_sheet = ["0", "0", "0", "0"];

      currentQuestion.correct_percentage = 0;
      Array.from(selected_answers).forEach((button) => {
        const index = button.id[0].charCodeAt(0) - "a".charCodeAt(0); // Calculate the index based on 'a', 'b', 'c', 'd'
        if (index >= 0 && index < chosen_answers_from_sheet.length) {
          chosen_answers_from_sheet[index] = button.id[1];
          if (
            chosen_answers_from_sheet[index] == currentQuestion.correct[index]
          ) {
            currentQuestion.correct_percentage += 25;
          }
        }
      });

      currentQuestion.selected = chosen_answers_from_sheet.join("");
      if (currentQuestion.selected == currentQuestion.correct) {
        q_id.classList.add("correct");
        currentQuestion.isCorrect = true;
      } else {
        q_id.classList.add("incorrect");
        currentQuestion.isCorrect = false;
      }
      q_id.classList.add("answered");
    }
    displayedQuestion = currentQuestion;
    test_questions[currentQuestionIndex] = currentQuestion;
    if (test_type != "summary") {
      saveUncompletedTest();
    }
  }
}

function saveNumAnswer() {
  has_user_interacted = true;
  if (inputAnswerQuestion) {
    let temp_str = "";
    const q_id = document.getElementById("q" + (currentQuestionIndex + 1));
    let currentQuestion = displayedQuestion;
    Array.from(numeric_answers.children).forEach((field) => {
      if (field.value.length == 1) {
        temp_str += field.value;
      } else {
        temp_str += "0";
      }
    });
    if (temp_str == "000") {
      temp_str = "";
    }
    currentQuestion.selected = temp_str.split("").sort().join("");
    if (temp_str != "") {
      currentQuestion.correct_percentage = 1;
      for (let i = 0; i < 3; i++) {
        if (currentQuestion.correct.includes(currentQuestion.selected[i])) {
          currentQuestion.correct_percentage += 33;
        }
      }
      if (currentQuestion.correct == currentQuestion.selected) {
        q_id.classList.add("correct");
        currentQuestion.isCorrect = true;
      } else {
        q_id.classList.add("incorrect");
        currentQuestion.isCorrect = false;
      }
      if (!test_completed) {
        q_id.classList.add("answered");
      }
    }
  }
  if (test_type != "summary") {
    saveUncompletedTest();
  }
}
Array.from(numeric_answers.children).forEach((field) => {
  field.addEventListener("input", function () {
    saveNumAnswer();
  });
});
function handleNextButton() {
  has_user_interacted = true;
  if (!test_completed) {
    if (currentQuestionIndex < questionCount) {
      saveNumAnswer();
      currentQuestionIndex++;
      showQuestion();
    }
  }
}
function finishTest() {
  has_user_interacted = true;
  let found_non_selected = false;
  let non_answered = "";
  for (let i = 0; i < questionCount; i++) {
    if (test_questions[i].selected == "") {
      found_non_selected = true;
      non_answered += " " + (i + 1);
    }
  }
  if (found_non_selected && !ignore_non_answered && startTime - time > 5) {
    currentQuestionIndex--;
    document.getElementById("alert_text").innerHTML =
      "Увага! Ви не відповіли на питання:" + non_answered;
    document.getElementById("alert_window").classList.remove("display-none");
  } else {
    showScore();
  }
}
document.getElementById("alert_close_btn").addEventListener("click", () => {
  document.getElementById("alert_text").innerHTML = "";
  document.getElementById("alert_window").classList.add("display-none");
});

finishTestButton.addEventListener("click", () => {
  if (!testIsPaused && test_completed) {
    location.reload();
  } else if (!testIsPaused) {
    saveNumAnswer();
    finishTest();
  }
});

function nextQuestionArrow() {
  has_user_interacted = true;
  saveNumAnswer();
  currentQuestionIndex++;
  if (currentQuestionIndex < questionCount) {
    if (test_completed) {
      showQuestion();
    } else {
      currentQuestionIndex--;
      handleNextButton();
    }
  } else {
    currentQuestionIndex--;
  }
  if (test_type != "summary") {
    saveUncompletedTest();
  }
}
document.getElementById("next_arrow").addEventListener("click", () => {
  if (!testIsPaused) {
    nextQuestionArrow();
  }
});
function previousQuestionArrow() {
  has_user_interacted = true;
  saveNumAnswer();
  currentQuestionIndex--;
  if (currentQuestionIndex >= 0) {
    showQuestion();
  } else {
    currentQuestionIndex++;
  }
  if (test_type != "summary") {
    saveUncompletedTest();
  }
}
document.getElementById("back_arrow").addEventListener("click", () => {
  if (!testIsPaused) {
    previousQuestionArrow();
  }
});

function pauseTest() {
  if (!test_completed) {
    if (!testIsPaused) {
      testIsPaused = true;
      document.getElementById("pause_btn_img").src = "/assets/play.svg";
      Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
        (element) => {
          element.classList.add("blurred");
        }
      );
    } else {
      testIsPaused = false;
      document.getElementById("pause_btn_img").src = "/assets/pause.svg";
      Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
        (element) => {
          element.classList.remove("blurred");
        }
      );
    }
  }
}
function checkForCopium() {
  let checked = [];
  let copies = [];
  Array.from(questions).forEach((q) => {
    Array.from(checked).forEach((cq) => {
      if (
        cq.top_question == q.top_question &&
        cq.middle_rows[1] == q.middle_rows[1] &&
        cq.bottom_question == q.bottom_question &&
        cq.year == q.year
      ) {
        copies.push(q);
        copies.push(cq);
      }
    });
    checked.push(q);
  });
  console.log(copies);
}
document.getElementById("q_img").addEventListener("click", openFSI);
function zoomImg() {
  document.getElementById("q_img").classList.toggle("zoomed");
}
document.getElementById("fsic").addEventListener("click", openFSI);
function openFSI() {
  Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
    (element) => {
      element.classList.toggle("blurred");
    }
  );
  document.getElementById("fullScreenImg").src =
    document.getElementById("question_image").src;
  document.getElementById("fsic").classList.toggle("display-none");
}

numericInputs.forEach((input, index) => {
  // Handle input changes
  input.addEventListener("input", function (e) {
    // Remove any non-numeric characters
    let value = this.value.replace(/[^1-7]/g, "");

    // Check if the number is already used in other inputs
    if (value !== "") {
      const isNumberUsed = Array.from(numericInputs).some(
        (otherInput, otherIndex) => {
          return otherIndex !== index && otherInput.value === value;
        }
      );

      // If number is already used, clear the input
      if (isNumberUsed) {
        value = "";
      } else {
        // Ensure the value is between 1 and 7
        value = Math.max(1, Math.min(7, parseInt(value)));
      }
    }

    // Update input value
    this.value = value;

    if (value !== "") {
      if (index < 2) {
        // Focus next input if not the last one
        numericInputs[index + 1].focus();
      } else {
        // Blur (deselect) if it's the last input
        this.blur();
      }
    }
  });

  // Handle backspace
  input.addEventListener("keydown", function (e) {
    if (e.key === "Backspace" && this.value === "" && index > 0) {
      // Move to previous input when backspace is pressed on empty field
      numericInputs[index - 1].focus();
    }
  });

  // Set cursor position to end when focused
  input.addEventListener("focus", function (e) {
    // setTimeout ensures this runs after the default focus behavior
    setTimeout(() => {
      this.setSelectionRange(this.value.length, this.value.length);
    }, 0);
  });

  // Prevent non-numeric input and check for duplicates before allowing input
  input.addEventListener("keypress", function (e) {
    if (!/[1-7]/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Check if the number is already used in other inputs
    const isNumberUsed = Array.from(numericInputs).some(
      (otherInput, otherIndex) => {
        return otherIndex !== index && otherInput.value === e.key;
      }
    );

    if (isNumberUsed) {
      e.preventDefault();
    }
  });
});

// Update the global keyboard event listener
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !testIsPaused) {
    // Only trigger if we're not focused on a numeric input
    if (!document.activeElement.classList.contains("text_input")) {
      if (e.shiftKey) {
        // Shift+Enter goes to previous question
        previousQuestionArrow();
      } else {
        // Regular Enter goes to next question
        nextQuestionArrow();
      }
    }
  }
});

let debugPressTimer;
const questionIdElement = document.getElementById("question_id");
if (getCookie("group") != "student") {
  questionIdElement.addEventListener("click", () => {
    window.open(
      `/test_editor?q_id=${
        questionIdElement.innerHTML.split("#")[1]
      }&course=${course}&block=${block_id}&test=${displayedQuestion.test_id}`
    );
  });
} else {
  // Mouse events
  questionIdElement.addEventListener("mousedown", startDebugTimer);
  questionIdElement.addEventListener("mouseup", clearDebugTimer);
  questionIdElement.addEventListener("mouseleave", clearDebugTimer);

  // Touch events
  questionIdElement.addEventListener("touchstart", startDebugTimer);
  questionIdElement.addEventListener("touchend", clearDebugTimer);
  questionIdElement.addEventListener("touchcancel", clearDebugTimer);
}

function startDebugTimer(e) {
  // Prevent default touch behavior (like scrolling)
  if (e.type === "touchstart") {
    e.preventDefault();
  }

  debugPressTimer = setTimeout(() => {
    if (getCookie("debugAnswers") === null) {
      alert("Режим відладки активовано на 7 днів");
      setCookie("debugAnswers", true, 0.5);
      showQuestion();
    } else {
      alert("Режим відладки деактивовано");
      setCookie("debugAnswers", null, -1);
      showQuestion();
    }
  }, 5000);
}

function clearDebugTimer() {
  clearTimeout(debugPressTimer);
}

if (getCookie("removeBlur") === "true") {
  Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
    (element) => {
      element.classList.remove("__can_be_blurred");
      element.classList.remove("blurred");
    }
  );
}

function copyToClipboard(text) {
  // For modern browsers and iOS
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard
      .writeText(text)
      .then(() => {
        return true;
      })
      .catch(() => {
        // Fallback for older browsers
        return fallbackCopyToClipboard(text);
      });
  }
  // Fallback for non-secure contexts or older browsers
  return Promise.resolve(fallbackCopyToClipboard(text));
}

function fallbackCopyToClipboard(text) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);

    if (navigator.userAgent.match(/ipad|iphone/i)) {
      // iOS specific setup
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, 999999);
    } else {
      // Other devices
      textArea.select();
    }

    document.execCommand("copy");
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
}

function showTestUrlModal(url) {
  if (!document.getElementById("testUrlModal")) {
    const modalHtml = `
      <div id="testUrlModal" class="modal">
        <div class="modal-content">
          <h3>Посилання на результати тесту</h3>
          <div class="url-container">
            <input type="text" id="testUrlInput" readonly value="${url}">
            <button id="copyTestUrl">Копіювати</button>
          </div>
          <button id="closeTestUrlModal">Закрити</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Add event listeners
    document.getElementById("copyTestUrl").addEventListener("click", () => {
      copyToClipboard(document.getElementById("testUrlInput").value).then(
        (success) => {
          const copyBtn = document.getElementById("copyTestUrl");
          if (success) {
            copyBtn.textContent = "Скопійовано!";
            setTimeout(() => {
              copyBtn.textContent = "Копіювати";
            }, 2000);
          }
        }
      );
    });

    document.getElementById("testUrlInput").addEventListener("click", () => {
      copyToClipboard(document.getElementById("testUrlInput").value).then(
        (success) => {
          const copyBtn = document.getElementById("copyTestUrl");
          if (success) {
            copyBtn.textContent = "Скопійовано!";
            setTimeout(() => {
              copyBtn.textContent = "Копіювати";
            }, 2000);
          }
        }
      );
    });

    document
      .getElementById("closeTestUrlModal")
      .addEventListener("click", () => {
        document.getElementById("testUrlModal").style.display = "none";
      });
  }

  document.getElementById("testUrlInput").value = url;
  document.getElementById("testUrlModal").style.display = "block";
}

function showSharePopup(testUrl) {
  copyToClipboard(testUrl).then(() => {
    const popup = document.createElement("div");
    popup.className = "share-popup";
    popup.innerHTML = `
      <div class="share-popup-content">
        <p id="share-popup-text">Копіювати посилання на результати тесту</p>
        <div class="share-url-container">
          <input type="text" readonly value="${testUrl}">
          <button class="copy-btn">Копіювати</button>
        </div>
        <button class="close-btn">✕</button>
      </div>
    `;

    document.body.appendChild(popup);

    const closeBtn = popup.querySelector(".close-btn");
    const copyBtn = popup.querySelector(".copy-btn");
    const sharePopupText = popup.querySelector("#share-popup-text");
    const urlInput = popup.querySelector("input");

    closeBtn.addEventListener("click", () => {
      popup.remove();
    });

    copyBtn.addEventListener("click", () => {
      copyToClipboard(urlInput.value).then((success) => {
        if (success) {
          sharePopupText.textContent = "Посилання скопійовано!";
          copyBtn.textContent = "Скопійовано ✓";
        }
      });
    });

    setTimeout(() => {
      if (document.body.contains(popup)) {
        popup.remove();
      }
    }, 10000);
  });
}

// Move the floating buttons creation to a function
function createFloatingButtons() {
  const floatingButtons = document.createElement("div");
  floatingButtons.className = "floating-buttons";
  floatingButtons.innerHTML = `
    <button class="toggle-results-btn">
      <img src="/assets/results.svg" alt="Toggle Results">
    </button>
    <button class="share-btn">
      <img src="/assets/share.svg" alt="Share">
    </button>
  `;

  document.body.appendChild(floatingButtons);

  const shareBtn = floatingButtons.querySelector(".share-btn");
  const toggleResultsBtn = floatingButtons.querySelector(".toggle-results-btn");

  shareBtn.addEventListener("click", () => {
    const testUrl = `${window.location.origin}/test_results/?uuid=${test_uuid}&course=${course}`;
    showSharePopup(testUrl);
  });

  toggleResultsBtn.addEventListener("click", () => {
    const testResult = document.getElementById("test_result");
    if (testResult) {
      testResult.classList.toggle("display-none");
    }
  });
}

function compareTestIds(id1, id2) {
  // Split test IDs by hyphen if they contain one
  const parts1 = id1.toString().split("-").map(Number);
  const parts2 = id2.toString().split("-").map(Number);

  // Compare first numbers
  if (parts1[0] !== parts2[0]) {
    return parts1[0] - parts2[0];
  }

  // If first numbers are equal and one has a second number, compare those
  if (parts1.length > 1 && parts2.length > 1) {
    return parts1[1] - parts2[1];
  }

  // If one has a second number and other doesn't, the one without goes first
  return parts1.length - parts2.length;
}

function startSummaryTest(final_tema_amount) {
  currentTest.id = test_id;
  currentTest.test_type = test_type;
  currentTest.block_id = block_id;
  document.getElementById("test_name").innerHTML = "Загальний тест по курсу";
  document.getElementById("result-test_name").innerHTML =
    "Загальний тест по курсу";

  // Set fixed lengths for summary test
  questions_length = questions.length;
  vidpovidnist_length = vidpovidnist_questions.length;
  hronology_length = hronology_questions.length;
  mul_ans_length = mul_ans_questions.length;
  questionCount = final_tema_amount;

  startingMinutes = questionCount;
  currentTest.startingMinutes = startingMinutes;
  time = startingMinutes * 60;
  startTime = time;
  timerInterval = setInterval(updateCountdown, 1000);

  let temp_questions = [];
  let temp_vidpovidnist = [];
  let temp_hronology = [];
  let temp_mul_ans = [];
  test_uuid = Math.random().toString(36).substring(2, 10);

  questions.forEach((q) => {
    q.q_type = "abcd";
  });
  vidpovidnist_questions.forEach((q) => {
    q.q_type = "vidp";
  });
  hronology_questions.forEach((q) => {
    q.q_type = "hron";
  });
  mul_ans_questions.forEach((q) => {
    q.q_type = "mul_ans";
  });

  // Track used test_ids
  let used_test_ids = {
    abcd: new Set(), // For summary test, we want only one question per test_id
    vidp: new Set(),
    hron: new Set(),
    mul_ans: new Set(),
  };

  // Helper function to get random questions while ensuring we get the exact count needed
  const getRandomQuestions = (sourceQuestions, count, usedIds, type) => {
    let result = [];
    let availableQuestions = [...sourceQuestions]; // Create a copy to work with

    while (result.length < count && availableQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];

      if (!usedIds.has(question.test_id)) {
        result.push(question);
        usedIds.add(question.test_id);
        availableQuestions.splice(randomIndex, 1);
      } else {
        // If we've used this test_id, remove the question from available pool
        availableQuestions.splice(randomIndex, 1);
      }
    }

    // If we still need more questions and have used all unique test_ids,
    // start reusing test_ids to meet the required count
    if (result.length < count) {
      availableQuestions = sourceQuestions.filter((q) => !result.includes(q));
      while (result.length < count && availableQuestions.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * availableQuestions.length
        );
        result.push(availableQuestions[randomIndex]);
        availableQuestions.splice(randomIndex, 1);
      }
    }

    return result;
  };

  // Get exactly 23 test questions
  temp_questions = getRandomQuestions(
    questions,
    questions_length,
    used_test_ids.abcd,
    "abcd"
  );

  // Get exactly 3 vidpovidnist questions
  temp_vidpovidnist = getRandomQuestions(
    vidpovidnist_questions,
    vidpovidnist_length,
    used_test_ids.vidp,
    "vidp"
  );

  // Get exactly 3 hronology questions
  temp_hronology = getRandomQuestions(
    hronology_questions,
    hronology_length,
    used_test_ids.hron,
    "hron"
  );

  // Get exactly 3 multiple answer questions
  temp_mul_ans = getRandomQuestions(
    mul_ans_questions,
    mul_ans_length,
    used_test_ids.mul_ans,
    "mul_ans"
  );

  // Sort and combine all questions
  test_questions.push(
    ...temp_questions
      .sort((p1, p2) => {
        if (p1.year !== p2.year) {
          return p1.year - p2.year;
        }
      })
      .sort((p1, p2) => {
        return compareTestIds(p1.test_id, p2.test_id);
      }),
    ...temp_vidpovidnist.sort((p1, p2) => {
      return compareTestIds(p1.test_id, p2.test_id);
    }),
    ...temp_hronology.sort((p1, p2) => {
      return compareTestIds(p1.test_id, p2.test_id);
    }),
    ...temp_mul_ans.sort((p1, p2) => {
      return compareTestIds(p1.test_id, p2.test_id);
    })
  );
}
