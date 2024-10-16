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
    element.addEventListener("click", () => {
      element.classList.toggle("flipped");
      dont_know_btn.innerHTML = "Нагадати пізніше";
      know_btn.innerHTML = "Вже зрозуміло";
    });
  }
  cardDisplay.children[0].classList.toggle("hidden");
}

dont_know_btn.addEventListener("click", () => {
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
});
know_btn.addEventListener("click", () => {
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

    if (response.ok) {
      const frontContent = document.createElement("img");
      frontContent.className = "card_display-item-img";
      frontContent.src = url;
      return frontContent;
    } else {
      console.error("Image not found or error fetching image");
      return null;
    }
  } catch (error) {
    console.error("Error fetching card image:", error);
    return null;
  }
}

async function loadCardsData() {
  try {
    const url = `/loadCardsData?auth_key=${auth_key}&course=${course}&block=${block}&tema=${tema}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      addCards(data);
    } else {
      console.error("Error fetching cards data:", response.status);
    }
  } catch (error) {
    console.error("Error loading cards data:", error);
  }
}

loadCardsData(auth_key, course, block, tema);
