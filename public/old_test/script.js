const questionNumber = document.getElementById("questionNumber");
const topLine = document.getElementById("top_line");
const middleLines = document.getElementById("middle_lines");
const bottomLine = document.getElementById("bottom_line");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");
const block_answers = document.getElementById("block_answers");
const ansSheetBtns = document.getElementById("ansSheetBtns");
const numeric_answers = document.getElementById("text_fields");

var queryString = window.location.search;
var params = new URLSearchParams(queryString);
var test_id = params.get("id");
var block_id = params.get("block");
var test_type = params.get("test_type");

let test_name;
let first_test_id = 0;
let last_test_id = 0;
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
    loadTestDataFromServer(
      getCookie("login"),
      getCookie("password"),
      block_id,
      test_id,
      test_id
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
  case "full":
    loadTestDataFromServer(
      getCookie("login"),
      getCookie("password"),
      block_id,
      test_id,
      test_id
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
  case "final":
    switch (block_id) {
      case "1":
        test_name = "<i>Підсумковий тест по блоку 1</i>";
        first_test_id = 1;
        last_test_id = 6;
        break;
      case "2":
        test_name = "<i>Підсумковий тест по блоку 2</i>";
        first_test_id = 6;
        last_test_id = 12;
        break;
      case "3":
        test_name = "<i>Підсумковий тест по блоку 3</i>";
        first_test_id = 12;
        last_test_id = 20;
        break;
      case "4":
        test_name = "<i>Підсумковий тест по блоку 4</i>";
        first_test_id = 20;
        last_test_id = 25;
        break;
      case "5":
        test_name = "<i>Підсумковий тест по блоку 5</i>";
        break;
      default:
        test_name = "Назва тесту";
    }
    loadTestDataFromServer(
      getCookie("login"),
      getCookie("password"),
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
  switch (test_id) {
    case "6":
      test_name = "<i>Українські землі в другій половині XVI ст.</i>";
      break;
    case "7":
      test_name = "<i>Українські землі в першій половині XVII ст.</i>";
      break;
    case "8":
      test_name =
        "<i>Національно-визвольна війна Українського народу середини XVII ст.</i>";
      break;
    case "9":
      test_name = "<i>Козацька Україна наприкінці 50 – 80-х років XVII ст.</i>";
      break;
    case "10":
      test_name =
        "<i>Українські землі наприкінці XVII – в першій половині XVIII ст.</i>";
      break;
    case "11":
      test_name = "<i>Українські землі в другій половині XVIII ст.</i>";
      break;
    case "12":
      test_name =
        "<i>Українські землі у складі російської імперії наприкінці XVIII – в першій половині XIX ст.</i>";
      break;
    case "13":
      test_name =
        "<i>Українські землі у складі Австрійської імперії наприкінці XVIII – в першій половині XIX ст.</i>";
      break;
    case "14":
      test_name =
        "<i>Культура України наприкінці XVIII – в першій половині XIX ст.</i>";
      break;
    case "15":
      test_name =
        "<i>Українські землі в складі російської імперії в другій половині ХІХ ст.</i>";
      break;
    case "16":
      test_name =
        "<i>Українські землі в складі Австрійської імперії в другій половині ХІХ ст.</i>";
      break;
    case "17":
      test_name =
        "<i>Культура України в другій половині ХІХ ст. – на початку XX ст.</i>";
      break;
    case "18":
      test_name =
        "<i>Українські землі у складі російської імперії в 1900-1914-х роках</i>";
      break;
    case "19":
      test_name =
        "<i>Українські землі у складі Австро-Угорщини в 1900-1914-х роках</i>";
      break;
    default:
      test_name = "Назва тесту";
  }
  document.getElementById("testTitle").innerHTML =
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

  showQuestion(0);
}
function startFinalTest() {
  switch (block_id) {
    case "1":
      test_name = "<i>Підсумковий тест по блоку 1</i>";
      first_test_id = 1;
      last_test_id = 6;
      break;
    case "2":
      test_name = "<i>Підсумковий тест по блоку 2</i>";
      first_test_id = 6;
      last_test_id = 12;
      break;
    case "3":
      test_name = "<i>Підсумковий тест по блоку 3</i>";
      first_test_id = 12;
      last_test_id = 20;
      break;
    case "4":
      test_name = "<i>Підсумковий тест по блоку 4</i>";
      first_test_id = 20;
      last_test_id = 25;
      break;
    case "5":
      test_name = "<i>Підсумковий тест по блоку 5</i>";
      break;
    default:
      test_name = "Назва тесту";
  }
  document.getElementById("testTitle").innerHTML = test_name;
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
  showQuestion(0);
}
function startFullTest() {
  switch (test_id) {
    case "6":
      test_name = "<i>Українські землі в другій половині XVI ст.</i>";
      break;
    case "7":
      test_name = "<i>Українські землі в першій половині XVII ст.</i>";
      break;
    case "8":
      test_name =
        "<i>Національно-визвольна війна Українського народу середини XVII ст.</i>";
      break;
    case "9":
      test_name = "<i>Козацька Україна наприкінці 50 – 80-х років XVII ст.</i>";
      break;
    case "10":
      test_name =
        "<i>Українські землі наприкінці XVII – в першій половині XVIII ст.</i>";
      break;
    case "11":
      test_name = "<i>Українські землі в другій половині XVIII ст.</i>";
      break;
    case "12":
      test_name =
        "<i>Українські землі у складі російської імперії наприкінці XVIII – в першій половині XIX ст.</i>";
      break;
    case "13":
      test_name =
        "<i>Українські землі у складі Австрійської імперії наприкінці XVIII – в першій половині XIX ст.</i>";
      break;
    case "14":
      test_name =
        "<i>Культура України наприкінці XVIII – в першій половині XIX ст.</i>";
      break;
    case "15":
      test_name =
        "<i>Українські землі в складі російської імперії в другій половині ХІХ ст.</i>";
      break;
    case "16":
      test_name =
        "<i>Українські землі в складі Австрійської імперії в другій половині ХІХ ст.</i>";
      break;
    case "17":
      test_name =
        "<i>Культура України в другій половині ХІХ ст. – на початку XX ст.</i>";
      break;
    case "18":
      test_name =
        "<i>Українські землі у складі російської імперії в 1900-1914-х роках</i>";
      break;
    case "19":
      test_name =
        "<i>Українські землі у складі Австро-Угорщини в 1900-1914-х роках</i>";
      break;
    default:
      test_name = "Назва тесту";
  }
  document.getElementById("testTitle").innerHTML =
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
  showQuestion();
}

function prepareTest() {
  test_completed = false;
  currentQuestionIndex = 0;
  nextButton.innerHTML = "Завершити тест";
  document.getElementById("read-explanation-btn").classList.remove("hidden");
  numeric_answers.classList.add("hidden");
  // block_answers.classList.add("hidden");
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
    btn.classList.add("q_id");
    btn.id = "q" + i;
    btn.innerHTML = i;
    block_answers.appendChild(btn);
  }
  Array.from(block_answers.children).forEach((item) => {
    item.addEventListener("click", () => {
      currentQuestionIndex = item.innerHTML - 1;
      showQuestion();
    });
  });
}
async function loadTestDataFromServer(
  login,
  password,
  block,
  firstTest,
  lastTest
) {
  try {
    const response = await fetch(
      `/loadTestData?login=${login}&password=${password}&block=${block}&firstTest=${firstTest}&lastTest=${lastTest}`
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

Array.from(ansSheetBtns.children).forEach((button) => {
  if (button.classList.contains("sheet-btn")) {
    button.addEventListener("click", selectAnswer);
  }
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
        "rgb(223, 217, 146)";
    }
    if (time < startTime / 4) {
      document.getElementById("timer_line").style.background =
        "rgb(178, 93, 93)";
    }
    document.getElementById("timer_line").style.width =
      (time / (startingMinutes * 60)) * 100 + "%";
    document.getElementById("timer-gif").style.left =
      "calc(" + (time / (startingMinutes * 60)) * 100 + "% - 16px)";

    var today = new Date();
    let day = today.getDate();
    day = day < 10 ? "0" + day : day;
    let month = today.getMonth() + 1;
    month = month < 10 ? "0" + month : month;
    var date = day + "/" + month + "/" + today.getFullYear();
    var time_str =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + " " + time_str;
    document.getElementById("date").innerHTML = dateTime;
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
  document.getElementById("q_img").classList.add("hidden");
  document.getElementById("read-explanation-btn").classList.add("hidden");
  document.getElementById("app__question-bar").classList.add("hidden");
  Array.from(document.getElementsByClassName("question__answer-text")).forEach(
    (field) => {
      if (field.innerHTML == "" || field.innerHTML == "undefined") {
        field.parentElement.classList.add("hidden");
      }
    }
  );
  clearInterval(timerInterval);
  score = 100;
  let q_points = 100 / test_questions.length;
  test_questions.forEach((q) => {
    if (!q.isCorrect) {
      score = score - q_points;
    }
  });
  sendTestResult();

  nextButton.innerHTML = "Пройти знову";
  document.getElementById("bottom-buttons").classList.remove("hidden");
  test_completed = true;
  // block_answers.classList.remove("hidden");
  currentQuestionIndex = 0;
  showQuestion();
}

function sendTestResult() {
  let testData = {
    date: Math.round(Date.now() / 1000),
    time: startingMinutes * 60 - time,
    block: block_id,
    test: test_id,
    score: Math.ceil(score),
    login: getCookie("login"),
    password: getCookie("password"),
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
      if (currentQuestion.correct == currentQuestion.selected) {
        q_id.classList.add("correct");
        currentQuestion.isCorrect = true;
      } else {
        q_id.classList.add("incorrect");
        currentQuestion.isCorrect = false;
      }
      q_id.classList.add("answered_q_id");
    }
  }
}
function resetState() {
  middleLines.innerHTML = "";
  document.getElementById("app__question-bar").classList.remove("hidden");
  document.getElementById("q_img").classList.add("hidden");
  document.getElementById("image-loader").classList.remove("hidden");
  document.getElementById("answer_sheet").classList.add("hidden");
  if (!test_completed) {
    document.getElementById("bottom-buttons").classList.add("hidden");
    nextButton.classList.add("hidden");
  }
  if (currentQuestionIndex == 0) {
    document.getElementById("back_arrow").classList.add("hidden");
  } else {
    document.getElementById("back_arrow").classList.remove("hidden");
  }
  if (currentQuestionIndex == questionCount - 1) {
    document.getElementById("next_arrow").classList.add("hidden");
  } else {
    document.getElementById("next_arrow").classList.remove("hidden");
  }
  numeric_answers.classList.add("hidden");
  inputAnswerQuestion = false;
  Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
    (element) => {
      element.classList.add("blurred");
    }
  );
  Array.from(document.getElementsByClassName("question__answer")).forEach(
    (field) => {
      field.classList.remove("hidden");
    }
  );
  Array.from(document.getElementsByClassName("zoomed")).forEach((el) => {
    el.classList.remove("zoomed");
  });
  Array.from(ansSheetBtns.children).forEach((button) => {
    if (button.classList.contains("selected")) {
      button.classList.remove("selected");
    }
  });
  Array.from(document.getElementsByClassName("sheet-btn")).forEach((button) => {
    button.classList.remove("incorrect");
    button.classList.remove("correct");
  });
  Array.from(document.getElementsByClassName("question__answer-text")).forEach(
    (field) => {
      field.classList.remove("incorrect");
      field.classList.remove("correct");
    }
  );
  for (i = 1; i < 4; i++) {
    let answer_field = document.getElementById("text_input" + i);
    answer_field.value = "";
    answer_field.classList.remove("correct");
    answer_field.classList.remove("incorrect");
    answer_field.disabled = false;
  }
  document.getElementById("bottom-buttons").classList.add("hidden");
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
        const imageUrl = `/getImage?blockId=${blockId}&testId=${testId}&imageId=${imageId}&t=${new Date().getTime()}`;

        const questionImageElement = document.getElementById("question_image");
        if (questionImageElement) {
          questionImageElement.src = imageUrl;
          questionImageElement.onload = function () {
            document.getElementById("image-loader").classList.add("hidden");
            Array.from(
              document.getElementsByClassName("__can_be_blurred")
            ).forEach((element) => {
              element.classList.remove("blurred");
            });
            document.getElementById("q_img").classList.remove("hidden");
          };
          questionImageElement.onerror = function () {
            document.getElementById("question_image").src = "";
            document.getElementById("q_img").classList.add("hidden");
            document.getElementById("image-loader").classList.add("hidden");
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
        document.getElementById("q_img").classList.add("hidden");
        document.getElementById("image-loader").classList.add("hidden");
        Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
          (element) => {
            element.classList.remove("blurred");
          }
        );
      }
    }
  };
  xhr.open(
    "GET",
    `/getImage?blockId=${blockId}&testId=${testId}&imageId=${imageId}`,
    true
  );
  xhr.send();
}

