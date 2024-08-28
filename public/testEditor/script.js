var test_id = params.get("id");
var block_id = params.get("block");
let promises = [];

let questions = [];
let vidpovidnist_questions = [];
let hronology_questions = [];
let mul_ans_questions = [];

let questionCount;
let currentQuestionIndex = 0;
let currentQuestion;
async function loadTestDataFromServer(login, password, block, test) {
  try {
    const response = await fetch(
      `/loadTestData?login=${login}&password=${password}&block=${block}&firstTest=${test}&lastTest=${test}`
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

loadTestDataFromServer(
  getCookie("login"),
  getCookie("password"),
  block_id,
  test_id
)
  .then((testData) => {
    if (testData) {
      questions = testData.questions;
      vidpovidnist_questions = testData.vidpovidnistQuestions;
      hronology_questions = testData.hronologyQuestions;
      mul_ans_questions = testData.mulAnsQuestions;

      q_len = questions.length;
      v_len = vidpovidnist_questions.length;
      h_len = hronology_questions.length;
      ma_len = mul_ans_questions.length;
      questionCount = q_len + v_len + h_len + ma_len;
      showQuestion();
    } else {
      console.error("Failed to load test data");
    }
  })
  .catch((error) => {
    console.error("Error loading test data:", error);
  });

function resetState() {
  Array.from(document.querySelectorAll("input")).forEach((field) => {
    field.value = "";
  });
  Array.from(document.querySelectorAll("textarea")).forEach((field) => {
    field.value = "";
  });
  document.getElementById("q_img").classList.add("hidden");
  document.getElementById("image-loader").classList.remove("hidden");
  Array.from(document.getElementsByClassName("__can_be_blurred")).forEach(
    (element) => {
      element.classList.add("blurred");
    }
  );
  Array.from(document.getElementsByClassName("selected")).forEach((element) => {
    element.classList.remove("selected");
  });
}

function showQuestion() {
  resetState();
  if (currentQuestionIndex < q_len) {
    currentQuestion = questions[currentQuestionIndex];
  } else if (currentQuestionIndex < q_len + v_len) {
    currentQuestion = vidpovidnist_questions[currentQuestionIndex - q_len];
  } else if (currentQuestionIndex < q_len + v_len + h_len) {
    currentQuestion = hronology_questions[currentQuestionIndex - q_len - v_len];
  } else if (currentQuestionIndex < q_len + v_len + h_len + ma_len) {
    currentQuestion =
      mul_ans_questions[currentQuestionIndex - q_len - v_len - h_len];
  }

  //other data

  document.getElementById("q_info").innerHTML = currentQuestion.question;
  document.getElementById("questionNumber").innerHTML =
    "Запитання №" + (currentQuestionIndex + 1);
  Array.from(document.getElementsByClassName("hidden")).forEach((elem) => {
    elem.classList.remove("hidden");
  });
  document.getElementById("comment_field").value = currentQuestion.comment;
  if (currentQuestion.year != 0) {
    document.getElementById("year_f").value = currentQuestion.year;
  }

  //questions

  let top_question = currentQuestion.top_question;
  if (top_question != undefined && top_question != "") {
    document.getElementById("top_line").value = top_question;
  }
  if (currentQuestion.middle_rows != []) {
    let middle_lines = "";
    Array.from(currentQuestion.middle_rows).forEach((row) => {
      if (row != "") {
        middle_lines += row + "\n";
      } else {
        middle_lines += "\n";
      }
      document.getElementById("middle_lines").value = middle_lines;
    });
  }
  let bottom_question = currentQuestion.bottom_question;
  if (bottom_question != undefined && bottom_question != "") {
    document.getElementById("bottom_line").value = bottom_question;
  }

  // image

  checkIfImageExists(
    block_id,
    currentQuestion.test_id,
    currentQuestion.question
  );

  //aswer options

  let answer_row_amount;
  if (currentQuestionIndex < q_len) {
    Array.from(document.getElementById("answer-buttons").children).forEach(
      (button) => {
        Array.from(currentQuestion.answers).forEach((answer) => {
          if (answer.text === button.innerHTML) {
            if (answer.correct) {
              button.classList.add("selected");
            }
          }
        });
      }
    );
    let keys = ["af", "bf", "cf", "df"];
    keys.forEach((key) => {
      let value = currentQuestion[key];
      if (value != undefined && value !== "") {
        document.getElementById(key).value = value;
      }
    });
    answer_row_amount = 0;
    for (let i = 1; i <= 7; i++) {
      document.getElementById("f" + i).parentNode.classList.add("hidden");
    }
    document.getElementById("answer_sheet").classList.add("hidden");
    document.getElementById("text_fields").classList.add("hidden");
  } else if (currentQuestionIndex < q_len + v_len) {
    let keys = ["af", "bf", "cf", "df"];
    keys.forEach((key) => {
      let value = currentQuestion[key];
      if (value != undefined && value !== "") {
        document.getElementById(key).value = value;
      }
    });
    answer_row_amount = 5;
    for (let i = answer_row_amount + 1; i <= 7; i++) {
      document.getElementById("f" + i).parentNode.classList.add("hidden");
    }
    document.getElementById("answer-buttons").classList.add("hidden");
    document.getElementById("text_fields").classList.add("hidden");
    ansSheetBtns.style.gridTemplateColumns = "repeat(6, 1fr)";
    Array.from(ansSheetBtns.children).forEach((button) => {
      if (button.id.endsWith("5")) {
        button.classList.remove("hidden");
      }
      let str_char = 0;
      if (button.id.startsWith("a")) {
        str_char = 0;
        if (button.innerHTML == currentQuestion.correct[str_char]) {
          button.classList.add("selected");
        }
      } else if (button.id.startsWith("b")) {
        str_char = 1;
        if (button.innerHTML == currentQuestion.correct[str_char]) {
          button.classList.add("selected");
        }
      } else if (button.id.startsWith("c")) {
        str_char = 2;
        if (button.innerHTML == currentQuestion.correct[str_char]) {
          button.classList.add("selected");
        }
      } else if (button.id.startsWith("d")) {
        str_char = 3;
        if (button.innerHTML == currentQuestion.correct[str_char]) {
          button.classList.add("selected");
        }
      }
    });
  } else if (currentQuestionIndex < q_len + v_len + h_len) {
    let keys = ["af", "bf", "cf", "df"];
    keys.forEach((key) => {
      let value = currentQuestion[key];
      if (value != undefined && value !== "") {
        document.getElementById(key).value = value;
      }
    });
    answer_row_amount = 0;
    for (let i = 1; i <= 7; i++) {
      document.getElementById("f" + i).parentNode.classList.add("hidden");
    }
    document.getElementById("answer-buttons").classList.add("hidden");
    document.getElementById("text_fields").classList.add("hidden");
    ansSheetBtns.style.gridTemplateColumns = "repeat(5, 1fr)";
    Array.from(ansSheetBtns.children).forEach((button) => {
      if (button.id.endsWith("5")) {
        button.classList.add("hidden");
      }
      let str_char = 0;
      if (button.id.startsWith("a")) {
        str_char = 0;
        if (button.innerHTML == currentQuestion.correct[str_char]) {
          button.classList.add("selected");
        }
      } else if (button.id.startsWith("b")) {
        str_char = 1;
        if (button.innerHTML == currentQuestion.correct[str_char]) {
          button.classList.add("selected");
        }
      } else if (button.id.startsWith("c")) {
        str_char = 2;
        if (button.innerHTML == currentQuestion.correct[str_char]) {
          button.classList.add("selected");
        }
      } else if (button.id.startsWith("d")) {
        str_char = 3;
        if (button.innerHTML == currentQuestion.correct[str_char]) {
          button.classList.add("selected");
        }
      }
    });
  } else if (currentQuestionIndex < q_len + v_len + h_len + ma_len) {
    answer_row_amount = 7;
    let keys = ["af", "bf", "cf", "df"];
    keys.forEach((key) => {
      document.getElementById(key).parentNode.classList.add("hidden");
    });
    document.getElementById("answer-buttons").classList.add("hidden");
    document.getElementById("answer_sheet").classList.add("hidden");
    for (let i = 1; i <= 3; i++) {
      document.getElementById("text_input" + i).value =
        currentQuestion.correct[i - 1];
    }
  }
  for (let i = 1; i <= answer_row_amount; i++) {
    let num_f = currentQuestion["f" + i];
    if (num_f != undefined && num_f !== "") {
      document.getElementById("f" + i).value = num_f;
    }
  }
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
        const imageUrl = `/getImage?blockId=${blockId}&testId=${testId}&imageId=${imageId}`;
        const questionImageElement = document.getElementById("question_image");
        document.getElementById("deleteImg").classList.remove("hidden");
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
          document.getElementById("question_image").src =
            "/assets/upload-image.png";
          document.getElementById("deleteImg").classList.add("hidden");
          document.getElementById("image-loader").classList.add("hidden");
          Array.from(
            document.getElementsByClassName("__can_be_blurred")
          ).forEach((element) => {
            element.classList.remove("blurred");
          });
        };
      } else {
        // console.error(`Failed to fetch image. Status: ${xhr.status}`);
        document.getElementById("question_image").src =
          "/assets/upload-image.png";
        document.getElementById("deleteImg").classList.add("hidden");
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
function selectAnswer(e) {
  const selectedBtn = e.target;
  if (currentQuestionIndex < q_len) {
    Array.from(document.getElementById("answer-buttons").children).forEach(
      (button) => {
        button.classList.remove("selected");
        Array.from(currentQuestion.answers).forEach((answer) => {
          if (answer.text == button.innerHTML) {
            answer.correct = false;
          }
        });
      }
    );
    selectedBtn.classList.add("selected");
    Array.from(currentQuestion.answers).forEach((answer) => {
      if (answer.text == selectedBtn.innerHTML) {
        answer.correct = true;
      }
    });
    questions[currentQuestionIndex] = currentQuestion;
  } else if (currentQuestionIndex < q_len + v_len + h_len) {
    chosen_answers_from_sheet = "";
    selectedBtn.classList.add("selected");

    let row1selected = [];
    let row2selected = [];
    let row3selected = [];
    let row4selected = [];

    Array.from(ansSheetBtns.children).forEach((button) => {
      if (button.id.startsWith("a") && button.classList.contains("selected")) {
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
    currentQuestion.correct = chosen_answers_from_sheet;
    if (currentQuestionIndex < q_len + v_len) {
      vidpovidnist_questions[currentQuestionIndex - q_len] = currentQuestion;
    } else if (currentQuestionIndex < q_len + v_len + h_len) {
      hronology_questions[currentQuestionIndex - q_len - v_len] =
        currentQuestion;
    }
  }
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
  currentQuestionIndex = q_len - 1;
  showQuestion();
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
  currentQuestionIndex = q_len + v_len - 1;
  showQuestion();
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
  currentQuestionIndex = q_len + v_len + h_len - 1;
  showQuestion();
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
  currentQuestionIndex = q_len + v_len + h_len + ma_len - 1;
  showQuestion();
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
  showQuestion();
}
let progressInterval;
function startRemoveAnimation() {
  let progressBar = document.querySelector(".red-bg .remove-progress");
  progressBar.style.width = "100%";
  progressInterval = setTimeout(removeQuestion, 500);
}

function stopRemoveAnimation() {
  let progressBar = document.querySelector(".red-bg .remove-progress");
  progressBar.style.width = "0";
  clearTimeout(progressInterval);
}
function saveQuestionData() {
  if (
    document.getElementById("year_f").value != "0" ||
    document.getElementById("year_f").value != ""
  ) {
    currentQuestion.year = +document.getElementById("year_f").value;
  }
  currentQuestion.top_question = document.getElementById("top_line").value;
  currentQuestion.comment = document.getElementById("comment_field").value;
  if (document.getElementById("middle_lines").value.length > 0) {
    currentQuestion.middle_rows = document
      .getElementById("middle_lines")
      .value.split("\n");
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
  currentQuestion.bottom_question =
    document.getElementById("bottom_line").value;

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
  saveQuestionData();
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
  saveQuestionData();
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
document.getElementById("question_image").addEventListener("click", () => {
  document.getElementById("file_input").click();
});
document.getElementById("deleteImg").addEventListener("click", () => {
  fetch(
    `/deleteImg?login=${encodeURIComponent(
      getCookie("login")
    )}&password=${encodeURIComponent(
      getCookie("password")
    )}&img_name=${encodeURIComponent(
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
        `/uploadImg?login=${encodeURIComponent(
          getCookie("login")
        )}&password=${encodeURIComponent(
          getCookie("password")
        )}&img_name=${encodeURIComponent(
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

function saveTestData() {
  saveQuestionData();
  const data = {
    login: getCookie("login"),
    password: getCookie("password"),
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
          document.getElementById("save_btn_img").src =
            "/assets/green-checkbox.png";
          break;
        case 403:
          document.getElementById("save_btn_img").src = "/assets/red-cross.png";
          break;
        default:
        // Handle other response statuses here
      }
      setTimeout(() => {
        document.getElementById("save_btn_img").src = "/assets/save.png";
      }, 2000);
      response.json();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}
