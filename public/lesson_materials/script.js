const course = params.get("course");
const block = params.get("block");
const tema = params.get("tema");
const scrollTo = params.get("scroll_to");

if (scrollTo) {
  const targetElement = document.querySelector(`.segment-${scrollTo}`);

  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start", // Scroll to the top of the element
    });
  }
}

async function getPlaylist() {
  const url = `/api/course/getPlaylist?auth_key=${encodeURIComponent(
    auth_key
  )}&course=${encodeURIComponent(course)}&block=${encodeURIComponent(
    block
  )}&tema=${encodeURIComponent(tema)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }

  return await response.json();
}
getPlaylist().then((data) => {
  if (data) {
    var player = new Playerjs({
      id: "player",
      // autoplay: 1,
      file: data.list,
    });
    fetch("/api/course/getUserCourses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auth_key, specific_course: course }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.courses[0]) {
          const info = findBlockAndTest(data.courses[0], block, tema);
          if (info) {
            // document.getElementById("block_name").innerHTML = info.block.name;
            document.getElementById("tema_name").innerHTML = info.tema.name;
          }
        }
      });
  } else {
    console.error("Failed to load test data");
  }
});

async function getConspectList() {
  const response = await fetch("/api/course/getUserCourses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ auth_key, specific_course: course }),
  });
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }

  return await response.json();
}
getConspectList().then((data) => {
  const conspects = document.querySelector(".segment-conspects");

  if (data.courses.length > 0) {
    data.courses.forEach((course) => {
      Array.from(course.blocks).forEach((blockElement) => {
        if (blockElement.id == block) {
          Array.from(blockElement.tests).forEach((testElement) => {
            if (testElement.id == tema) {
              // Create conspects header if there are any conspects
              if (testElement.conspects && testElement.conspects.length > 0) {
                const conspectHeader = document.createElement("div");
                conspectHeader.className = "conspects-name white_text uppercase";
                conspectHeader.textContent = "Конспекти до теми";
                conspects.appendChild(conspectHeader);
              }

              // Display each conspect
              Array.from(testElement.conspects || []).forEach((conspect) => {
                const conspectCard = document.createElement("div");
                conspectCard.className = "conspects-item-wrapper";
                conspectCard.innerHTML = `
                  <div class="conspects-item-dot white_text">●</div>
                  <div class="conspects-item white_text" id="conspect-${conspect.id}">
                    ${conspect.name || "Без назви"}
                  </div>
                `;
                conspects.appendChild(conspectCard);
                conspectCard.addEventListener("click", () => {
                  const url = `/conspects/?course=${course.id}&blockId=${blockElement.id}&testId=${testElement.id}&conspectId=${conspect.id}`;
                  window.open(url, "_blank");
                });
              });

              // Add "Create New Conspect" button for teachers/admins
              if (getCookie("group") === "admin" || getCookie("group") === "teacher") {
                const createBtn = document.createElement("div");
                createBtn.className = "conspects-item-wrapper create-conspect";
                createBtn.innerHTML = `
                  <div class="conspects-item-dot white_text">+</div>
                  <div class="conspects-item white_text">
                    Створити конспект
                  </div>
                `;
                conspects.appendChild(createBtn);
                createBtn.addEventListener("click", () => {
                  const randomId = Math.random().toString(36).substring(2, 10);
                  const url = `/conspects/?course=${course.id}&blockId=${blockElement.id}&testId=${testElement.id}&conspectId=${randomId}`;
                  window.open(url, "_blank");
                });
              }
            }
          });
        }
      });
    });
  }
});

function displayConspect(blocks) {
  const mainContent = document.querySelector(".main-content");
  const conspectContainer = document.createElement("div");
  conspectContainer.className = "conspect-container";

  // Create close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "conspect-close-btn";
  closeBtn.innerHTML = "×";
  closeBtn.onclick = () => conspectContainer.remove();
  conspectContainer.appendChild(closeBtn);

  // Create content container
  const contentDiv = document.createElement("div");
  contentDiv.className = "conspect-content";

  blocks.forEach((block) => {
    const blockElement = document.createElement("div");
    blockElement.className = "conspect-block";
    blockElement.dataset.type = block.type;
    blockElement.innerHTML = block.content;
    contentDiv.appendChild(blockElement);
  });

  conspectContainer.appendChild(contentDiv);
  mainContent.appendChild(conspectContainer);
}

function findBlockAndTest(courseData, blockId, temaId) {
  const block = courseData.blocks.find((b) => b.id === blockId);

  if (!block) {
    console.log("Block not found");
    return null;
  }

  const tema = block.tests.find((t) => t.id === temaId);

  if (!tema) {
    console.log("Tema not found");
    return null;
  }

  return { block, tema };
}
