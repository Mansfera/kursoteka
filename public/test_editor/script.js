const year = document.getElementById("year");
const search = document.getElementById("search_bar");
const topLine = document.getElementById("top_question");
const middleLines = document.getElementById("middle_lines");
const bottomLine = document.getElementById("bottom_question");
const answerButtons = document.getElementById("answer-buttons");
const finishTestButton = document.getElementById("finishTestButton");
const block_answers = document.getElementById("block_answers");
const ansSheetBtns = document.getElementById("ansSheetBtns");
const ansSheetGrid = document.getElementsByClassName(
  "answer_sheet-column-square"
);
const numeric_answers = document.getElementById("text_fields");

let promises = [];

let questions = [];
let vidpovidnist_questions = [];
let hronology_questions = [];
let mul_ans_questions = [];
let test_questions = [];

let q_len;
let v_len;
let h_len;
let ma_len;

let currentQuestionIndex = 0;
let currentQuestion;
const auth_key = getCookie("auth_key");
const course = params.get("course");
const block_id = params.get("block");
const test_id = params.get("test");

async function loadTestDataFromServer() {
  try {
    const response = await fetch(
      `/loadTestData?auth_key=${auth_key}&course=${course}&block=${block_id}&firstTest=${test_id}&lastTest=${test_id}`
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
loadTestDataFromServer()
  .then((testData) => {
    if (testData) {
      questions = testData.questions;
      q_len = questions.length;
      vidpovidnist_questions = testData.vidpovidnistQuestions;
      v_len = vidpovidnist_questions.length;
      hronology_questions = testData.hronologyQuestions;
      h_len = hronology_questions.length;
      mul_ans_questions = testData.mulAnsQuestions;
      ma_len = mul_ans_questions.length;
      test_questions.push(
        ...questions,
        ...vidpovidnist_questions,
        ...hronology_questions,
        ...mul_ans_questions
      );

      showQuestion();
    } else {
      console.error("Failed to load test data");
    }
  })
  .catch((error) => {
    console.error("Error loading test data:", error);
  });

year.addEventListener("input", function (e) {
  let value = parseInt(e.target.value);
  if (value > 2030) {
    e.target.value = 2030;
  }
});
const textareas = document.getElementsByClassName("input_fields-item");

Array.from(textareas).forEach((textarea) => {
  textarea.addEventListener("input", function () {
    this.style.height = "3rem"; // Reset the height
    this.style.height = this.scrollHeight + "px"; // Set it to the scroll height
  });
});
Array.from(ansSheetGrid).forEach((button) => {
  button.addEventListener("click", selectAnswer);
});
function resetState() {
  comment.value = "";
  year.value = "";
  topLine.value = "";
  middleLines.value = "";
  bottomLine.value = "";
  ansSheetBtns.classList.add("display-none");
  xhr_q_img.abort();
  document.getElementById("q_img").src = "/assets/image-upload.svg";
  if (currentQuestionIndex == 0) {
    document.getElementById("back_arrow").classList.add("invisible");
  } else {
    document.getElementById("back_arrow").classList.remove("invisible");
  }
  if (currentQuestionIndex == q_len + v_len + h_len + ma_len - 1) {
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
  document.getElementById("f6").classList.remove("display-none");
  document.getElementById("f7").classList.remove("display-none");
  Array.from(ansSheetGrid).forEach((button) => {
    if (button.classList.contains("selected")) {
      button.classList.remove("selected");
    }
  });
  for (i = 1; i < 4; i++) {
    let answer_field = document.getElementById("text_input" + i);
    answer_field.value = "";
    answer_field.disabled = false;
  }
  chosen_answers_from_sheet = "XXXX";
  while (answerButtons.firstChild) {
    answerButtons.removeChild(answerButtons.firstChild);
  }
  document.getElementById("af").value = "";
  document.getElementById("bf").value = "";
  document.getElementById("cf").value = "";
  document.getElementById("df").value = "";
  document.getElementById("f1").value = "";
  document.getElementById("f2").value = "";
  document.getElementById("f3").value = "";
  document.getElementById("f4").value = "";
  document.getElementById("f5").value = "";
  document.getElementById("f6").value = "";
  document.getElementById("f7").value = "";
}

function removeFromArray(array, element) {
  const index = array.indexOf(element);

  if (index !== -1) {
    array.splice(index, 1);
  }
}
let xhr_q_img;
function checkIfImageExists(blockId, testId, imageId) {
  xhr_q_img = new XMLHttpRequest();
  xhr_q_img.onreadystatechange = function () {
    if (xhr_q_img.readyState === XMLHttpRequest.DONE) {
      if (xhr_q_img.status === 200) {
        // Construct the image URL with a cache buster
        const imageUrl = `/getImage?auth_key=${auth_key}&course=${course}&blockId=${blockId}&testId=${testId}&imageId=${imageId}&t=${new Date().getTime()}`;

        const q_img = document.getElementById("q_img");
        if (q_img) {
          q_img.src = "/assets/three-dots-loader.svg";
          const tempImage = new Image(); // Create a temporary image element

          tempImage.src = imageUrl; // Set the source of the temporary image

          // When the image loads successfully
          tempImage.onload = function () {
            // Replace the loader with the actual image
            q_img.src = imageUrl;

            // Remove the blurred effect from all elements with the specified class
            Array.from(
              document.getElementsByClassName("__can_be_blurred")
            ).forEach((element) => {
              element.classList.remove("blurred");
            });
          };

          // If the image fails to load, use a fallback image
          tempImage.onerror = function () {
            q_img.src = "/assets/image-upload.svg";

            // Remove the blurred effect in case of error too
            Array.from(
              document.getElementsByClassName("__can_be_blurred")
            ).forEach((element) => {
              element.classList.remove("blurred");
            });
          };
        } else {
          console.error("Element with ID 'q_img' not found.");
        }
      } else {
        console.error(`Failed to fetch image. Status: ${xhr_q_img.status}`);
        document.getElementById("q_img").src = "/assets/image-upload.svg";
        Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
          (element) => {
            element.classList.remove("blurred");
          }
        );
      }
    }
  };

  // xhr.timeout = 10000;

  xhr_q_img.ontimeout = function () {
    console.error("The request for the image timed out.");
    document.getElementById("question_image").src = "/assets/image-upload.svg";
    Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
      (element) => {
        element.classList.remove("blurred");
      }
    );
  };

  xhr_q_img.open(
    "GET",
    `/getImage?auth_key=${auth_key}&course=${course}&blockId=${blockId}&testId=${testId}&imageId=${imageId}`,
    true
  );
  xhr_q_img.send();
}
search.addEventListener("input", function (e) {
  searchById(e.target.value);
});
function searchById(id) {
  const look_question = test_questions.find((test) => test.question === id);
  if (look_question) {
    currentQuestionIndex = test_questions.indexOf(look_question);
    showQuestion();
  }
}

function showQuestion() {
  resetState();
  currentQuestion = test_questions[currentQuestionIndex];
  displayedQuestion = currentQuestion;
  document.getElementById("search_bar").value = currentQuestion.question;
  year.value = currentQuestion.year;
  topLine.value = currentQuestion.top_question;
  if (currentQuestion.middle_rows != null) {
    currentQuestion.middle_rows.forEach((row) => {
      if (row != "") {
        middleLines.value += row;
      } else {
        middleLines.value += "\n";
      }
    });
  }
  bottomLine.value = currentQuestion.bottom_question;
  checkIfImageExists(
    block_id,
    currentQuestion.test_id,
    currentQuestion.question
  );
  document.getElementById("af").value = currentQuestion.af;
  document.getElementById("bf").value = currentQuestion.bf;
  document.getElementById("cf").value = currentQuestion.cf;
  document.getElementById("df").value = currentQuestion.df;

  if (currentQuestionIndex < q_len) {
    document.getElementById("list_num-fields").classList.add("display-none");
    document
      .getElementById("list_abcd-fields")
      .classList.remove("display-none");
    currentQuestion.answers.forEach((answer) => {
      const button = document.createElement("div");
      button.innerHTML = answer.text;
      button.classList.add("abcd_button");
      if (answer.correct) {
        button.classList.add("selected");
      }
      answerButtons.appendChild(button);
      button.addEventListener("click", selectAnswer);
    });
  } else {
    if (
      currentQuestionIndex > q_len - 1 &&
      currentQuestionIndex < q_len + v_len
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
      document.getElementById("f6").classList.add("display-none");
      document.getElementById("f7").classList.add("display-none");
      document.getElementById("f1").value = currentQuestion.f1;
      document.getElementById("f2").value = currentQuestion.f2;
      document.getElementById("f3").value = currentQuestion.f3;
      document.getElementById("f4").value = currentQuestion.f4;
      document.getElementById("f5").value = currentQuestion.f5;
      Array.from(ansSheetGrid).forEach((button) => {
        const index = button.id[0].charCodeAt(0) - "a".charCodeAt(0); // Calculate the index based on 'a', 'b', 'c', 'd'

        if (index >= 0 && index < 4) {
          if (button.id[1] == currentQuestion.correct[index]) {
            button.classList.add("selected");
          }
        }
      });
    } else if (
      currentQuestionIndex > q_len + v_len - 1 &&
      currentQuestionIndex < q_len + v_len + h_len
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
          if (button.id[1] == currentQuestion.correct[index]) {
            button.classList.add("selected");
          }
        }
      });
    } else if (
      currentQuestionIndex > q_len + v_len + h_len - 1 &&
      currentQuestionIndex < q_len + v_len + h_len + ma_len
    ) {
      document.getElementById("f1").value = currentQuestion.f1;
      document.getElementById("f2").value = currentQuestion.f2;
      document.getElementById("f3").value = currentQuestion.f3;
      document.getElementById("f4").value = currentQuestion.f4;
      document.getElementById("f5").value = currentQuestion.f5;
      document.getElementById("f6").value = currentQuestion.f6;
      document.getElementById("f7").value = currentQuestion.f7;
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
      comment.value = currentQuestion.comment;
    }
  }
  Array.from(
    document.getElementsByClassName("question_answers_list-element-text")
  ).forEach((field) => {
    if (field.innerHTML == "" || field.innerHTML == "undefined") {
      field.parentElement.classList.add("display-none");
    }
  });
  document.getElementById("search_bar").innerHTML =
    "ID#" + currentQuestion.question;
  Array.from(textareas).forEach((textarea) => {
    textarea.style.height = "3rem"; // Reset the height
    textarea.style.height = textarea.scrollHeight + "px"; // Set it to the scroll height
  });
}

