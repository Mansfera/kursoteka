document.addEventListener("DOMContentLoaded", function () {
  const gallery = document.querySelector(".course_gallery-wrapper");
  const courses = [
    {
      category: "Англійська мова",
      name: "Курс підготовки до нмт з англійської мови",
      id: "english",
    },
    {
      category: "Математика",
      name: "Курс підготовки до нмт з математики",
      id: "math",
    },
    {
      category: "Історія України",
      name: "Курси підготовки до НМТ з історії України",
      id: "history",
    },
    {
      category: "Українська мова",
      name: "Курс підготовки до нмт з української мови",
      id: "ukrainian",
    },
    {
      category: "Біологія",
      name: "Курс підготовки до нмт з біології",
      id: "biology",
    },
    {
      category: "Хімія",
      name: "Курс підготовки до нмт з хімії",
      id: "chemistry",
    },
  ];
  let currentIndex = 0;
  let isAutoRotating = true;
  let startX, startY, startTime;
  let isDragging = false;
  let autoRotateTimeout;

  function createGalleryItem(course) {
    const wrapper = document.createElement("div");
    wrapper.className = "course_gallery-item-wrapper";
    wrapper.innerHTML = `
      <div class="course_gallery-item" id="${course.id}">
                <div class="course_gallery-item-category white_text">
                  ${course.category}
                </div>
                <div class="course_gallery-item-name white_text">
                  ${course.name}
                </div>
              </div>
      `;
    return wrapper;
  }

  function initializeGallery() {
    // Add initial items
    courses.forEach((course) => gallery.appendChild(createGalleryItem(course)));
    // Clone first item to the end and last item to the beginning
    gallery.appendChild(createGalleryItem(courses[0]));
    gallery.insertBefore(
      createGalleryItem(courses[courses.length - 1]),
      gallery.firstChild
    );
    updateGallery();
  }

  function getItemWidth() {
    // Get the width of the first gallery item
    return document.querySelector(".course_gallery-item-wrapper").offsetWidth;
  }

  function rotateGallery(direction) {
    currentIndex += direction;
    updateGallery(true);
    resetAutoRotate();
  }

  function updateGallery(animate = false) {
    const itemWidth = getItemWidth();
    if (!animate) {
      gallery.style.transition = "none";
    }
    gallery.style.transform = `translateX(-${
      (currentIndex + 1) * itemWidth
    }px)`;
    if (!animate) {
      gallery.offsetHeight; // Force reflow
      gallery.style.transition = "transform 0.5s ease-in-out";
    }

    if (currentIndex === -1) {
      setTimeout(() => {
        gallery.style.transition = "none";
        currentIndex = courses.length - 1;
        gallery.style.transform = `translateX(-${
          (currentIndex + 1) * itemWidth
        }px)`;
        gallery.offsetHeight; // Force reflow
        gallery.style.transition = "transform 0.5s ease-in-out";
      }, 500);
    } else if (currentIndex === courses.length) {
      setTimeout(() => {
        gallery.style.transition = "none";
        currentIndex = 0;
        gallery.style.transform = `translateX(-${
          (currentIndex + 1) * itemWidth
        }px)`;
        gallery.offsetHeight; // Force reflow
        gallery.style.transition = "transform 0.5s ease-in-out";
      }, 500);
    }
  }

  function resetAutoRotate() {
    clearTimeout(autoRotateTimeout);
    isAutoRotating = true;
    startAutoRotate();
  }

  function startAutoRotate() {
    if (isAutoRotating) {
      autoRotateTimeout = setTimeout(() => {
        rotateGallery(1);
      }, 3000);
    }
  }

  function handleStart(clientX, clientY) {
    startX = clientX;
    startY = clientY;
    startTime = new Date().getTime();
    isDragging = true;
    isAutoRotating = false;
  }

  function handleMove(clientX, clientY) {
    if (!isDragging) return;
    const diffX = clientX - startX;
    const itemWidth = getItemWidth();
    gallery.style.transform = `translateX(calc(-${
      (currentIndex + 1) * itemWidth
    }px + ${diffX}px))`;
  }

  function handleEnd(clientX, clientY) {
    if (!isDragging) return;
    isDragging = false;
    const diffX = clientX - startX;
    const diffY = clientY - startY;
    const diffTime = new Date().getTime() - startTime;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 50 || (Math.abs(diffX) > 20 && diffTime < 300)) {
        if (diffX > 0) {
          rotateGallery(-1);
        } else {
          rotateGallery(1);
        }
      } else {
        updateGallery(true);
      }
    }
    isAutoRotating = true;
    resetAutoRotate();
  }

  // Touch events
  gallery.addEventListener("touchstart", (e) =>
    handleStart(e.touches[0].clientX, e.touches[0].clientY)
  );
  gallery.addEventListener("touchmove", (e) =>
    handleMove(e.touches[0].clientX, e.touches[0].clientY)
  );
  gallery.addEventListener("touchend", (e) =>
    handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
  );

  // Mouse events
  gallery.addEventListener("mousedown", (e) =>
    handleStart(e.clientX, e.clientY)
  );
  gallery.addEventListener("mousemove", (e) =>
    handleMove(e.clientX, e.clientY)
  );
  gallery.addEventListener("mouseup", (e) => handleEnd(e.clientX, e.clientY));
  gallery.addEventListener("mouseleave", (e) => {
    if (isDragging) handleEnd(e.clientX, e.clientY);
  });

  // Prevent default drag behavior
  gallery.addEventListener("dragstart", (e) => e.preventDefault());

  // Mouse wheel event
  gallery.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaX > 50) {
      rotateGallery(1);
    } else if (e.deltaX < -50) {
      rotateGallery(-1);
    } else if (e.deltaY > 50) {
      rotateGallery(1);
    } else if (e.deltaY < -50) {
      rotateGallery(-1);
    }
  });

  initializeGallery();
  startAutoRotate();
});
