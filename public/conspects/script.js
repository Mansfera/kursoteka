class ConspectManager {
  constructor() {
    this.isEditMode = false;
    this.blocks = [];
    this.container = document.querySelector(".conspect-content");
    this.editorControls = document.getElementById("editor-controls");
    this.idInput = document.getElementById("conspect-id");
    this.idInputContainer = this.idInput.parentElement;

    // Check URL params for showID
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has("showID")) {
      this.idInput.style.display = "none"; // Hide the ID input
    }

    this.draggedBlock = null;
    this.conspectTitle = document.querySelector(".conspect-title");
    this.editTitleBtn = document.querySelector(".edit-title-btn");
    this.deleteConspectBtn = document.getElementById("delete-conspect-btn");
    this.floatingBtnContainer = document.querySelector(
      ".floating-btn-container"
    );
    this.saveBtn = document.querySelector(".conspect-header .save-btn");
    this.previewBtn = document.querySelector(".preview-btn");
    this.hasUnsavedChanges = false;
    this.toolbar = document.querySelector(".text-format-toolbar");
    this.setupEventListeners();
    this.init();
    if (this.isEditMode) {
      this.setupDragAndDrop();
      this.addFloatingButton();
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
      this.blocks = data.blocks || [];
      this.idInput.value = data.id || "";
      this.conspectTitle.textContent = data.name || "Назва конспекту";
      this.renderBlocks();
      console.log(data);
    } catch (error) {
      console.error("Error loading conspect:", error);
    }
  }

  setupEventListeners() {
    if (this.isEditMode) {
      this.saveBtn.addEventListener("click", () => this.saveConspect());
      // Handle add block button
      this.editorControls.addEventListener("click", (e) => {
        const button = e.target.closest(".editor-btn");
        if (button) {
          if (button.classList.contains("add-block-btn")) {
            this.addBlock("line");
          } else if (button.classList.contains("save-btn")) {
            this.saveConspect();
          }
        }
      });

      // Handle line and shape clicks
      this.container.addEventListener("click", (e) => {
        const block = e.target.closest(".conspect-block");
        if (block) {
          // Check if click is on the line or line area
          const rect = block.getBoundingClientRect();
          const clickX = e.clientX - rect.left;

          if (clickX <= 40) {
            // Line click area width (includes the actual line)
            this.showBlockTypeSelector(block);
          }
          // Check if click is on the shape
          else if (
            e.target.closest(".shape-click-area") ||
            e.target.closest(".conspect-block::after")
          ) {
            this.showBlockTypeSelector(block);
          }
        }
      });

      // Add text selection handler
      document.addEventListener("selectionchange", () => {
        const selection = window.getSelection();
        if (
          selection.toString().length > 0 &&
          selection.anchorNode.parentElement.closest(".conspect-block")
        ) {
          this.showTextFormatToolbar(selection);
        } else {
          this.toolbar.style.display = "none";
        }
      });

      // Add format button handlers
      this.toolbar.querySelectorAll(".format-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const command = btn.classList.contains("bold-btn")
            ? "bold"
            : btn.classList.contains("italic-btn")
            ? "italic"
            : "underline";
          document.execCommand(command, false);
          btn.classList.toggle("active");
          this.hasUnsavedChanges = true;
        });
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
    }
  }

  setupDragAndDrop() {
    this.container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingBlock = document.querySelector(".dragging");
      if (!draggingBlock) return;

      const siblings = [
        ...this.container.querySelectorAll(".conspect-block:not(.dragging)"),
      ];
      const nextSibling = siblings.find((sibling) => {
        const rect = sibling.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        return e.clientY < centerY;
      });

      // Remove all drag-over indicators
      siblings.forEach((sibling) => sibling.classList.remove("drag-over"));

      if (nextSibling) {
        nextSibling.classList.add("drag-over");
        this.container.insertBefore(draggingBlock, nextSibling);
        this.hasUnsavedChanges = true;
      } else {
        this.container.appendChild(draggingBlock);
        this.hasUnsavedChanges = true;
      }
    });
  }

  createBlock(type = "line", content = "") {
    const block = document.createElement("div");
    block.className = "conspect-block";
    block.dataset.type = type;
    block.contentEditable = this.isEditMode;

    // Add placeholder attribute
    block.dataset.placeholder = this.getDefaultText(type);

    // Create a content div that will be editable
    const contentDiv = document.createElement("div");
    contentDiv.className = "block-content";
    contentDiv.contentEditable = this.isEditMode;

    if (content) {
      contentDiv.innerHTML = content;
    }

    block.appendChild(contentDiv);

    if (this.isEditMode) {
      // Add delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = `<img src="/assets/cross.svg" alt="×" class="delete-icon">`;
      deleteBtn.contentEditable = false;
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        block.remove();
        this.hasUnsavedChanges = true;
      };
      block.appendChild(deleteBtn);

      // Add selection handler
      block.addEventListener("mouseup", (e) => {
        const selection = window.getSelection();
        if (selection.toString().includes("×")) {
          const range = document.createRange();
          range.selectNodeContents(contentDiv);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      });

      // Add drag attributes
      block.draggable = true;
      block.addEventListener("dragstart", () => {
        block.classList.add("dragging");
      });

      block.addEventListener("dragend", () => {
        block.classList.remove("dragging");
        document
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
      });

      contentDiv.addEventListener("input", () => {
        this.hasUnsavedChanges = true;
      });
    }

    return block;
  }

  // Helper method to get default text
  getDefaultText(type) {
    switch (type) {
      case "line":
        return "Введіть заголовок...";
      case "date":
        return "Введіть дату...";
      case "text":
        return "Введіть текст...";
      default:
        return "";
    }
  }

  addBlock(type) {
    const block = this.createBlock(type);
    this.container.appendChild(block);

    if (this.isEditMode) {
      // Focus immediately
      requestAnimationFrame(() => {
        block.focus();
      });
    }
  }

  renderBlocks() {
    this.container.innerHTML = "";
    this.blocks.forEach((block) => {
      const element = this.createBlock(block.type, block.content);
      this.container.appendChild(element);
    });

    // Re-add the floating button after rendering blocks
    if (this.isEditMode) {
      this.addFloatingButton();
    }
  }

  async saveConspect() {
    const blocks = Array.from(this.container.children).map((block) => ({
      type: block.dataset.type,
      content: block.innerHTML.replace(/<button.*?<\/button>/g, "").trim(),
    }));

    const urlParams = new URLSearchParams(window.location.search);

    try {
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
          blocks: blocks,
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

  showBlockTypeSelector(block) {
    // Remove any existing selectors
    document
      .querySelectorAll(".block-type-selector")
      .forEach((el) => el.remove());

    const selector = document.createElement("div");
    selector.className = "block-type-selector";

    const types = [
      { type: "date", label: "" },
      { type: "text", label: "" },
      { type: "line", label: "" },
    ];

    types.forEach(({ type, label }) => {
      const option = document.createElement("div");
      option.className = `block-type-option ${type}`;
      option.title = label;
      option.onclick = () => {
        block.dataset.type = type;
        selector.remove();
        this.hasUnsavedChanges = true;
      };
      selector.appendChild(option);
    });

    block.appendChild(selector);

    // Close selector when clicking outside
    const closeSelector = (e) => {
      if (
        !selector.contains(e.target) &&
        !e.target.closest(".conspect-block::before")
      ) {
        selector.remove();
        document.removeEventListener("click", closeSelector);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeSelector);
    }, 0);
  }

  addFloatingButton() {
    // Clear existing button if any
    this.floatingBtnContainer.innerHTML = "";

    const addBtn = document.createElement("button");
    addBtn.className = "floating-add-btn";
    addBtn.textContent = "+ Додати блок";
    addBtn.onclick = () => this.addBlock("line");
    this.floatingBtnContainer.appendChild(addBtn);
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
      sizeSelect.value = "2"; // Default size
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

        // Make content non-editable in preview
        document.querySelectorAll(".block-content").forEach((block) => {
          block.contentEditable = "false";
        });
        // Make blocks non-editable and non-draggable
        document.querySelectorAll(".conspect-block").forEach((block) => {
          block.contentEditable = "false";
          block.draggable = false;
        });
      } else {
        this.previewBtn.querySelector("img").src = "/assets/eye.svg";
        this.previewBtn.querySelector("img").alt = "Перегляд";
        this.previewBtn.innerHTML = `<img src="/assets/eye.svg" alt="Перегляд" />Перегляд`;

        // Restore editability if in edit mode
        if (this.isEditMode) {
          document.querySelectorAll(".block-content").forEach((block) => {
            block.contentEditable = "true";
          });
          // Restore block editability and draggability
          document.querySelectorAll(".conspect-block").forEach((block) => {
            block.contentEditable = "true";
            block.draggable = true;
          });
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ConspectManager();
});
