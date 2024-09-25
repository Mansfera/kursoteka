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

var queryString = window.location.search;
var params = new URLSearchParams(queryString);
var test_id = params.get("id");
var block_id = params.get("block");
var test_type = params.get("test_type");
var course = params.get("course");

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
switch (test_type) {
  case "short":
  case "full":
    test_name = params.get("test_name");
    loadTestDataFromServer(auth_key, course, block_id, test_id, test_id)
      .then((testData) => {
        if (testData) {
          questions = testData.questions;
          vidpovidnist_questions = testData.vidpovidnistQuestions;
          hronology_questions = testData.hronologyQuestions;
          mul_ans_questions = testData.mulAnsQuestions;
          prepareTest();
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
      last_test_id
    )
      .then((testData) => {
        if (testData) {
          questions = testData.questions;
          vidpovidnist_questions = testData.vidpovidnistQuestions;
          hronology_questions = testData.hronologyQuestions;
          mul_ans_questions = testData.mulAnsQuestions;
          prepareTest();
        } else {
          console.error("Failed to load test data");
        }
      })
      .catch((error) => {
        console.error("Error loading test data:", error);
      });
    break;
}

function startShortTest() {
  document.getElementById("test_name").innerHTML =
    "Тема " + test_id + " " + test_name;

  questions_length = 12;
  vidpovidnist_length = 1;
  hronology_length = 1;
  mul_ans_length = 1;
  questionCount =
    questions_length + vidpovidnist_length + hronology_length + mul_ans_length;
  startingMinutes = questionCount;
  time = startingMinutes * 60;
  startTime = time;
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
function startFinalTest() {
  document.getElementById("test_name").innerHTML = test_name;
  questions_length = (last_test_id - first_test_id) * 3;
  vidpovidnist_length = (last_test_id - first_test_id) * 1;
  hronology_length = (last_test_id - first_test_id) * 1;
  mul_ans_length = (last_test_id - first_test_id) * 1;
  questionCount =
    questions_length + vidpovidnist_length + hronology_length + mul_ans_length;
  startingMinutes = questionCount;
  time = startingMinutes * 60;
  startTime = time;
  timerInterval = setInterval(updateCountdown, 1000);
  let temp_questions = [];
  let temp_vidpovidnist = [];
  let temp_hronology = [];
  let temp_mul_ans = [];

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
    if (i < (last_test_id - first_test_id) * 3) {
      let randomQuestionIndex = Math.floor(Math.random() * questions.length);
      currentQuestion = questions[randomQuestionIndex];
      while (temp_questions.includes(currentQuestion)) {
        randomQuestionIndex = Math.floor(Math.random() * questions.length);
        currentQuestion = questions[randomQuestionIndex];
      }
      temp_questions.push(currentQuestion);
    } else if (
      i > (last_test_id - first_test_id) * 3 - 1 &&
      i < (last_test_id - first_test_id) * 4
    ) {
      test_questions.sort((p1, p2) =>
        p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
      );
      let randomQuestionIndex = Math.floor(
        Math.random() * vidpovidnist_questions.length
      );
      currentQuestion = vidpovidnist_questions[randomQuestionIndex];
      while (temp_vidpovidnist.includes(currentQuestion)) {
        randomQuestionIndex = Math.floor(
          Math.random() * vidpovidnist_questions.length
        );
        currentQuestion = vidpovidnist_questions[randomQuestionIndex];
      }
      temp_vidpovidnist.push(currentQuestion);
    } else if (
      i > (last_test_id - first_test_id) * 4 - 1 &&
      i < (last_test_id - first_test_id) * 5
    ) {
      let randomQuestionIndex = Math.floor(
        Math.random() * hronology_questions.length
      );
      currentQuestion = hronology_questions[randomQuestionIndex];
      while (temp_hronology.includes(currentQuestion)) {
        randomQuestionIndex = Math.floor(
          Math.random() * hronology_questions.length
        );
        currentQuestion = hronology_questions[randomQuestionIndex];
      }
      temp_hronology.push(currentQuestion);
    } else if (
      i > (last_test_id - first_test_id) * 5 - 1 &&
      i < (last_test_id - first_test_id) * 6
    ) {
      let randomQuestionIndex = Math.floor(
        Math.random() * mul_ans_questions.length
      );
      currentQuestion = mul_ans_questions[randomQuestionIndex];
      while (temp_mul_ans.includes(currentQuestion)) {
        randomQuestionIndex = Math.floor(
          Math.random() * mul_ans_questions.length
        );
        currentQuestion = mul_ans_questions[randomQuestionIndex];
      }
      temp_mul_ans.push(currentQuestion);
    }
  }
  test_questions.push(
    ...temp_questions.sort((p1, p2) =>
      p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
    ),
    ...temp_vidpovidnist,
    ...temp_hronology,
    ...temp_mul_ans.sort((p1, p2) =>
      p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
    )
  );
}
function startFullTest() {
  document.getElementById("test_name").innerHTML =
    "Тема " + test_id + " " + test_name;

  questions_length = questions.length;
  vidpovidnist_length = vidpovidnist_questions.length;
  hronology_length = hronology_questions.length;
  mul_ans_length = mul_ans_questions.length;
  questionCount =
    questions_length + vidpovidnist_length + hronology_length + mul_ans_length;
  startingMinutes = questionCount;
  time = startingMinutes * 60;
  startTime = time;
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

  let temp_1 = [];
  test_questions = temp_1
    .concat(
      questions.sort((p1, p2) =>
        p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
      )
    )
    .concat(vidpovidnist_questions)
    .concat(hronology_questions)
    .concat(
      mul_ans_questions.sort((p1, p2) =>
        p1.year > p2.year ? 1 : p1.year < p2.year ? -1 : 0
      )
    );
}

function prepareTest() {
  test_completed = false;
  currentQuestionIndex = 0;
  finishTestButton.innerHTML = "Завершити тест";
  document
    .getElementById("read-explanation-btn")
    .classList.remove("display-none");
  numeric_answers.classList.add("display-none");
  block_answers.innerHTML = "";
  switch (test_type) {
    case "short":
      startShortTest();
      break;
    case "full":
      startFullTest();
      break;
    case "final":
      startFinalTest();
      break;
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
    item.addEventListener("click", () => {
      if (!testIsPaused) {
        saveNumAnswer();
        currentQuestionIndex = item.innerHTML - 1;
        showQuestion();
      }
    });
  });
  showQuestion();
}
async function loadTestDataFromServer(
  auth_key,
  course,
  block,
  firstTest,
  lastTest
) {
  try {
    const response = await fetch(
      `/loadTestData?auth_key=${auth_key}&course=${course}&block=${block}&firstTest=${firstTest}&lastTest=${lastTest}`
    );
    if (!response.ok) {
      throw new Error(`Failed to load test data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

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
function shuffle(array) {
  // Create a copy of the original array to avoid modifying it directly
  const shuffledArray = array.slice();

  // Loop through the array starting from the end
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    // Generate a random index between 0 and i
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // Swap the elements at randomIndex and i
    [shuffledArray[i], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[i],
    ];
  }

  return shuffledArray;
}
function showScore() {
  topLine.innerHTML = "";
  middleLines.innerHTML = "";
  bottomLine.innerHTML = "";
  document.getElementById("question_image").src = "";
  document.getElementById("q_img").classList.add("display-none");
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
    }
  });
  sendTestResult();

  finishTestButton.innerHTML = "Пройти знову";
  test_completed = true;
  currentQuestionIndex = 0;
  showQuestion();
}

function sendTestResult() {
  let _test_id;
  if (test_type == "final") {
    _test_id = last_test_id;
  } else {
    _test_id = test_id;
  }
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
  let testData = {
    date: Date.now(),
    time: startingMinutes * 60 - time,
    test_type,
    block: block_id,
    test: _test_id,
    score: Math.ceil(score),
    auth_key,
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
  fetch("/sendTestResult", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(testData),
  })
    .then((response) => {
      switch (response.status) {
        case 200:
          console.log(testData);
          break;
        case 403:
          console.log("Нашо в консоль було лізти?");
          break;
        default:
      }
      response.json();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function readExplanation() {
  let explanation = "Тут мало бути пояснення, але його немає...";
  if (test_questions[currentQuestionIndex].comment != "") {
    explanation = test_questions[currentQuestionIndex].comment;
  }
  alert(explanation);
}

document
  .getElementById("read-explanation-btn")
  .addEventListener("click", () => {
    readExplanation();
  });

function resetState() {
  Array.from(document.getElementsByClassName("block_answers-item")).forEach(
    (q_id) => {
      q_id.classList.remove("selected");
    }
  );
  middleLines.innerHTML = "";
  document.getElementById("q_img").classList.add("display-none");
  // document.getElementById("image-loader").classList.remove("display-none");
  ansSheetBtns.classList.add("display-none");
  // if (!test_completed) {
  //   nextButton.classList.add("display-none");
  // }
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
}

function removeFromArray(array, element) {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
  }
}

function checkIfImageExists(blockId, testId, imageId) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        // Construct the image URL with a cache buster
        const imageUrl = `/getImage?auth_key=${auth_key}&course=${course}&blockId=${blockId}&testId=${testId}&imageId=${imageId}&t=${new Date().getTime()}`;

        const questionImageElement = document.getElementById("question_image");
        if (questionImageElement) {
          questionImageElement.src = imageUrl;
          questionImageElement.onload = function () {
            // document
            //   .getElementById("image-loader")
            //   .classList.add("display-none");
            Array.from(
              document.getElementsByClassName("__can_be_blurred")
            ).forEach((element) => {
              element.classList.remove("blurred");
            });
            document.getElementById("q_img").classList.remove("display-none");
          };
          questionImageElement.onerror = function () {
            document.getElementById("question_image").src = "";
            document.getElementById("q_img").classList.add("display-none");
            // document
            //   .getElementById("image-loader")
            //   .classList.add("display-none");
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
        console.error(`Failed to fetch image. Status: ${xhr.status}`);
        document.getElementById("question_image").src = "";
        document.getElementById("q_img").classList.add("display-none");
        // document.getElementById("image-loader").classList.add("display-none");
        Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
          (element) => {
            element.classList.remove("blurred");
          }
        );
      }
    }
  };

  // xhr.timeout = 10000;

  xhr.ontimeout = function () {
    console.error("The request for the image timed out.");
    document.getElementById("question_image").src = "";
    document.getElementById("q_img").classList.add("display-none");
    Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
      (element) => {
        element.classList.remove("blurred");
      }
    );
  };

  xhr.open(
    "GET",
    `/getImage?auth_key=${auth_key}&course=${course}&blockId=${blockId}&testId=${testId}&imageId=${imageId}`,
    true
  );
  xhr.send();
}

function showQuestion() {
  resetState();
  let currentQuestion = test_questions[currentQuestionIndex];
  const q_id = document.getElementById("q" + (currentQuestionIndex + 1));
  q_id.classList.add("selected");
  displayedQuestion = currentQuestion;
  let questionNo = currentQuestionIndex + 1;
  questionNumber.innerHTML = questionNo;
  topLine.innerHTML = currentQuestion.top_question;
  if (currentQuestion.middle_rows != null) {
    currentQuestion.middle_rows.forEach((row) => {
      const mid_row = document.createElement("div");
      mid_row.innerHTML = row;
      mid_row.classList.add("middle_lines-element");
      middleLines.appendChild(mid_row);
    });
  } else {
    middleLines.innerHTML = "";
  }
  bottomLine.classList.remove("display-none");
  bottomLine.innerHTML = currentQuestion.bottom_question;
  if (bottomLine.innerHTML.length < 1) {
    bottomLine.classList.add("display-none");
  }
  // document.getElementById("image-loader").classList.remove("display-none");
  checkIfImageExists(
    block_id,
    currentQuestion.test_id,
    currentQuestion.question
  );
  document.getElementById("af").innerHTML = currentQuestion.af;
  document.getElementById("bf").innerHTML = currentQuestion.bf;
  document.getElementById("cf").innerHTML = currentQuestion.cf;
  document.getElementById("df").innerHTML = currentQuestion.df;

  if (currentQuestionIndex < questions_length) {
    document.getElementById("list_num-fields").classList.add("display-none");
    document
      .getElementById("list_abcd-fields")
      .classList.remove("display-none");
    currentQuestion.answers.forEach((answer) => {
      const button = document.createElement("div");
      button.innerHTML = answer.text;
      button.classList.add("abcd_button");
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
    if (
      currentQuestionIndex > questions_length - 1 &&
      currentQuestionIndex < questions_length + vidpovidnist_length
    ) {
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
            if (button.id[1] == currentQuestion.selected[index]) {
              button.classList.add("yellow-selected");
            }
            if (button.id[1] == currentQuestion.correct[index]) {
              button.classList.add("correct");
            } else {
              if (button.id[1] == currentQuestion.selected[index]) {
                button.classList.add("incorrect");
              }
            }
          } else {
            if (button.id[1] == currentQuestion.selected[index]) {
              button.classList.add("selected");
            }
          }
        }
      });
    } else if (
      currentQuestionIndex > questions_length + vidpovidnist_length - 1 &&
      currentQuestionIndex <
        questions_length + vidpovidnist_length + hronology_length
    ) {
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
              if (button.id[1] == currentQuestion.selected[index]) {
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
          }
        }
      });
    } else if (
      currentQuestionIndex >
        questions_length + vidpovidnist_length + hronology_length - 1 &&
      currentQuestionIndex <
        questions_length +
          vidpovidnist_length +
          hronology_length +
          mul_ans_length
    ) {
      document.getElementById("f1").innerHTML = currentQuestion.f1;
      document.getElementById("f2").innerHTML = currentQuestion.f2;
      document.getElementById("f3").innerHTML = currentQuestion.f3;
      document.getElementById("f4").innerHTML = currentQuestion.f4;
      document.getElementById("f5").innerHTML = currentQuestion.f5;
      document.getElementById("f6").innerHTML = currentQuestion.f6;
      document.getElementById("f7").innerHTML = currentQuestion.f7;
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
            if (
              currentQuestion.correct.includes(currentQuestion.selected[i - 1])
            ) {
              answer_field.classList.add("correct");
            } else {
              answer_field.classList.add("incorrect");
            }
          }
        }
        for (j = 1; j < 8; j++) {
          if (currentQuestion.correct.includes(j)) {
            if (!currentQuestion.selected.includes(j)) {
              document.getElementById("f" + j).classList.add("correct");
            } else {
              document.getElementById("f" + j).classList.add("yellow-selected");
            }
          } else {
            if (currentQuestion.selected.includes(j)) {
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
  document.getElementById("question_id").innerHTML =
    "ID#" + currentQuestion.question;
}

function selectAnswer(e) {
  if (!test_completed && !testIsPaused) {
    const q_id = document.getElementById("q" + (currentQuestionIndex + 1));
    const selectedBtn = e.target;
    let currentQuestion = displayedQuestion;

    if (currentQuestionIndex < questions_length) {
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
    if (
      currentQuestionIndex >= questions_length &&
      currentQuestionIndex <
        questions_length + vidpovidnist_length + hronology_length
    ) {
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
  }
}

function saveNumAnswer() {
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
}
Array.from(numeric_answers.children).forEach((field) => {
  field.addEventListener("input", function () {
    saveNumAnswer();
  });
});
function handleNextButton() {
  if (!test_completed) {
    if (currentQuestionIndex < questionCount) {
      saveNumAnswer();
      currentQuestionIndex++;
      showQuestion();
    }
  }
}
function finishTest() {
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
}
document.getElementById("next_arrow").addEventListener("click", () => {
  if (!testIsPaused) {
    nextQuestionArrow();
  }
});
function previousQuestionArrow() {
  saveNumAnswer();
  currentQuestionIndex--;
  if (currentQuestionIndex >= 0) {
    showQuestion();
  } else {
    currentQuestionIndex++;
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
// document.getElementById("pause_btn").addEventListener("click", () => {
//   pauseTest();
// });
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