function selectAnswer(e) {
  const selectedBtn = e.target;
  let currentQuestion = displayedQuestion;
  if (currentQuestionIndex < q_len) {
    Array.from(answerButtons.children).forEach((button) => {
      button.classList.remove("selected");
    });
    selectedBtn.classList.add("selected");
    Array.from(currentQuestion.answers).forEach((answer) => {
      answer.correct = false;
      if (answer.text == selectedBtn.innerHTML) {
        answer.correct = true;
      }
    });
  }
  if (
    currentQuestionIndex >= q_len &&
    currentQuestionIndex < q_len + v_len + h_len + ma_len
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
        let temp = selected_answers.splice(selected_answers.indexOf(answer), 1);
      }
    });
    selected_answers.push(selectedBtn);
    let chosen_answers_from_sheet = ["0", "0", "0", "0"];

    Array.from(selected_answers).forEach((button) => {
      const index = button.id[0].charCodeAt(0) - "a".charCodeAt(0); // Calculate the index based on 'a', 'b', 'c', 'd'
      if (index >= 0 && index < chosen_answers_from_sheet.length) {
        chosen_answers_from_sheet[index] = button.id[1];
      }
    });

    currentQuestion.correct = chosen_answers_from_sheet.join("");
  }
  test_questions[currentQuestionIndex] = currentQuestion;
}

