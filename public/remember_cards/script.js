const course = params.get("course");
const block = params.get("block");
const tema = params.get("id");
const test_name = params.get("test_name");

const dont_know_btn = document.getElementById("card_button-dont_know");
const know_btn = document.getElementById("card_button-know");
const cardDisplay = document.getElementById("card_display");

document.getElementById("tema_name").innerHTML = test_name;
let cardList = [];
let currentCardId;
let cardUnknownCheck = false;
let round = 1;

async function addCards(cards) {
  cardList = shuffle(cards);
  currentCardId = cardList[0].id;
  for (const card of Array.from(cardList)) {
    const element = document.createElement("div");
    element.className = "card_display-item hidden";
    element.id = `img_id-${card.id}`;

    element.innerHTML = `
      <div class="card_display-item-front white_text"></div>
      <div class="card_display-item-back white_text"></div>
    `;

    let frontContent;

    switch (card.frontContentType) {
      case "img": {
        frontContent = await fetchCardImage(
          course,
          block,
          tema,
          card.id,
          auth_key
        );
        break;
      }
    }

    if (frontContent) {
      element
        .querySelector(".card_display-item-front")
        .appendChild(frontContent);
    }

    element.querySelector(".card_display-item-back").innerHTML = card.infoText;
    cardDisplay.appendChild(element);

    if (getCookie("group") === "admin" || getCookie("group") === "teacher") {
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "card-edit-btn-container";
      const editBtn = document.createElement("div");
      editBtn.className = "card-edit-btn";
      editBtn.innerHTML = "✏️";
      editBtn.addEventListener(
        "click",
        (e) => {
          e.stopPropagation();
          e.preventDefault();
          showEditWindow(card.id);
        },
        true
      );
      buttonContainer.appendChild(editBtn);
      element.appendChild(buttonContainer);
    }

    element.addEventListener("click", () => {
      element.classList.toggle("flipped");
      dont_know_btn.innerHTML = "Нагадати пізніше";
      know_btn.innerHTML = "Вже зрозуміло";
    });
    document.getElementById("progress_text").innerHTML = `${
      cardList.indexOf(card) + 1
    }/${cardList.length}`;
    document.getElementById("progress_bar").style.width = `${
      ((cardList.indexOf(card) + 1) * 100) / cardList.length
    }%`;
  }
  document.getElementById("loader").remove();
  document.getElementById("progress").remove();
  document.getElementById("card_options").classList.toggle("hidden");
  cardDisplay.children[0].classList.toggle("hidden");
}
function dont_know_btn_click() {
  const card = document.getElementById(`img_id-${currentCardId}`);
  if (cardUnknownCheck || card.classList.contains("flipped")) {
    dont_know_btn.innerHTML = "Не знаю";
    know_btn.innerHTML = "Знаю";
    card.classList.add("unknown");
    const currentIndex = cardList.indexOf(
      cardList.find((card) => card.id == currentCardId)
    );
    cardList[currentIndex].unknown = true;
    if (cardList[currentIndex + 1]) {
      currentCardId = cardList[currentIndex + 1].id;
      document
        .getElementById("card_display")
        .children[currentIndex + 1].classList.toggle("hidden");
    } else {
      startNewRound();
    }
    cardUnknownCheck = false;
  } else {
    cardUnknownCheck = true;
    card.classList.add("flipped");
    dont_know_btn.innerHTML = "Нагадати пізніше";
    know_btn.innerHTML = "Вже зрозуміло";
  }
}
function know_btn_click() {
  const card = document.getElementById(`img_id-${currentCardId}`);
  dont_know_btn.innerHTML = "Не знаю";
  know_btn.innerHTML = "Знаю";
  card.classList.add("known");
  const currentIndex = cardList.indexOf(
    cardList.find((card) => card.id == currentCardId)
  );
  cardList[currentIndex].unknown = false;
  if (cardList[currentIndex + 1]) {
    currentCardId = cardList[currentIndex + 1].id;
    document
      .getElementById("card_display")
      .children[currentIndex + 1].classList.toggle("hidden");
  } else {
    startNewRound();
  }
  cardUnknownCheck = false;
}

dont_know_btn.addEventListener("click", dont_know_btn_click);
know_btn.addEventListener("click", know_btn_click);
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === "ArrowRight") {
    know_btn_click();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    dont_know_btn_click();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    window.close();
  }
});

