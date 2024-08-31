var courses = [];
var maxSearchIndex = 0;

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
    <div class="course_gallery-item" id="${course.id}">
              <div class="course_gallery-item-category white_text">
                ${course.type}
              </div>
              <div class="course_gallery-item-name white_text">
                ${course.name}
              </div>
            </div>
    `;
  const imageBg = wrapper.querySelector(".course_gallery-item");
  imageBg.style.backgroundImage = `url('/api/getCoverImage?course=${course.id}')`;
  return wrapper;
}

var swipeInterval;
function swipeLeftGallery() {
  for (let i = 2; i > -3; i--) {
    const element = document.getElementById("__move_index" + i);
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
    }
    element.classList.remove("move" + number);
    if (number - 1 == -3) {
      element.classList.add("move2");
    } else {
      element.classList.add("move" + (number - 1));
    }
    if (number == -2) {
      setTimeout(() => {
        element.classList.toggle("transition");
      }, 500);
    }
  }
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
      });
      swipeInterval = setInterval(swipeLeftGallery(), 3000);
    })
    .catch((error) => console.error("Error:", error));
});
