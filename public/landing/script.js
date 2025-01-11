var courses = [];
var maxSearchIndex = 0;

let isDragging = false;
let startDragX = 0;

async function fetchCourses() {
  const response = await fetch("/api/marketplace/getCourses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      search_tags: ["recommended"],
      search_index: maxSearchIndex,
      search_amount: 5,
    }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }

  return await response.json();
}
function createGalleryItem(course, moveIndex) {
  const wrapper = document.createElement("div");
  wrapper.className = `course_gallery-item-wrapper transition move${moveIndex}`;
  wrapper.id = "__move_index" + moveIndex;
  wrapper.innerHTML = `
    <div class="course_gallery-item transition move${moveIndex}" id="${course.id}">
      <div class="course_gallery-item-category white_text">
        ${course.type}
      </div>
      <div class="course_gallery-item-name white_text">
        ${course.name}
      </div>
    </div>
    <div class="course_gallery-lock_overlay transition move${moveIndex} display-none" id="course_lock_overlay-${course.id}">
      <div class="lock_overlay-lock_blob-wrapper">
        <div class="lock_overlay-lock_blob">
          <img src="/assets/lock.svg" alt="locked course"/>
        </div>
      </div>
    </div>
    `;

  const imageBg = wrapper.querySelector(".course_gallery-item");
  const lockImageBg = wrapper.querySelector(".course_gallery-lock_overlay");
  imageBg.style.backgroundImage = `url('/api/course/getCoverImage?course=${course.id}')`;
  lockImageBg.style.backgroundImage = `url('/api/course/getCoverImage?course=${course.id}')`;

  return wrapper;
}

var swipeInterval;
function swipeLeftGallery() {
  for (let i = 2; i > -3; i--) {
    const element = document.getElementById("__move_index" + i);
    const element_child = element.children[0];
    const element_lock = element.children[1];
    const classes = element.classList;

    let number = null;
    classes.forEach((className) => {
      const match = className.match(/move(-?\d+)$/);
      if (match) {
        number = parseInt(match[1]); // Extract and parse the number
      }
    });
    if (number == -2) {
      element.classList.toggle("transition");
      element_child.classList.toggle("transition");
      element_lock.classList.toggle("transition");
    }
    element.classList.remove("move" + number);
    element_child.classList.remove("move" + number);
    element_lock.classList.remove("move" + number);
    if (number - 1 == -3) {
      element.classList.add("move2");
      element_child.classList.add("move2");
      element_lock.classList.add("move2");
    } else {
      element.classList.add("move" + (number - 1));
      element_child.classList.add("move" + (number - 1));
      element_lock.classList.add("move" + (number - 1));
    }
    if (number == -2) {
      setTimeout(() => {
        element.classList.toggle("transition");
        element_child.classList.toggle("transition");
        element_lock.classList.toggle("transition");
      }, 500);
    }
  }
}
function swipeRightGallery() {
  for (let i = -2; i < 3; i++) {
    const element = document.getElementById("__move_index" + i);
    const element_child = element.children[0];
    const element_lock = element.children[1];
    const classes = element.classList;

    let number = null;
    classes.forEach((className) => {
      const match = className.match(/move(-?\d+)$/);
      if (match) {
        number = parseInt(match[1]); // Extract and parse the number
      }
    });
    if (number == 2) {
      element.classList.toggle("transition");
      element_child.classList.toggle("transition");
      element_lock.classList.toggle("transition");
    }
    element.classList.remove("move" + number);
    element_child.classList.remove("move" + number);
    element_lock.classList.remove("move" + number);
    if (number + 1 == 3) {
      element.classList.add("move-2");
      element_child.classList.add("move-2");
      element_lock.classList.add("move-2");
    } else {
      element.classList.add("move" + (number + 1));
      element_child.classList.add("move" + (number + 1));
      element_lock.classList.add("move" + (number + 1));
    }
    if (number == 2) {
      setTimeout(() => {
        element.classList.toggle("transition");
        element_child.classList.toggle("transition");
        element_lock.classList.toggle("transition");
      }, 500);
    }
  }
}

function resetSwipeInterval() {
  clearInterval(swipeInterval);
  swipeInterval = setInterval(swipeLeftGallery, 7000);
}