function startNewRound() {
  const elementsToRemove = Array.from(cardDisplay.children).filter((element) =>
    element.classList.contains("known")
  );
  elementsToRemove.forEach((element) => {
    cardDisplay.removeChild(element);
  });
  Array.from(cardDisplay.children).forEach((element) => {
    element.classList.remove("unknown");
    element.classList.remove("flipped");
    element.classList.add("hidden");
  });
  cardList = cardList.filter((card) => card.unknown == true);
  console.log(cardList.length != 0, cardList);
  if (cardList.length != 0) {
    round++;
    document.getElementById("alert_box").innerHTML = `Раунд ${round}`;
    document.getElementById("alert_box").classList.toggle("hidden");
    document.getElementById("alert_box").classList.toggle("display-none");
    setTimeout(() => {
      document.getElementById("alert_box").classList.toggle("hidden");
      document.getElementById("alert_box").classList.toggle("display-none");
    }, 2500);
    currentCardId = cardList[0].id;
    document
      .getElementById("card_display")
      .children[0].classList.toggle("hidden");
  } else {
    document.getElementById(
      "alert_box"
    ).innerHTML = `Ви запамʼятали усі картки з ${round} разу! 🥳`;
    document.getElementById("alert_box").classList.toggle("hidden");
    document.getElementById("alert_box").classList.toggle("display-none");
    setTimeout(() => {
      window.close();
    }, 10000);
  }
}

async function fetchCardImage(course, blockId, testId, imageId, auth_key) {
  try {
    const url = `/getCardImage?course=${course}&blockId=${blockId}&testId=${testId}&imageId=${imageId}&auth_key=${auth_key}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const frontContent = document.createElement("img");
    frontContent.className = "card_display-item-img";
    frontContent.src = url;
    return frontContent;
  } catch (error) {
    console.error("Error fetching card image:", error);
    alert("Помилка завантаження зображення");
    return null;
  }
}

async function loadCardsData() {
  try {
    const url = `/loadCardsData?auth_key=${auth_key}&course=${course}&block=${block}&tema=${tema}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("Отримано некоректні дані");
    }
    document.getElementById("progress").classList.toggle("hidden");
    await addCards(data);
  } catch (error) {
    console.error("Error loading cards data:", error);
    if (getCookie("group") === "admin" || getCookie("group") === "teacher") {
      document.getElementById("loader").remove();
      document.getElementById("progress").remove();
      document.getElementById("card_display").innerHTML = `
        <div class="no-cards-message white_text">Немає карток</div>
      `;
    } else {
      alert("Помилка завантаження даних карток");
      if (confirm("Бажаєте закрити вікно?")) {
        window.close();
      }
    }
  }
}

if (getCookie("group") === "admin" || getCookie("group") === "teacher") {
  const actionButtons = document.createElement("div");
  actionButtons.className = "card-action-buttons";

  const editBtn = document.createElement("div");
  editBtn.className = "card-action-btn edit-btn";
  editBtn.innerHTML = "✏️";
  editBtn.title = "Редагувати поточну картку";
  editBtn.onclick = () => {
    if (!currentCardId) {
      alert("Немає картки для редагування");
      return;
    }
    showEditWindow(currentCardId);
  };

  const createBtn = document.createElement("div");
  createBtn.className = "card-action-btn";
  createBtn.innerHTML = "➕";
  createBtn.title = "Створити нову картку";
  createBtn.onclick = () => showEditWindow("new");

  const deleteBtn = document.createElement("div");
  deleteBtn.className = "card-action-btn delete-btn";
  deleteBtn.innerHTML = "🗑️";
  deleteBtn.title = "Видалити поточну картку";
  deleteBtn.onclick = async () => {
    if (!currentCardId) {
      alert("Немає картки для видалення");
      return;
    }

    if (confirm("Ви впевнені, що хочете видалити цю картку?")) {
      try {
        const response = await fetch(
          `/deleteCard?course=${course}&blockId=${block}&testId=${tema}&imageId=${currentCardId}&auth_key=${auth_key}`,
          {
            method: "POST",
          }
        );

        if (!response.ok) throw new Error("Failed to delete card");

        location.reload();
      } catch (error) {
        alert("Помилка видалення картки");
      }
    }
  };

  actionButtons.appendChild(createBtn);
  actionButtons.appendChild(editBtn);
  actionButtons.appendChild(deleteBtn);
  document.querySelector(".tema_name-text").after(actionButtons);
}

loadCardsData();