Array.from(document.querySelectorAll(".text_input")).forEach((field) => {
  field.addEventListener("input", function () {
    saveQuestionData();
  });
});

Array.from(ansSheetBtns.children).forEach((button) => {
  if (button.classList.contains("sheet-btn")) {
    button.addEventListener("click", selectAnswer);
  }
});
Array.from(document.getElementById("answer-buttons").children).forEach(
  (button) => {
    button.addEventListener("click", selectAnswer);
  }
);

function addNewQuestion(q_id) {
  test_questions = [];
  test_questions.push(
    ...questions,
    ...vidpovidnist_questions,
    ...hronology_questions,
    ...mul_ans_questions
  );
  searchById(q_id);
}

function addQuestion() {
  let q_id = 1;
  let q_id_not_found = true;
  while (q_id_not_found) {
    const foundItem = questions.find((item) => item.question === "" + q_id);
    if (!foundItem) {
      q_id_not_found = false;
    } else {
      q_id++;
    }
  }
  let new_q = {
    selected: "",
    test_id: test_id,
    comment: "",
    middle_rows: [],
    bottom_question: "",
    top_question: "",
    af: "",
    bf: "",
    cf: "",
    df: "",
    question: q_id.toString(),
    answers: [
      {
        text: "А",
        correct: false,
      },
      {
        text: "Б",
        correct: false,
      },
      {
        text: "В",
        correct: false,
      },
      {
        text: "Г",
        correct: false,
      },
    ],
  };
  questions.push(new_q);
  q_len = questions.length;
  addNewQuestion(q_id.toString());
}
function addVQuestion() {
  currentQuestionIndex = q_len + v_len;
  let q_id = 1;
  let q_id_not_found = true;
  while (q_id_not_found) {
    const foundItem = vidpovidnist_questions.find(
      (item) => item.question === "1-" + q_id
    );
    if (!foundItem) {
      q_id_not_found = false;
    } else {
      q_id++;
    }
  }
  let new_q = {
    question: "1-" + q_id,
    selected: "",
    test_id: test_id,
    comment: "",
    bottom_question: "",
    top_question: "",
    middle_rows: [],
    af: "",
    bf: "",
    cf: "",
    df: "",
    f1: "",
    f2: "",
    f3: "",
    f4: "",
    f5: "",
    correct: "",
  };
  vidpovidnist_questions.push(new_q);
  v_len = vidpovidnist_questions.length;
  addNewQuestion("1-" + q_id.toString());
}
function addHQuestion() {
  let q_id = 1;
  let q_id_not_found = true;
  while (q_id_not_found) {
    const foundItem = hronology_questions.find(
      (item) => item.question === "2-" + q_id
    );
    if (!foundItem) {
      q_id_not_found = false;
    } else {
      q_id++;
    }
  }
  let new_q = {
    question: "2-" + q_id,
    selected: "",
    test_id: test_id,
    comment: "",
    bottom_question: "",
    top_question: "",
    middle_rows: [],
    af: "",
    bf: "",
    cf: "",
    df: "",
    correct: "",
  };
  hronology_questions.push(new_q);
  h_len = hronology_questions.length;
  addNewQuestion("2-" + q_id.toString());
}
function addMAQuestion() {
  let q_id = 1;
  let q_id_not_found = true;
  while (q_id_not_found) {
    const foundItem = mul_ans_questions.find(
      (item) => item.question === "3-" + q_id
    );
    if (!foundItem) {
      q_id_not_found = false;
    } else {
      q_id++;
    }
  }
  let new_q = {
    question: "3-" + q_id,
    selected: "",
    test_id: test_id,
    comment: "",
    bottom_question: "",
    top_question: "",
    middle_rows: [],
    f1: "",
    f2: "",
    f3: "",
    f4: "",
    f5: "",
    f6: "",
    f7: "",
    correct: "",
  };
  mul_ans_questions.push(new_q);
  ma_len = mul_ans_questions.length;
  addNewQuestion("3-" + q_id.toString());
}
function removeQuestion() {
  if (currentQuestionIndex < q_len) {
    questions.splice(questions.indexOf(currentQuestion), 1);
    q_len = questions.length;
  } else if (currentQuestionIndex < q_len + v_len) {
    vidpovidnist_questions.splice(
      vidpovidnist_questions.indexOf(currentQuestion),
      1
    );
    v_len = vidpovidnist_questions.length;
  } else if (currentQuestionIndex < q_len + v_len + h_len) {
    hronology_questions.splice(hronology_questions.indexOf(currentQuestion), 1);
    h_len = hronology_questions.length;
  } else if (currentQuestionIndex < q_len + v_len + h_len + ma_len) {
    mul_ans_questions.splice(mul_ans_questions.indexOf(currentQuestion), 1);
    ma_len = mul_ans_questions.length;
  }
  currentQuestionIndex--;
  if (currentQuestionIndex < 0) {
    currentQuestionIndex++;
  }
  test_questions = [];
  test_questions.push(
    ...questions,
    ...vidpovidnist_questions,
    ...hronology_questions,
    ...mul_ans_questions
  );
  showQuestion();
}
let progressInterval;
function startRemoveAnimation() {
  let progressBar = document.querySelector(".remove-progress");
  progressBar.style.width = "100%";
  progressInterval = setTimeout(removeQuestion, 500);
}
function stopRemoveAnimation() {
  let progressBar = document.querySelector(".remove-progress");
  progressBar.style.width = "0";
  clearTimeout(progressInterval);
}