function showQuestion() {
  resetState();
  let currentQuestion = test_questions[currentQuestionIndex];
  displayedQuestion = currentQuestion;
  let questionNo = currentQuestionIndex + 1;
  questionNumber.innerHTML = "Питання №" + questionNo;
  topLine.innerHTML = currentQuestion.top_question;
  if (currentQuestion.middle_rows != null) {
    currentQuestion.middle_rows.forEach((row) => {
      const mid_row = document.createElement("div");
      mid_row.innerHTML = row;
      if (mid_row.innerHTML.length < 1) {
        mid_row.classList.add("space-filler__10px");
      }
      mid_row.classList.add("quiz-element");
      mid_row.classList.add("question__middle-line");
      middleLines.appendChild(mid_row);
    });
  } else {
    middleLines.innerHTML = "";
  }
  bottomLine.classList.remove("hidden");
  bottomLine.innerHTML = currentQuestion.bottom_question;
  if (bottomLine.innerHTML.length < 1) {
    bottomLine.classList.add("hidden");
  }
  document.getElementById("image-loader").classList.remove("hidden");
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
    Array.from(document.getElementsByClassName("vidpovidnist-field")).forEach(
      (line) => {
        line.classList.add("hidden");
      }
    );
    currentQuestion.answers.forEach((answer) => {
      const button = document.createElement("div");
      button.innerHTML = answer.text;
      button.classList.add("btn");
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
          button.style.opacity = 0;
        }
      }
      button.addEventListener("click", selectAnswer);
    });
  } else {
    document.getElementById("bottom-buttons").classList.remove("hidden");
    if (
      currentQuestionIndex > questions_length - 1 &&
      currentQuestionIndex < questions_length + vidpovidnist_length
    ) {
      document.getElementById("answer_sheet").classList.remove("hidden");
      ansSheetBtns.style.gridTemplateColumns = "repeat(6, 1fr)";
      document.getElementById("f1").innerHTML = currentQuestion.f1;
      document.getElementById("f2").innerHTML = currentQuestion.f2;
      document.getElementById("f3").innerHTML = currentQuestion.f3;
      document.getElementById("f4").innerHTML = currentQuestion.f4;
      document.getElementById("f5").innerHTML = currentQuestion.f5;
      Array.from(ansSheetBtns.children).forEach((button) => {
        if (button.id.endsWith("5")) {
          button.classList.remove("hidden");
        }
        if (test_completed) {
          let str_char = 0;
          if (button.id.startsWith("a")) {
            str_char = 0;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("incorrect");
            }
            if (button.innerHTML == currentQuestion.correct[str_char]) {
              button.classList.add("correct");
            }
          } else if (button.id.startsWith("b")) {
            str_char = 1;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("incorrect");
            }
            if (button.innerHTML == currentQuestion.correct[str_char]) {
              button.classList.add("correct");
            }
          } else if (button.id.startsWith("c")) {
            str_char = 2;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("incorrect");
            }
            if (button.innerHTML == currentQuestion.correct[str_char]) {
              button.classList.add("correct");
            }
          } else if (button.id.startsWith("d")) {
            str_char = 3;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("incorrect");
            }
            if (button.innerHTML == currentQuestion.correct[str_char]) {
              button.classList.add("correct");
            }
          }
        } else {
          let str_char = 0;
          if (button.id.startsWith("a")) {
            str_char = 0;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("selected");
            }
          } else if (button.id.startsWith("b")) {
            str_char = 1;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("selected");
            }
          } else if (button.id.startsWith("c")) {
            str_char = 2;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("selected");
            }
          } else if (button.id.startsWith("d")) {
            str_char = 3;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
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
      document.getElementById("answer_sheet").classList.remove("hidden");
      ansSheetBtns.style.gridTemplateColumns = "repeat(5, 1fr)";
      Array.from(ansSheetBtns.children).forEach((button) => {
        if (button.id.endsWith("5")) {
          button.classList.add("hidden");
        }
        if (test_completed) {
          let str_char = 0;
          if (button.id.startsWith("a")) {
            str_char = 0;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("incorrect");
            }
            if (button.innerHTML == currentQuestion.correct[str_char]) {
              button.classList.add("correct");
            }
          } else if (button.id.startsWith("b")) {
            str_char = 1;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("incorrect");
            }
            if (button.innerHTML == currentQuestion.correct[str_char]) {
              button.classList.add("correct");
            }
          } else if (button.id.startsWith("c")) {
            str_char = 2;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("incorrect");
            }
            if (button.innerHTML == currentQuestion.correct[str_char]) {
              button.classList.add("correct");
            }
          } else if (button.id.startsWith("d")) {
            str_char = 3;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("incorrect");
            }
            if (button.innerHTML == currentQuestion.correct[str_char]) {
              button.classList.add("correct");
            }
          }
        } else {
          let str_char = 0;
          if (button.id.startsWith("a")) {
            str_char = 0;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("selected");
            }
          } else if (button.id.startsWith("b")) {
            str_char = 1;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("selected");
            }
          } else if (button.id.startsWith("c")) {
            str_char = 2;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
              button.classList.add("selected");
            }
          } else if (button.id.startsWith("d")) {
            str_char = 3;
            if (button.innerHTML == currentQuestion.selected[str_char]) {
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
      numeric_answers.classList.remove("hidden");
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
          for (l = 0; l < 3; l++) {
            if (currentQuestion.selected[l] == j) {
              document.getElementById("f" + j).classList.add("incorrect");
            }
            if (currentQuestion.correct[l] == j) {
              document.getElementById("f" + j).classList.add("correct");
            }
          }
        }
      }
    }
    if (currentQuestionIndex == questionCount - 1 && !test_completed) {
      nextButton.classList.remove("hidden");
    }
  }
  Array.from(document.getElementsByClassName("question__answer-text")).forEach(
    (field) => {
      if (field.innerHTML == "" || field.innerHTML == "undefined") {
        field.parentElement.classList.add("hidden");
      }
    }
  );
  document.getElementById("q_info").innerHTML = currentQuestion.question;
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
      q_id.classList.add("answered_q_id");
      currentQuestion.selected = selectedBtn.innerHTML;
      document.getElementById("bottom-buttons").classList.remove("hidden");
    }
    if (
      currentQuestionIndex >= questions_length &&
      currentQuestionIndex <
        questions_length +
          vidpovidnist_length +
          hronology_length +
          mul_ans_length
    ) {
      chosen_answers_from_sheet = "";
      selectedBtn.classList.add("selected");

      let row1selected = [];
      let row2selected = [];
      let row3selected = [];
      let row4selected = [];

      Array.from(ansSheetBtns.children).forEach((button) => {
        if (
          button.id.startsWith("a") &&
          button.classList.contains("selected")
        ) {
          row1selected.push(button);
        } else if (
          button.id.startsWith("b") &&
          button.classList.contains("selected")
        ) {
          row2selected.push(button);
        } else if (
          button.id.startsWith("c") &&
          button.classList.contains("selected")
        ) {
          row3selected.push(button);
        } else if (
          button.id.startsWith("d") &&
          button.classList.contains("selected")
        ) {
          row4selected.push(button);
        }
      });
      if (row1selected.length > 1) {
        row1selected.forEach((rowBtn) => {
          if (rowBtn != selectedBtn) {
            rowBtn.classList.remove("selected");
            removeFromArray(row1selected, rowBtn);
          }
        });
      }
      if (row2selected.length > 1) {
        row2selected.forEach((rowBtn) => {
          if (rowBtn != selectedBtn) {
            rowBtn.classList.remove("selected");
            removeFromArray(row2selected, rowBtn);
          }
        });
      }
      if (row3selected.length > 1) {
        row3selected.forEach((rowBtn) => {
          if (rowBtn != selectedBtn) {
            rowBtn.classList.remove("selected");
            removeFromArray(row3selected, rowBtn);
          }
        });
      }
      if (row4selected.length > 1) {
        row4selected.forEach((rowBtn) => {
          if (rowBtn != selectedBtn) {
            rowBtn.classList.remove("selected");
            removeFromArray(row4selected, rowBtn);
          }
        });
      }

      Array.from(ansSheetBtns.children).forEach((button) => {
        if (button.classList.contains("selected")) {
          chosen_answers_from_sheet += button.innerHTML;
        }
      });
      currentQuestion.selected = chosen_answers_from_sheet;
      if (chosen_answers_from_sheet == currentQuestion.correct) {
        q_id.classList.add("correct");
        currentQuestion.isCorrect = true;
      } else {
        q_id.classList.add("incorrect");
        currentQuestion.isCorrect = false;
      }
      q_id.classList.add("answered_q_id");
    }
    test_questions[currentQuestionIndex] = currentQuestion;
  }
}
function handleNextButton() {
  saveNumAnswer();
  currentQuestionIndex++;
  if (!test_completed) {
    if (currentQuestionIndex < questionCount) {
      showQuestion();
    } else {
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
          "Знайдено питання без відповіді:" + non_answered;
        document.getElementById("alert_window").classList.remove("hidden");
      } else {
        showScore();
      }
    }
  }
}
document.getElementById("alert_close_btn").addEventListener("click", () => {
  document.getElementById("alert_text").innerHTML = "";
  document.getElementById("alert_window").classList.add("hidden");
});

nextButton.addEventListener("click", () => {
  if (!testIsPaused && test_completed) {
    location.reload();
  } else if (!testIsPaused) {
    handleNextButton();
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
      document.getElementById("pause_btn_img").src = "/assets/resume.png";
      Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
        (element) => {
          element.classList.add("blurred");
        }
      );
    } else {
      testIsPaused = false;
      document.getElementById("pause_btn_img").src = "/assets/pause.webp";
      Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
        (element) => {
          element.classList.remove("blurred");
        }
      );
    }
  }
}
document.getElementById("pause_btn").addEventListener("click", () => {
  pauseTest();
});
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
document.getElementById("q_img").addEventListener("click", zoomImg);
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
  document.getElementById("fsic").classList.toggle("hidden");
}