async function showEditWindow(cardId) {
  const editWindow = document.createElement("div");
  editWindow.className = "edit-window";
  editWindow.onclick = (e) => e.stopPropagation();

  editWindow.innerHTML = `
    <div class="edit-window-content">
      <h3>${cardId === "new" ? "Створити нову картку" : "Редагувати картку"}</h3>
      <div class="edit-section">
        <div class="input_fields-img">
          <div class="delete_q_img-wrapper">
            <div id="delete_q_img">
              <img src="/assets/delete-image.svg" alt="Видалити зображення" />
            </div>
          </div>
          <img id="currentImage" src="${
            cardId === "new"
              ? "/assets/image-upload.svg"
              : `/getCardImage?course=${course}&blockId=${block}&testId=${tema}&imageId=${cardId}&auth_key=${auth_key}`
          }" alt="" />
          <input
            type="file"
            id="newCardImage"
            style="display: none"
            accept="image/*"
          />
        </div>
      </div>
      <div class="edit-section">
        <label>Текст зворотної сторони:</label>
        <textarea id="cardBackText">${
          cardId === "new"
            ? ""
            : document.querySelector(
                `#img_id-${cardId} .card_display-item-back`
              ).innerHTML
        }</textarea>
      </div>
      <div class="edit-buttons">
        <button id="saveCardBtn">${
          cardId === "new" ? "Створити" : "Зберегти"
        }</button>
        <button onclick="this.closest('.edit-window').remove()">Скасувати</button>
      </div>
      <div id="editError" class="edit-error"></div>
    </div>
  `;

  document.body.appendChild(editWindow);

  const imageUploadArea = editWindow.querySelector(".input_fields-img");
  const currentImage = editWindow.querySelector("#currentImage");
  const fileInput = editWindow.querySelector("#newCardImage");
  const deleteButton = editWindow.querySelector("#delete_q_img");

  // Handle click on image area
  imageUploadArea.addEventListener("click", () => {
    fileInput.click();
  });

  // Handle file selection
  fileInput.addEventListener("change", (event) => {
    if (event.target.files && event.target.files[0]) {
      handleImageUpload(event.target.files[0]);
    }
  });

  // Handle paste events
  imageUploadArea.addEventListener("paste", function (event) {
    event.preventDefault();
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.type.indexOf("image") === 0) {
        handleImageUpload(item.getAsFile());
        break;
      }
    }
  });

  // Also handle paste in textarea in case user pastes image while focused on text
  const textArea = editWindow.querySelector("#cardBackText");
  textArea.addEventListener("paste", function (event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.type.indexOf("image") === 0) {
        event.preventDefault();
        handleImageUpload(item.getAsFile());
        break;
      }
    }
  });

  // Handle drag and drop
  imageUploadArea.addEventListener("dragover", function (event) {
    event.preventDefault();
    imageUploadArea.style.opacity = "0.7";
  });

  imageUploadArea.addEventListener("dragleave", function (event) {
    event.preventDefault();
    imageUploadArea.style.opacity = "1";
  });

  imageUploadArea.addEventListener("drop", function (event) {
    event.preventDefault();
    imageUploadArea.style.opacity = "1";
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  });

  // Handle delete button
  deleteButton.addEventListener("click", (e) => {
    e.stopPropagation();
    currentImage.src = "/assets/image-upload.svg";
    fileInput.value = "";
  });

  function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      currentImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
    fileInput.files = new FileList([file]);
  }

  document.getElementById("saveCardBtn").onclick = async () => {
    const imageFile = fileInput.files[0];
    const backText = document.getElementById("cardBackText").value;
    const errorDiv = document.getElementById("editError");

    try {
      if (cardId === "new") {
        if (!imageFile) throw new Error("Будь ласка, завантажте зображення");
        if (!backText.trim()) throw new Error("Будь ласка, введіть текст");

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("text", backText);

        const response = await fetch(
          `/createCard?course=${course}&blockId=${block}&testId=${tema}&auth_key=${auth_key}`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) throw new Error("Не вдалося створити картку");

        // Reload cards after creation
        editWindow.remove();
        location.reload();
        return;
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);

        const response = await fetch(
          `/uploadCardImage?course=${course}&blockId=${block}&testId=${tema}&imageId=${cardId}&auth_key=${auth_key}`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) throw new Error("Не вдалося завантажити зображення");
      }

      const textResponse = await fetch(
        `/updateCardText?course=${course}&blockId=${block}&testId=${tema}&imageId=${cardId}&auth_key=${auth_key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: backText }),
        }
      );

      if (!textResponse.ok) throw new Error("Не вдалося оновити текст");

      document.querySelector(
        `#img_id-${cardId} .card_display-item-back`
      ).innerHTML = backText;
      if (imageFile) {
        const imgElement = document.querySelector(
          `#img_id-${cardId} .card_display-item-front img`
        );
        imgElement.src = URL.createObjectURL(imageFile);
      }

      editWindow.remove();
    } catch (error) {
      errorDiv.textContent = error.message;
    }
  };
}
