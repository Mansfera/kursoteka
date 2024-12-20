class ConspectManager {
  constructor() {
    this.isEditMode = false;
    this.blocks = [];
    this.container = document.querySelector(".conspect-content");
    this.editorControls = document.getElementById("editor-controls");
    this.nameInput = document.getElementById("conspect-name");
    this.idInput = document.getElementById("conspect-id");
    this.draggedBlock = null;
    this.conspectTitle = document.querySelector('.conspect-title');
    this.deleteConspectBtn = document.getElementById('delete-conspect-btn');
    this.setupEventListeners();
    this.init();
    if (this.isEditMode) {
      this.setupDragAndDrop();
    }
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
        `/api/getConspectData?course=${course}&blockId=${blockId}&testId=${testId}&conspectId=${conspectId}&auth_key=${auth_key}`
      );
      if (!response.ok) throw new Error("Failed to load conspect");

      const data = await response.json();
      this.blocks = data.blocks || [];
      this.nameInput.value = data.name || "";
      this.idInput.value = data.id || "";
      this.conspectTitle.textContent = data.name || "Без назви";
      this.renderBlocks();
    } catch (error) {
      console.error("Error loading conspect:", error);
    }
  }

  setupEventListeners() {
    if (this.isEditMode) {
      this.editorControls.addEventListener("click", (e) => {
        const button = e.target.closest(".editor-btn");
        if (button) {
          if (!button.classList.contains("save-btn")) {
            const type = button.dataset.type;
            this.addBlock(type);
          } else {
            this.saveConspect();
          }
        }
      });
    }
  }

  setupDragAndDrop() {
    this.container.addEventListener('dragover', e => {
      e.preventDefault();
      const draggingBlock = document.querySelector('.dragging');
      if (!draggingBlock) return;
      
      const siblings = [...this.container.querySelectorAll('.conspect-block:not(.dragging)')];
      const nextSibling = siblings.find(sibling => {
        const rect = sibling.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        return e.clientY < centerY;
      });

      // Remove all drag-over indicators
      siblings.forEach(sibling => sibling.classList.remove('drag-over'));
      
      if (nextSibling) {
        nextSibling.classList.add('drag-over');
        this.container.insertBefore(draggingBlock, nextSibling);
      } else {
        this.container.appendChild(draggingBlock);
      }
    });
  }

  createBlock(type, content = "") {
    const block = document.createElement("div");
    block.className = "conspect-block";
    block.dataset.type = type;
    block.contentEditable = this.isEditMode;
    
    if (content) {
      block.innerHTML = content;
    } else {
      switch (type) {
        case "title":
          block.textContent = "Тема або розділ конспекту...";
          break;
        case "date":
          block.textContent = "Дата події або період...";
          break;
        case "text":
          block.textContent = "Основний текст конспекту...";
          break;
      }
    }

    if (this.isEditMode) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = `<img src="/assets/cross.svg" alt="×" class="delete-icon">`;
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        block.remove();
      };
      block.appendChild(deleteBtn);

      block.addEventListener("focus", function () {
        if (
          [
            "Тема або розділ конспекту...",
            "Дата події або період...",
            "Основний текст конспекту...",
          ].includes(this.textContent)
        ) {
          this.textContent = "";
        }
      });

      block.addEventListener("blur", function () {
        if (!this.textContent.trim()) {
          switch (this.dataset.type) {
            case "title":
              this.textContent = "Тема або розділ конспекту...";
              break;
            case "date":
              this.textContent = "Дата події або період...";
              break;
            case "text":
              this.textContent = "Основний текст конспекту...";
              break;
          }
        }
      });

      // Add drag attributes
      block.draggable = true;
      block.addEventListener('dragstart', () => {
        block.classList.add('dragging');
      });
      
      block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
        // Remove any remaining drag-over indicators
        document.querySelectorAll('.drag-over').forEach(el => 
          el.classList.remove('drag-over')
        );
      });
    }

    return block;
  }

  addBlock(type) {
    const block = this.createBlock(type);
    this.container.appendChild(block);
    if (this.isEditMode) {
      block.focus();
    }
  }

  renderBlocks() {
    this.container.innerHTML = "";
    this.blocks.forEach((block) => {
      const element = this.createBlock(block.type, block.content);
      this.container.appendChild(element);
    });
  }

  async saveConspect() {
    const blocks = Array.from(this.container.children).map(block => ({
      type: block.dataset.type,
      content: block.innerHTML.replace(/<button.*?<\/button>/g, "").trim(),
    }));

    const urlParams = new URLSearchParams(window.location.search);

    try {
      const response = await fetch("/api/saveConspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_key,
          course: urlParams.get("course"),
          blockId: urlParams.get("blockId"),
          testId: urlParams.get("testId"),
          conspectId: this.idInput.value,
          name: this.nameInput.value,
          blocks: blocks,
        }),
      });

      if (!response.ok) throw new Error("Failed to save conspect");
      alert("Конспект збережено успішно!");
    } catch (error) {
      console.error("Error saving conspect:", error);
      alert("Помилка при збереженні конспекту");
    }
  }

  setupDeleteConspect(course, blockId, testId, conspectId) {
    this.deleteConspectBtn.addEventListener('click', async () => {
      if (confirm('Ви впевнені, що хочете видалити цей конспект?')) {
        try {
          const response = await fetch('/api/deleteConspect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              auth_key,
              course,
              blockId,
              testId,
              conspectId
            })
          });

          if (!response.ok) throw new Error('Failed to delete conspect');
          
          alert('Конспект видалено успішно!');
          window.close(); // Close the window after deletion
        } catch (error) {
          console.error('Error deleting conspect:', error);
          alert('Помилка при видаленні конспекту');
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ConspectManager();
});