function saveQuestionData() {
  if (year.value != "0" || year.value != "") {
    currentQuestion.year = +year.value;
  }
  currentQuestion.top_question = topLine.value;
  currentQuestion.comment = comment.value;
  if (middleLines.value.length > 0) {
    currentQuestion.middle_rows = middleLines.value.split("\n");
    let middle_rows_len = currentQuestion.middle_rows.length;
    while (
      currentQuestion.middle_rows[middle_rows_len - 1] == "" &&
      currentQuestion.middle_rows[middle_rows_len - 2] == ""
    ) {
      currentQuestion.middle_rows.pop();
      middle_rows_len = currentQuestion.middle_rows.length;
    }
  } else {
    currentQuestion.middle_rows = [];
  }
  currentQuestion.bottom_question = bottomLine.value;

  // answers

  if (currentQuestionIndex < q_len) {
    let keys = ["af", "bf", "cf", "df"];
    keys.forEach((key) => {
      currentQuestion[key] = document.getElementById(key).value;
    });
    let index = questions.findIndex(
      (q) => q.question === currentQuestion.question
    );
    questions[index] = currentQuestion;
  } else if (currentQuestionIndex < q_len + v_len) {
    let keys = ["af", "bf", "cf", "df", "f1", "f2", "f3", "f4", "f5"];
    keys.forEach((key) => {
      currentQuestion[key] = document.getElementById(key).value;
    });
    for (let i = 1; i <= 5; i++) {
      currentQuestion["f" + i] = document.getElementById("f" + i).value;
    }
    let index = vidpovidnist_questions.findIndex(
      (q) => q.question === currentQuestion.question
    );
    vidpovidnist_questions[index] = currentQuestion;
  } else if (currentQuestionIndex < q_len + v_len + h_len) {
    let keys = ["af", "bf", "cf", "df"];
    keys.forEach((key) => {
      currentQuestion[key] = document.getElementById(key).value;
    });
    let index = hronology_questions.findIndex(
      (q) => q.question === currentQuestion.question
    );
    hronology_questions[index] = currentQuestion;
  } else if (currentQuestionIndex < q_len + v_len + h_len + ma_len) {
    for (let i = 1; i <= 7; i++) {
      currentQuestion["f" + i] = document.getElementById("f" + i).value;
    }
    let temp_str = "";
    Array.from(document.getElementById("text_fields").children).forEach(
      (field) => {
        if (field.value.length == 1) {
          temp_str += field.value;
        } else {
          temp_str += "0";
        }
      }
    );
    if (temp_str == "000") {
      temp_str = "";
    }
    currentQuestion.correct = temp_str.split("").sort().join("");
    let index = mul_ans_questions.findIndex(
      (q) => q.question === currentQuestion.question
    );
    mul_ans_questions[index] = currentQuestion;
  }
}

