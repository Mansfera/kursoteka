const course = params.get("course");
const block = params.get("block");
const tema = params.get("tema");
const scrollTo = params.get("scroll_to");

if (scrollTo) {
  const targetElement = document.querySelector(`.segment-${scrollTo}`);

  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start' // Scroll to the top of the element
    });
  }
}

async function getPlaylist() {
  const url = `/getPlaylist?auth_key=${encodeURIComponent(
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
    fetch("/api/getUserCourses", {
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

async function getConspect(conspectId) {
  const url = `/getConspect?auth_key=${encodeURIComponent(
    auth_key
  )}&course=${encodeURIComponent(course)}&blockId=${encodeURIComponent(
    block
  )}&testId=${encodeURIComponent(tema)}&conspectId=${encodeURIComponent(
    conspectId
  )}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }

    const pdfBlob = await response.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Create a modal or container for the PDF viewer
    const viewerContainer = document.createElement('div');
    viewerContainer.style.position = 'fixed';
    viewerContainer.style.top = '0';
    viewerContainer.style.left = '0';
    viewerContainer.style.width = '100%';
    viewerContainer.style.height = '100%';
    viewerContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
    viewerContainer.style.zIndex = '9999';

    // Create an iframe to display the PDF
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // Set the src to the PDF URL with options to disable download
    iframe.src = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрити';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(viewerContainer);
      URL.revokeObjectURL(pdfUrl);
    });

    viewerContainer.appendChild(iframe);
    viewerContainer.appendChild(closeButton);
    document.body.appendChild(viewerContainer);
  } catch (error) {
    console.error("Failed to fetch the PDF: ", error);
  }
}

async function getConspectList() {
  const response = await fetch("/api/getUserCourses", {
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
              Array.from(testElement.conspects).forEach((conspect) => {
                const conspectCard = document.createElement("div");
                conspectCard.className = "conspects-item-wrapper";
                conspectCard.innerHTML = `
                <div class="conspects-item-dot white_text">●</div>
                <div class="conspects-item white_text" id="conspect-${conspect.id}">
                  ${conspect.name}
                </div>
                  `;
                conspects.appendChild(conspectCard);
                conspectCard.addEventListener("click", () => {
                  getConspect(conspect.id);
                });
              });
            }
          });
        }
      });
    });
  }
});

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
