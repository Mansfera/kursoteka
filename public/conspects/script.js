class ConspectManager {
  constructor() {
    this.isEditMode = false;
    this.container = document.querySelector(".conspect-content");
    this.container.__manager = this;
    this.editorControls = document.getElementById("editor-controls");
    this.idInput = document.getElementById("conspect-id");
    this.idInputContainer = this.idInput.parentElement;

    // Image related elements
    this.imagePopup = document.querySelector(".image-popup");
    this.imageUploadDialog = document.querySelector(".image-upload-dialog");
    this.imageTooltip = document.querySelector(".image-tooltip");
    this.currentImage = null;

    // Setup ESC key handler
    this.setupEscapeKeyHandler();

    // Check URL params for showID
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has("showID")) {
      this.idInput.style.display = "none"; // Hide the ID input
    }

    this.conspectTitle = document.querySelector(".conspect-title");
    this.editTitleBtn = document.querySelector(".edit-title-btn");
    this.deleteConspectBtn = document.getElementById("delete-conspect-btn");
    this.saveBtn = document.querySelector(".conspect-header .save-btn");
    this.previewBtn = document.querySelector(".preview-btn");
    this.hasUnsavedChanges = false;
    this.toolbar = document.querySelector(".text-format-toolbar");
    this.setupEventListeners();
    this.init();
    if (this.isEditMode) {
      this.setupTitleEditing();
      this.setupPreviewMode();
    }
    this.setupWindowClose();
  }

  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get("course");
    const blockId = urlParams.get("blockId");
    const testId = urlParams.get("testId");
    const conspectId = urlParams.get("conspectId");

    if (!course || !blockId || !testId) {
      return;
    }

    try {
      const group_type = getCookie("group");

      if (group_type === "admin" || group_type === "teacher") {
        this.isEditMode = true;
        this.editorControls.style.display = "flex";
        this.deleteConspectBtn.style.display = "flex";
        this.saveBtn.style.display = "flex";
        this.previewBtn.style.display = "flex";
        document.querySelectorAll(".edit-title-btn").forEach((btn) => {
          btn.style.display = "block";
        });
        this.setupDeleteConspect(course, blockId, testId, conspectId);
        this.setupEventListeners();
      }

      if (conspectId) {
        await this.loadConspect(course, blockId, testId, conspectId);
      } else if (this.isEditMode) {
        this.idInput.value = Math.random().toString(36).substr(2, 9);
      }
    } catch (error) {
      console.error("Error in init:", error);
    }
  }

  async loadConspect(course, blockId, testId, conspectId) {
    try {
      const response = await fetch(
        `/api/course/getConspectData?course=${course}&blockId=${blockId}&testId=${testId}&conspectId=${conspectId}&auth_key=${auth_key}`
      );
      if (!response.ok) throw new Error("Failed to load conspect");

      const data = await response.json();
      this.container.innerHTML = this.sanitizeHTML(data.content || "");
      this.idInput.value = data.id || "";
      this.conspectTitle.textContent = data.name || "Назва конспекту";
      if (this.isEditMode) {
        this.container.contentEditable = "true";
      }
    } catch (error) {
      console.error("Error loading conspect:", error);
    }
  }

  setupEventListeners() {
    if (this.isEditMode) {
      this.saveBtn.addEventListener("click", () => this.saveConspect());

      // Add text selection handler
      document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        const container = document.querySelector(".conspect-container");
        // Only show toolbar if not in preview mode and there is text selected
        if (
          !container.classList.contains("preview-mode") &&
          selection.toString().length > 0 &&
          selection.anchorNode.parentElement.closest(".conspect-content")
        ) {
          this.showTextFormatToolbar(selection);
        } else {
          this.toolbar.style.display = "none";
        }
      });

      // Add format button handlers
      this.toolbar.querySelectorAll(".format-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.classList.contains("citation-btn")) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);

              // Check if selection is already inside a citation
              const isInsideCitation =
                range.commonAncestorContainer.parentElement.closest(
                  ".citation"
                );
              if (isInsideCitation) {
                return; // Don't allow nested citations
              }

              const citationDiv = document.createElement("div");
              citationDiv.className = "citation";
              citationDiv.innerHTML = range.toString();
              range.deleteContents();
              range.insertNode(citationDiv);
              this.hasUnsavedChanges = true;
            }
          } else if (btn.classList.contains("link-btn")) {
            const selection = window.getSelection();
            if (selection.toString().length > 0) {
              const url = prompt("Введіть URL посилання:", "https://");
              if (url) {
                const link = document.createElement("a");
                link.href = url;
                link.target = "_blank";
                link.textContent = selection.toString();
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(link);
                this.hasUnsavedChanges = true;
              }
            }
          } else if (btn.classList.contains("image-btn")) {
            this.showImageUploadDialog();
          } else {
            const command = btn.classList.contains("bold-btn")
              ? "bold"
              : btn.classList.contains("italic-btn")
              ? "italic"
              : "underline";
            document.execCommand(command, false);
            btn.classList.toggle("active");
            this.hasUnsavedChanges = true;
          }
        });
      });

      // Setup image upload handling
      const imageUpload = document.getElementById("image-upload");
      imageUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = document.querySelector(".image-preview");
            preview.src = e.target.result;
            preview.classList.add("active");
            // Automatically start upload
            this.uploadImage();
          };
          reader.readAsDataURL(file);
        }
      });

      // Setup image popup close button
      this.imagePopup.querySelector(".image-popup-close").addEventListener("click", () => {
        this.imagePopup.classList.remove("active");
      });

      // Setup image popup edit button
      this.imagePopup.querySelector(".image-popup-edit").addEventListener("click", () => {
        if (this.currentImage) {
          this.showImageUploadDialog(this.currentImage);
        }
      });

      // Handle image click for popup
      this.container.addEventListener("click", (e) => {
        if (e.target.tagName === "IMG") {
          this.currentImage = e.target;
          this.showImagePopup(e.target);
        } else if (e.target.classList.contains("image-link")) {
          e.preventDefault();
          const img = document.createElement("img");
          img.src = e.target.dataset.imageUrl;
          img.alt = e.target.textContent;
          this.currentImage = img;
          this.showImagePopup(img);
        }
      });

      // Handle image hover for preview
      this.container.addEventListener("mouseover", (e) => {
        if (e.target.tagName === "IMG" || e.target.classList.contains("image-link")) {
          const rect = e.target.getBoundingClientRect();
          const imgSrc = e.target.tagName === "IMG" ? e.target.src : e.target.dataset.imageUrl;
          this.imageTooltip.querySelector("img").src = imgSrc;
          this.imageTooltip.style.left = `${rect.right + 10}px`;
          this.imageTooltip.style.top = `${rect.top}px`;
          this.imageTooltip.classList.add("active");
        }
      });

      this.container.addEventListener("mouseout", (e) => {
        if (e.target.tagName === "IMG" || e.target.classList.contains("image-link")) {
          this.imageTooltip.classList.remove("active");
        }
      });

      // Add size selector handler
      const sizeSelect = this.toolbar.querySelector(".size-select");
      sizeSelect.addEventListener("change", () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          try {
            const range = selection.getRangeAt(0);
            const selectedNode = range.commonAncestorContainer;

            // Extract text content and create new span
            const text = range.toString();
            const span = document.createElement("span");
            span.className = `text-size-${sizeSelect.value}`;
            span.textContent = text;

            // Delete old content and insert new span
            range.deleteContents();
            range.insertNode(span);

            // Restore selection
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            selection.removeAllRanges();
            selection.addRange(newRange);

            this.hasUnsavedChanges = true;
          } catch (error) {
            console.error("Error applying text size:", error);
          }
        }
      });

      // Add content change handler
      this.container.addEventListener("input", () => {
        this.hasUnsavedChanges = true;
      });

      // Handle Enter key to preserve formatting
      this.container.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();

          const selection = window.getSelection();
          const range = selection.getRangeAt(0);

          // Get the current formatting
          const isBold = document.queryCommandState("bold");
          const isItalic = document.queryCommandState("italic");
          const isUnderline = document.queryCommandState("underline");

          // Find the closest block element
          let currentBlock = range.startContainer;
          while (currentBlock && currentBlock.nodeType !== 1) {
            currentBlock = currentBlock.parentElement;
          }

          // Create a new div
          const newBlock = document.createElement("div");

          // Copy text size if present
          if (currentBlock) {
            const sizeClass = Array.from(currentBlock.classList || []).find(
              (cls) => cls.startsWith("text-size-")
            );
            if (sizeClass) {
              newBlock.classList.add(sizeClass);
            }
          }

          // Handle citation: only copy citation class if we're directly inside a citation block
          // and not inside a nested element within the citation
          const citationBlock =
            range.startContainer.parentElement.closest(".citation");
          if (citationBlock && citationBlock.contains(range.startContainer)) {
            // Check if we're at the end of the citation block
            const isAtEnd = range.startOffset === range.startContainer.length;

            if (!isAtEnd) {
              // If not at the end, keep the citation formatting
              newBlock.classList.add("citation");
            } else {
              // If at the end, create a new block without citation
              // Move the cursor after the citation block
              range.setStartAfter(citationBlock);
              range.collapse(true);
            }
          }

          // Insert a break
          newBlock.innerHTML = "<br>";
          range.insertNode(newBlock);

          // Move cursor to new block
          const newRange = document.createRange();
          newRange.setStart(newBlock, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          // Reapply text formatting if needed
          if (isBold) document.execCommand("bold", false);
          if (isItalic) document.execCommand("italic", false);
          if (isUnderline) document.execCommand("underline", false);

          this.hasUnsavedChanges = true;
        }
      });

      // Handle paste to preserve formatting
      this.container.addEventListener("paste", (e) => {
        e.preventDefault();
        const text =
          e.clipboardData?.getData("text/html") ||
          e.clipboardData?.getData("text/plain");
        if (text) {
          const sanitizedContent = this.sanitizeHTML(text);
          document.execCommand("insertHTML", false, sanitizedContent);
        }
      });
    }
  }

  sanitizeHTML(html) {
    // Create a temporary div
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Remove any potentially dangerous elements/attributes
    const allowedTags = [
      "p",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "span",
      "br",
      "div",
      "blockquote",
      "img",
      "a"
    ];
    const allowedAttributes = [
      "class",
      "style",
      "src",
      "alt",
      "href",
      "target",
      "title",
      "data-original-src",
      "data-image-url"
    ];

    function cleanNode(node) {
      if (node.nodeType === 1) {
        // Element node
        if (!allowedTags.includes(node.tagName.toLowerCase())) {
          // Replace disallowed tags with their content
          const fragment = document.createDocumentFragment();
          while (node.firstChild) {
            fragment.appendChild(node.firstChild);
          }
          node.parentNode.replaceChild(fragment, node);
          return;
        }

        // Remove all attributes except allowed ones
        const attributes = Array.from(node.attributes);
        attributes.forEach((attr) => {
          if (!allowedAttributes.includes(attr.name)) {
            node.removeAttribute(attr.name);
          }
        });

        // Clean style attribute to only allow specific properties
        if (node.hasAttribute("style")) {
          const allowedStyles = [
            "font-weight",
            "font-style",
            "text-decoration",
          ];
          const styles = node.style;
          const validStyles = {};
          allowedStyles.forEach((style) => {
            if (styles[style]) {
              validStyles[style] = styles[style];
            }
          });
          node.removeAttribute("style");
          Object.assign(node.style, validStyles);
        }
      }

      // Clean child nodes
      Array.from(node.childNodes).forEach(cleanNode);
    }

    cleanNode(temp);
    return temp.innerHTML;
  }

  async saveConspect() {
    const urlParams = new URLSearchParams(window.location.search);

    try {
      // Collect all image URLs from both <img> tags and image links
      const usedImages = [];
      
      // Get URLs from embedded images
      this.container.querySelectorAll('img').forEach(img => {
        if (img.src.startsWith('/courseData/')) {
          usedImages.push(img.src);
        }
      });
      
      // Get URLs from image links
      this.container.querySelectorAll('.image-link').forEach(link => {
        const imageUrl = link.dataset.imageUrl;
        if (imageUrl && imageUrl.startsWith('/courseData/')) {
          usedImages.push(imageUrl);
        }
      });

      const response = await fetch("/api/courseEditor/saveConspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_key,
          course: urlParams.get("course"),
          blockId: urlParams.get("blockId"),
          testId: urlParams.get("testId"),
          conspectId: this.idInput.value,
          name: this.conspectTitle.textContent,
          content: this.sanitizeHTML(this.container.innerHTML),
          usedImages: usedImages
        }),
      });

      if (!response.ok) throw new Error("Помилка при збереженні конспекту");
      this.hasUnsavedChanges = false;
      alert("Конспект збережено успішно!");
    } catch (error) {
      console.error("Помилка при збереженні:", error);
      alert("Помилка при збереженні конспекту");
    }
  }

  setupDeleteConspect(course, blockId, testId, conspectId) {
    this.deleteConspectBtn.addEventListener("click", async () => {
      if (confirm("Ви впевнені, що хочете видалити цей коспект?")) {
        try {
          const response = await fetch("/api/courseEditor/deleteConspect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              auth_key,
              course,
              blockId,
              testId,
              conspectId,
            }),
          });

          if (!response.ok) throw new Error("Помилка при видаленні конспекту");

          alert("Конспект видалено успішно!");
          window.close(); // Close the window after deletion
        } catch (error) {
          console.error("Помилка при вдаленні:", error);
          alert("Помилка при видаленні конспекту");
        }
      }
    });
  }

  showTextFormatToolbar(selection) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    this.toolbar.style.display = "flex";

    // Calculate initial position
    let top = rect.top - this.toolbar.offsetHeight - 10;
    let left = rect.left + (rect.width - this.toolbar.offsetWidth) / 2;

    // Ensure toolbar stays within viewport bounds
    // Check horizontal bounds
    if (left + this.toolbar.offsetWidth > viewportWidth) {
      left = viewportWidth - this.toolbar.offsetWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }

    // Check vertical bounds
    if (top < 10) {
      // If not enough space above, place below
      top = rect.bottom + 10;
    }
    if (top + this.toolbar.offsetHeight > viewportHeight) {
      top = viewportHeight - this.toolbar.offsetHeight - 10;
    }

    this.toolbar.style.top = `${top}px`;
    this.toolbar.style.left = `${left}px`;

    // Update button states based on current formatting
    this.toolbar
      .querySelector(".bold-btn")
      .classList.toggle("active", document.queryCommandState("bold"));
    this.toolbar
      .querySelector(".italic-btn")
      .classList.toggle("active", document.queryCommandState("italic"));
    this.toolbar
      .querySelector(".underline-btn")
      .classList.toggle("active", document.queryCommandState("underline"));

    // Update size selector
    const sizeSelect = this.toolbar.querySelector(".size-select");
    let currentNode = selection.anchorNode;
    let sizeSpan =
      currentNode.nodeType === 3 ? currentNode.parentElement : currentNode;

    // Find the closest span with a size class
    while (
      sizeSpan &&
      !Array.from(sizeSpan.classList || []).some((cls) =>
        cls.startsWith("text-size-")
      )
    ) {
      sizeSpan = sizeSpan.parentElement;
    }

    if (sizeSpan) {
      const currentSize = Array.from(sizeSpan.classList).find((cls) =>
        cls.startsWith("text-size-")
      );
      sizeSelect.value = currentSize.split("-")[2];
    } else {
      sizeSelect.value = "3"; // Default size
    }
  }

  setupTitleEditing() {
    this.editTitleBtn.addEventListener("click", () => {
      const isEditing = this.conspectTitle.contentEditable === "true";

      if (isEditing) {
        // Finish editing
        this.conspectTitle.contentEditable = "false";
        this.conspectTitle.classList.remove("editable");
        // If empty, clear content to show placeholder
        if (!this.conspectTitle.textContent.trim()) {
          this.conspectTitle.textContent = "";
        }
        this.editTitleBtn.querySelector("img").src = "/assets/pencil.svg";
      } else {
        // Start editing
        this.conspectTitle.contentEditable = "true";
        this.conspectTitle.classList.add("editable");
        // Clear placeholder text on edit start
        if (this.conspectTitle.textContent === "Назва конспекту") {
          this.conspectTitle.textContent = "";
        }
        this.conspectTitle.focus();
        this.editTitleBtn.querySelector("img").src = "/assets/check.svg";
      }
    });

    // Handle title changes
    this.conspectTitle.addEventListener("input", () => {
      if (this.conspectTitle.contentEditable === "true") {
        this.hasUnsavedChanges = true;
      }
    });

    // Handle enter key
    this.conspectTitle.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.editTitleBtn.click(); // Exit editing
      }
    });

    // Handle focus loss
    this.conspectTitle.addEventListener("blur", () => {
      if (this.conspectTitle.contentEditable === "true") {
        // Don't end editing if clicking the edit button
        if (document.activeElement !== this.editTitleBtn) {
          this.editTitleBtn.click(); // End editing
        }
      }
    });
  }

  setupPreviewMode() {
    this.previewBtn.addEventListener("click", () => {
      const container = document.querySelector(".conspect-container");
      const isPreview = container.classList.toggle("preview-mode");

      if (isPreview) {
        this.previewBtn.querySelector("img").src = "/assets/eye-off.svg";
        this.previewBtn.querySelector("img").alt = "Редагувати";
        this.previewBtn.innerHTML = `<img src="/assets/eye-off.svg" alt="Редагувати" />Редагувати`;

        // Hide the formatting toolbar
        this.toolbar.style.display = "none";

        // Make content non-editable
        this.container.contentEditable = "false";
        this.conspectTitle.contentEditable = "false";

        // Remove any existing selection
        window.getSelection().removeAllRanges();
      } else {
        this.previewBtn.querySelector("img").src = "/assets/eye.svg";
        this.previewBtn.querySelector("img").alt = "Перегляд";
        this.previewBtn.innerHTML = `<img src="/assets/eye.svg" alt="Перегляд" />Перегляд`;

        // Restore editability if in edit mode
        if (this.isEditMode) {
          this.container.contentEditable = "true";
        }
      }
    });
  }

  setupWindowClose() {
    window.addEventListener("beforeunload", (e) => {
      if (this.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "Чи ви дійсно хочете вийти без збереження?";
        return e.returnValue;
      }
    });
  }

  showImageUploadDialog(existingImage = null) {
    this.imageUploadDialog.classList.add("active");
    if (existingImage) {
      const preview = this.imageUploadDialog.querySelector(".image-preview");
      preview.src = existingImage.src;
      preview.classList.add("active");
    }
  }

  showImagePopup(image) {
    const popupImg = this.imagePopup.querySelector("img");
    popupImg.src = image.src;
    popupImg.alt = image.alt;
    this.imagePopup.classList.add("active");
    
    // Hide edit button in preview mode
    const container = document.querySelector(".conspect-container");
    const editButton = this.imagePopup.querySelector(".image-popup-edit");
    if (container.classList.contains("preview-mode")) {
      editButton.style.display = "none";
    } else {
      editButton.style.display = "block";
    }
  }

  async uploadImage(autoUpload = false) {
    const fileInput = document.getElementById("image-upload");
    const file = fileInput.files[0];
    
    if (!file) {
      alert("Будь ласка, виберіть файл");
      return;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const course = urlParams.get("course");
      const blockId = urlParams.get("blockId");
      const testId = urlParams.get("testId");

      if (!course || !blockId || !testId) {
        alert("Помилка: відсутні параметри курсу");
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("auth_key", auth_key);
      formData.append("course", course);
      formData.append("blockId", blockId);
      formData.append("testId", testId);
      formData.append("conspectId", this.idInput.value);

      const response = await fetch("/api/upload/conspectImage", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Помилка при завантаженні зображення");

      const data = await response.json();
      const imgUrl = data.url;

      // Create a hyperlink if text is selected, otherwise insert image directly
      const selection = window.getSelection();
      const hasSelection = selection.rangeCount > 0 && selection.toString().length > 0;
      this.insertImage(imgUrl, file.name, hasSelection);

      this.hasUnsavedChanges = true;
      this.imageUploadDialog.classList.remove("active");
      document.querySelector(".image-preview").classList.remove("active");
      fileInput.value = "";
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Помилка при завантаженні зображення");
    }
  }

  insertImage(imgUrl, altText, createLink = false) {
    // Insert image at current cursor position or replace existing image
    if (this.currentImage) {
      // Store the old image URL for cleanup if needed
      const oldUrl = this.currentImage.src;
      this.currentImage.src = imgUrl;
    } else {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        if (createLink) {
          // Create a hyperlink
          const link = document.createElement("a");
          link.href = "#";
          link.dataset.imageUrl = imgUrl;
          link.textContent = selection.toString() || altText;
          link.className = "image-link";
          
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(link);
        } else {
          // Insert image directly
          const img = document.createElement("img");
          img.src = imgUrl;
          img.alt = altText;
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
        }
      } else {
        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = altText;
        this.container.appendChild(img);
      }
    }
  }

  setupEscapeKeyHandler() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close image popup if open
        if (this.imagePopup.classList.contains('active')) {
          this.imagePopup.classList.remove('active');
        }
        // Close image upload dialog if open
        if (this.imageUploadDialog.classList.contains('active')) {
          this.imageUploadDialog.classList.remove('active');
          // Reset the file input and preview
          const fileInput = document.getElementById('image-upload');
          fileInput.value = '';
          document.querySelector('.image-preview').classList.remove('active');
        }
        // Hide image tooltip if visible
        if (this.imageTooltip.classList.contains('active')) {
          this.imageTooltip.classList.remove('active');
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ConspectManager();
});

// Make uploadImage globally accessible
window.uploadImage = function() {
  const manager = document.querySelector(".conspect-content")?.__manager;
  if (manager) {
    manager.uploadImage();
  }
};