function nextQuestionArrow() {
  currentQuestionIndex++;
  if (currentQuestionIndex < q_len + v_len + h_len + ma_len) {
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

document.getElementById("q_img").addEventListener("click", () => {
  document.getElementById("file_input").click();
});
document.getElementById("delete_q_img").addEventListener("click", () => {
  fetch(
    `/deleteImg?auth_key=${auth_key}&course=${course}&img_name=${encodeURIComponent(
      currentQuestion.question
    )}&blockId=${encodeURIComponent(block_id)}&testId=${encodeURIComponent(
      currentQuestion.test_id
    )}`,
    {
      method: "POST",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      checkIfImageExists(
        block_id,
        currentQuestion.test_id,
        currentQuestion.question
      );
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
document
  .getElementById("file_input")
  .addEventListener("change", function (event) {
    let file = event.target.files[0];
    if (file) {
      // Display the selected image
      let reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("q_img").src = e.target.result;
      };
      reader.readAsDataURL(file);

      // Send the file to the server
      let formData = new FormData();
      formData.append("image", file);

      fetch(
        `/uploadImg?auth_key=${auth_key}&course=${course}&img_name=${encodeURIComponent(
          currentQuestion.question
        )}&blockId=${encodeURIComponent(block_id)}&testId=${encodeURIComponent(
          currentQuestion.test_id
        )}`,
        {
          method: "POST",
          body: formData,
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("Success:", data);
          checkIfImageExists(
            block_id,
            currentQuestion.test_id,
            currentQuestion.question
          );
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  });
Array.from(document.querySelectorAll(".input_fields-item")).forEach((field) => {
  field.addEventListener("input", function () {
    saveQuestionData();
  });
});

function saveTestData() {
  // saveQuestionData();
  const data = {
    auth_key: auth_key,
    courseName: course,
    blockId: block_id,
    testId: test_id,
    questions: questions.sort((a, b) => {
      const parseQuestion = (str) => str.split("-").map(Number);
      const [a1, a2 = 0] = parseQuestion(a.question); // Default to 0 if no second part
      const [b1, b2 = 0] = parseQuestion(b.question); // Default to 0 if no second part

      // Compare the first parts
      if (a1 !== b1) {
        return a1 - b1;
      }

      // If the first parts are equal, compare the second parts
      return a2 - b2;
    }),
    vidpovidnist_questions: vidpovidnist_questions.sort((a, b) => {
      const parseQuestion = (str) => str.split("-").map(Number);
      const [a1, a2 = 0] = parseQuestion(a.question); // Default to 0 if no second part
      const [b1, b2 = 0] = parseQuestion(b.question); // Default to 0 if no second part

      // Compare the first parts
      if (a1 !== b1) {
        return a1 - b1;
      }

      // If the first parts are equal, compare the second parts
      return a2 - b2;
    }),
    hronology_questions: hronology_questions.sort((a, b) => {
      const parseQuestion = (str) => str.split("-").map(Number);
      const [a1, a2 = 0] = parseQuestion(a.question); // Default to 0 if no second part
      const [b1, b2 = 0] = parseQuestion(b.question); // Default to 0 if no second part

      // Compare the first parts
      if (a1 !== b1) {
        return a1 - b1;
      }

      // If the first parts are equal, compare the second parts
      return a2 - b2;
    }),
    mul_ans_questions: mul_ans_questions.sort((a, b) => {
      const parseQuestion = (str) => str.split("-").map(Number);
      const [a1, a2 = 0] = parseQuestion(a.question); // Default to 0 if no second part
      const [b1, b2 = 0] = parseQuestion(b.question); // Default to 0 if no second part

      // Compare the first parts
      if (a1 !== b1) {
        return a1 - b1;
      }

      // If the first parts are equal, compare the second parts
      return a2 - b2;
    }),
  };

  fetch("/saveTest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      switch (response.status) {
        case 200:
          document.getElementById("save_button").innerHTML = "Збережено ✅";
          break;
        case 403:
          document.getElementById("save_button").innerHTML = "Помилка 403 ❌";
          break;
        default:
          document.getElementById("save_button").innerHTML = "Помилка ❌";
          break;
      }
      setTimeout(() => {
        document.getElementById("save_button").innerHTML = "Зберегти тест";
      }, 2000);
      response.json();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