document.addEventListener("DOMContentLoaded", function () {
  const gallery = document.querySelector(".course_gallery-wrapper");
  fetchCourses()
    .then((data) => {
      courses = data.courses;
      maxSearchIndex = data.maxIndex;
      moveIndex = -3;
      Array.from(courses).forEach((course) => {
        moveIndex++;
        const course_element = createGalleryItem(course, moveIndex);
        gallery.appendChild(course_element);
        course_element.addEventListener("click", () => {
          const lock = document.getElementById(
            `course_lock_overlay-${course.id}`
          );
          console.log(lock.classList);
          if (lock.classList.contains("display-none")) {
            window.location = "/course/?course=" + course.id;
          }
        });
        if (course.tags.includes("in_developement")) {
          document
            .getElementById(`course_lock_overlay-${course.id}`)
            .classList.toggle("display-none");
        }
      });
      swipeInterval = setInterval(swipeLeftGallery, 3000);
      rotateInfoCard_left();
      rotateInfoCard_interval = setInterval(rotateInfoCard_left, 3000);

      const galleryElement = document.getElementById("course_gallery");

      galleryElement.addEventListener(
        "touchstart",
        function (event) {
          startX = event.touches[0].clientX;
          startY = event.touches[0].clientY;
        },
        false
      );

      galleryElement.addEventListener(
        "touchmove",
        function (event) {
          endX = event.touches[0].clientX;
          endY = event.touches[0].clientY;
        },
        false
      );

      galleryElement.addEventListener(
        "touchend",
        function (event) {
          const diffX = endX - startX;
          const diffY = endY - startY;

          // Only consider horizontal swipes with a significant difference
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
            if (diffX > 0) {
              // Swipe to the right
              swipeRightGallery();
            } else {
              // Swipe to the left
              swipeLeftGallery();
            }
          }
          resetSwipeInterval();

          // Reset values
          startX = 0;
          startY = 0;
          endX = 0;
          endY = 0;
        },
        false
      );

      galleryElement.addEventListener(
        "mousedown",
        function (event) {
          isDragging = true;
          startDragX = event.clientX;
          startX = event.clientX;
          startY = event.clientY;
        },
        false
      );

      galleryElement.addEventListener(
        "mousemove",
        function (event) {
          if (isDragging) {
            endX = event.clientX;
            endY = event.clientY;
          }
        },
        false
      );

      galleryElement.addEventListener(
        "mouseup",
        function (event) {
          if (isDragging) {
            isDragging = false;
            const diffX = endX - startX;
            const diffY = endY - startY;

            // Only consider horizontal swipes with a significant difference
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
              if (diffX > 0) {
                // Swipe to the right
                swipeRightGallery();
              } else {
                // Swipe to the left
                swipeLeftGallery();
              }
            }
            resetSwipeInterval();

            // Reset values
            startX = 0;
            startY = 0;
            endX = 0;
            endY = 0;
          }
        },
        false
      );

      galleryElement.addEventListener(
        "mouseleave",
        function () {
          isDragging = false;
        },
        false
      );

      document.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "ArrowLeft") {
            swipeLeftGallery();
            resetSwipeInterval();
          } else if (event.key === "ArrowRight") {
            swipeRightGallery();
            resetSwipeInterval();
          }
        },
        false
      );
    })
    .catch((error) => console.error("Error:", error));
});

let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;

const arrow_rigth = document.getElementById("info_card-arrow-right");
const arrow_left = document.getElementById("info_card-arrow-left");
const arrow_progress_circle = document.getElementById("arrow_progress_circle");
let current_card_index = 1;
arrow_left.addEventListener("click", () => {
  resetInfoCardRotate();
  rotateInfoCard_left();
});
function rotateInfoCard_left() {
  const info_card_num = document.getElementById("info_card-num");
  let data_info_card_num = info_card_num.dataset.info_card_num;
  if (data_info_card_num == 6) {
    data_info_card_num = 0;
  }
  data_info_card_num++;
  info_card_num.dataset.info_card_num = data_info_card_num;
  info_card_num.innerHTML = `0${data_info_card_num} / 06`;
  let current_rotation = 0;
  let target_rotation = 360;
  arrow_progress_circle.dataset.progress = target_rotation;
  const animateRotation = (start, end, duration) => {
    const startTime = performance.now();

    const rotate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentRotation = start + (end - start) * progress;
      arrow_progress_circle.style.background = `conic-gradient(white 0deg ${currentRotation}deg, transparent ${currentRotation}deg 360deg)`;
      if (progress < 1) {
        requestAnimationFrame(rotate);
      }
    };

    requestAnimationFrame(rotate);
  };
  animateRotation(current_rotation, target_rotation, 3000);

  current_card_index++;
  if (current_card_index > 6) {
    current_card_index = 1;
  }
  const cards = Array.from(
    document.querySelector(".info_card-middle").children
  );
  cards.forEach((card) => {
    card.classList.remove("move-left");
    card.classList.remove("move-right");

    // Get the index of the current card in the `cards` array
    const card_index = cards.indexOf(card) + 1;

    // Add classes based on the index relative to current_card_index
    if (card_index < current_card_index) {
      card.classList.add("move-left");
    }
    if (card_index > current_card_index) {
      card.classList.add("move-right");
    }
  });
}
arrow_rigth.addEventListener("click", () => {
  resetInfoCardRotate();
  rotateInfoCard_right();
});
function rotateInfoCard_right() {
  const info_card_num = document.getElementById("info_card-num");
  let data_info_card_num = info_card_num.dataset.info_card_num;
  if (data_info_card_num == 1) {
    data_info_card_num = 7;
  }
  data_info_card_num--;
  info_card_num.dataset.info_card_num = data_info_card_num;
  info_card_num.innerHTML = `0${data_info_card_num} / 06`;
  let current_rotation = 360;
  let target_rotation = 0;
  arrow_progress_circle.dataset.progress = target_rotation;
  const animateRotation = (start, end, duration) => {
    const startTime = performance.now();

    const rotate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentRotation = start + (end - start) * progress;
      arrow_progress_circle.style.background = `conic-gradient(white 0deg ${currentRotation}deg, transparent ${currentRotation}deg 360deg)`;
      if (progress < 1) {
        requestAnimationFrame(rotate);
      }
    };

    requestAnimationFrame(rotate);
  };
  animateRotation(current_rotation, target_rotation, 3000);

  current_card_index--;
  if (current_card_index < 1) {
    current_card_index = 6;
  }

  const cards = Array.from(
    document.querySelector(".info_card-middle").children
  );

  cards.forEach((card) => {
    card.classList.remove("move-left");
    card.classList.remove("move-right");

    // Get the index of the current card in the `cards` array
    const card_index = cards.indexOf(card) + 1;

    // Add classes based on the index relative to current_card_index
    if (card_index < current_card_index) {
      card.classList.add("move-left");
    }
    if (card_index > current_card_index) {
      card.classList.add("move-right");
    }
  });
}
let rotateInfoCard_interval;
function resetInfoCardRotate() {
  clearInterval(rotateInfoCard_interval);
  rotateInfoCard_interval = setInterval(rotateInfoCard_left, 3000);
}
