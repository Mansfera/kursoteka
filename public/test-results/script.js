const questionNumber = document.getElementById("question_number");
const topLine = document.getElementById("top_line");
const middleLines = document.getElementById("middle_lines");
const bottomLine = document.getElementById("bottom_line");
const answerButtons = document.getElementById("answer-buttons");
const block_answers = document.getElementById("block_answers");
const ansSheetBtns = document.getElementById("ansSheetBtns");
const ansSheetGrid = document.getElementsByClassName(
  "answer_sheet-column-square"
);

const numeric_answers = document.getElementById("text_fields");
const numericInputs = document.querySelectorAll(".text_input");

let currentQuestionIndex = 0;
let test_questions = [];
let questionCount = 0;
let displayedQuestion;

let test_id;
let block_id;
let test_type;
let course = params.get("course");

// Get test UUID from URL
const test_uuid = params.get("uuid");

let data = {};

// Load test results from server
async function loadTestResults() {
  try {
    const response = await fetch(
      `/api/test-details/${test_uuid}?auth_key=${auth_key}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    data = await response.json();

    console.log("Received test data:", data); // Debug log

    test_id = data.test;
    block_id = data.block;
    test_type = data.test_type;

    // Check if we have questions data
    if (!data.questions) {
      throw new Error("No questions received from server");
    }

    // Set test data
    test_questions = data.questions;
    questionCount = test_questions.length;

    // Set test info
    const alt_test_name =
      {
        short: `Тренувальний тест по темі ${data.test}`,
        full: `Розширений тест по темі ${data.test}`,
        final: `Підсумковий тест по блоку ${data.block}`,
      }[data.test_type] || "Тест";

    document.getElementById("result-test_name").innerHTML =
      data.test_name != "" && data.test_name != undefined
        ? data.test_name
        : alt_test_name;

    document.getElementById(
      "test_result-date"
    ).innerHTML = `${new Date().toLocaleDateString()} • ${String(
      new Date().getHours()
    ).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
    document.getElementById(
      "test_date"
    ).innerHTML = `${new Date().toLocaleDateString()} • ${String(
      new Date().getHours()
    ).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;

    document.getElementById(
      "test_result-correct_amount"
    ).innerHTML = `${Math.ceil(data.score)}%`;
    document.getElementById("test_result-abcd").innerHTML = `${Math.ceil(
      data.abcd_questions_accuracy
    )}%`;
    document.getElementById("test_result-vidp").innerHTML = `${Math.ceil(
      data.vidpovidnist_questions_accuracy
    )}%`;
    document.getElementById("test_result-hron").innerHTML = `${Math.ceil(
      data.hronology_questions_accuracy
    )}%`;
    document.getElementById("test_result-mul_ans").innerHTML = `${Math.ceil(
      data.mul_ans_questions_accuracy
    )}%`;

    document.title = data.test_name || alt_test_name;
    document.querySelector(
      'meta[name="description"]'
    ).content = `Дата проходження: ${new Date().toLocaleDateString()} • ${String(
      new Date().getHours()
    ).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(
      2,
      "0"
    )} | Результат: ${Math.ceil(data.score)}%`;

    // Format time
    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
      ).padStart(2, "0")}`;
    }
    document.getElementById("test_result-time").innerHTML = formatTime(
      data.time
    );

    document.getElementById("test_result").classList.remove("display-none");

    // Only proceed if we have questions
    if (questionCount === 0) {
      throw new Error("No questions found in test data");
    }

    // Initialize question display
    for (var i = 1; i <= questionCount; i++) {
      // Create buttons for both block_answers and test_result-block_answers
      var btn = document.createElement("div");
      var resultBtn = document.createElement("div");

      // Set up main button
      btn.classList.add("block_answers-item");
      btn.id = "q" + i;
      btn.innerHTML = i;

      // Set up result button
      resultBtn.classList.add("block_answers-item");
      resultBtn.id = "_q" + i;
      resultBtn.innerHTML = i;

      if (test_questions[i - 1].q_type != "abcd") {
        test_questions[i - 1].isCorrect =
          test_questions[i - 1].correct_percentage > 50;
      }

      // Add correct/incorrect indicators to main button
      if (test_questions[i - 1].selected) {
        if (test_questions[i - 1].isCorrect) {
          btn.classList.add("correct");
          resultBtn.classList.add("correct");
        } else {
          btn.classList.add("incorrect");
          resultBtn.classList.add("incorrect");
        }
      }

      // Add click handlers
      btn.addEventListener("click", function () {
        currentQuestionIndex = parseInt(this.innerHTML) - 1;
        showQuestion();
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });

      resultBtn.addEventListener("click", function () {
        document.getElementById("test_result").classList.add("display-none");

        currentQuestionIndex = parseInt(this.innerHTML) - 1;
        showQuestion();
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });

      // Append buttons to their containers
      block_answers.appendChild(btn);
      document
        .getElementById("test_result-block_answers")
        .appendChild(resultBtn);
    }

    document
      .getElementById("test_result-close")
      .addEventListener("click", () => {
        document.getElementById("test_result").classList.toggle("display-none");
      });

    showQuestion();
    document
      .getElementById("initial_black_screen")
      .classList.add("display-none");
  } catch (error) {
    console.error("Error loading test results:", error);
    document.getElementById(
      "initial_black_screen-text"
    ).innerHTML = `Помилка завантаження результатів: ${error.message}`;
  }
}

function resetState() {
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

function showQuestion() {
  resetState();
  data.currentQuestionIndex = currentQuestionIndex;
  let currentQuestion = test_questions[currentQuestionIndex];
  const q_id = document.getElementById("q" + (currentQuestionIndex + 1));
  q_id.classList.add("selected");
  displayedQuestion = currentQuestion;
  let questionNo = currentQuestionIndex + 1;
  questionNumber.innerHTML = questionNo;
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
  checkIfImageExists(currentQuestion.question);
  document.getElementById("af").innerHTML = currentQuestion.af;
  document.getElementById("bf").innerHTML = currentQuestion.bf;
  document.getElementById("cf").innerHTML = currentQuestion.cf;
  document.getElementById("df").innerHTML = currentQuestion.df;

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
      answerButtons.appendChild(button);
      if (answer.correct) {
        button.dataset.correct = answer.correct;
      }
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
      for (i = 1; i < 4; i++) {
        let answer_field = document.getElementById("text_input" + i);
        answer_field.disabled = true;
        if (currentQuestion.selected != "") {
          if (currentQuestion.isCorrect) {
            answer_field.classList.add("correct");
          } else if (
            currentQuestion.correct.includes(currentQuestion.selected[i - 1])
          ) {
            answer_field.classList.add("yellow-selected");
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
              document.getElementById("f" + j).classList.add("yellow-selected");
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
  Array.from(
    document.getElementsByClassName("question_answers_list-element-text")
  ).forEach((field) => {
    if (field.innerHTML == "" || field.innerHTML == "undefined") {
      field.parentElement.classList.add("display-none");
    }
  });
  const showTestID = test_type == "final" ? `${currentQuestion.test_id}/` : "";
  document.getElementById("question_id").innerHTML =
    showTestID + "ID#" + currentQuestion.question;
}
let image_xhr = new XMLHttpRequest();
function checkIfImageExists(imageId) {
  image_xhr = new XMLHttpRequest();
  image_xhr.onreadystatechange = function () {
    if (image_xhr.readyState === XMLHttpRequest.DONE) {
      if (image_xhr.status === 200) {
        // Construct the image URL with a cache buster
        const imageUrl = `/getImage?auth_key=${auth_key}&course=${course}&blockId=${block_id}&testId=${test_id}&imageId=${imageId}&t=${new Date().getTime()}`;

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
    `/getImage?auth_key=${auth_key}&course=${course}&blockId=${block_id}&testId=${test_id}&imageId=${imageId}`,
    true
  );
  image_xhr.send();
}

function nextQuestionArrow() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questionCount) {
    showQuestion();
  } else {
    currentQuestionIndex--;
  }
}
document.getElementById("next_arrow").addEventListener("click", () => {
  nextQuestionArrow();
});
function previousQuestionArrow() {
  currentQuestionIndex--;
  if (currentQuestionIndex >= 0) {
    showQuestion();
  } else {
    currentQuestionIndex++;
  }
}
document.getElementById("back_arrow").addEventListener("click", () => {
  previousQuestionArrow();
});
const questionIdElement = document.getElementById("question_id");
if (getCookie("group") != "student") {
  questionIdElement.addEventListener("click", () => {
    window.open(
      `/test_editor?q_id=${
        questionIdElement.innerHTML.split("#")[1]
      }&course=${course}&block=${block_id}&test=${displayedQuestion.test_id}`
    );
  });
}
loadTestResults();
