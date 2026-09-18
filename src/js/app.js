// ============================================================
// To Do List - Starter
// Baca README.md untuk daftar lengkap fitur yang harus dibuat
// dan hint pengerjaannya sebelum mulai coding.
// ============================================================

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const clearCompletedButton = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");

// Struktur satu task: { id, text, completed }
// NOTE: "completed" sudah disiapkan di data model, tapi belum
// dipakai di mana pun. Itu tugas kamu di Fitur #1.
let tasks = [];
let nextId = 1;
let currentFilter = "all";
let draggedTaskId = null;

// TODO (Fitur #4 - Simpan ke localStorage):
// Saat aplikasi pertama kali dibuka, load "tasks" dari localStorage
// (kalau ada) sebelum renderTasks() dipanggil pertama kali di bawah.
// Hint: gunakan JSON.parse(localStorage.getItem("tasks")) dan cek
// null-nya sebelum dipakai.
const savedTasks = localStorage.getItem("tasks");
if (savedTasks !== null) {
  try {
    const parsedTasks = JSON.parse(savedTasks);
    tasks = Array.isArray(parsedTasks)
      ? parsedTasks
          .filter(
            (task) =>
              task &&
              typeof task === "object" &&
              Number.isFinite(Number(task.id)) &&
              typeof task.text === "string",
          )
          .map((task) => ({
            id: Number(task.id),
            text: task.text,
            completed: Boolean(task.completed),
          }))
      : [];
  } catch (error) {
    console.warn("Data tasks di localStorage tidak valid dan akan direset.", error);
    tasks = [];
  }
}

const savedTaskIds = tasks
  .map((task) => Number(task.id))
  .filter((id) => Number.isFinite(id));

if (savedTaskIds.length > 0) {
  nextId = Math.max(...savedTaskIds) + 1;
}

function saveToLocalStorage() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateTaskCounter() {
  const remaining = tasks.filter((task) => task.completed === false).length;
  const taskCounter = document.getElementById("task-counter");
  if (taskCounter) {
    taskCounter.textContent = `${remaining} task tersisa`;
  }
}

function renderTasks() {
  saveToLocalStorage();
  taskList.innerHTML = "";
  updateTaskCounter();

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "active") return task.completed === false;
    if (currentFilter === "completed") return task.completed === true;
    return true;
  });

  if (filteredTasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = tasks.length === 0
      ? "Belum ada task. Tambahkan satu di atas!"
      : currentFilter === "active"
        ? "Tidak ada task aktif."
        : "Belum ada task yang selesai.";
    taskList.appendChild(emptyState);
    return;
  }

  filteredTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;
    li.draggable = true;

    li.addEventListener("dragstart", (event) => {
      draggedTaskId = task.id;
      li.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(task.id));
    });

    li.addEventListener("dragend", () => {
      draggedTaskId = null;
      li.classList.remove("dragging");
      // The data order changes only on drop; rerender restores canceled drags.
      renderTasks();
    });

    // TODO (Fitur #1 - Tandai Selesai):
    // Tambahkan <input type="checkbox"> di sini yang mencerminkan
    // task.completed, dan tambahkan class "completed" pada `li`
    // kalau task.completed === true.
    if (task.completed) {
      li.classList.add("completed");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.setAttribute("aria-label", `Tandai "${task.text}" sebagai selesai`);
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleComplete(task.id));

    const span = document.createElement("span");
    span.className = "task-text";
    span.textContent = task.text;

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = '<span class="button-icon" aria-hidden="true">✎</span>';
    editBtn.setAttribute("aria-label", "Edit task");
    editBtn.title = "Edit task";
    editBtn.addEventListener("click", () => {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "edit-input";
      editInput.value = task.text;

      let isSaved = false;
      let isTabbing = false;
      const saveEdit = () => {
        if (isSaved) return;
        isSaved = true;
        editTask(task.id, editInput.value);

        // Perbarui teks saja agar blur tidak menghapus tombol yang sedang diklik.
        span.textContent = task.text;
        checkbox.setAttribute("aria-label", `Tandai "${task.text}" sebagai selesai`);
        li.replaceChild(span, editInput);
      };

      editInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          saveEdit();
        } else if (event.key === "Tab") {
          isTabbing = true;
        }
      });

      editInput.addEventListener("blur", (event) => {
        const nextControl = event.relatedTarget;
        if (!isTabbing && nextControl) {
          editTask(task.id, editInput.value);
          // Tunggu event klik agar perubahan tinggi baris tidak menggeser tombol tujuan.
          document.addEventListener("click", saveEdit, { capture: true, once: true });
        } else {
          saveEdit();
        }
      });
      li.replaceChild(editInput, span);
      editInput.focus();
      editInput.select();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = '<span class="button-icon" aria-hidden="true">×</span>';
    deleteBtn.setAttribute("aria-label", "Hapus task");
    deleteBtn.title = "Hapus task";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox); // checkbox buat fitur 1
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
  // TODO (Fitur #4 - Simpan ke localStorage):
  // Setiap kali renderTasks() dipanggil, data "tasks" sudah berubah,
  // jadi ini tempat yang pas untuk menyimpan ulang ke localStorage.
  // Hint: localStorage.setItem("tasks", JSON.stringify(tasks));
  saveToLocalStorage();
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task-item:not(.dragging)")
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return {
          offset: offset,
          element: child
        };
      } else {
        return closest;
      }
    },
    {
      offset: Number.NEGATIVE_INFINITY,
      element: null
    }
  ).element;
}

taskList.addEventListener("dragenter", (event) => {
  if (draggedTaskId === null || !taskList.querySelector(".dragging")) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
});

taskList.addEventListener("dragover", (event) => {
  const dragging = taskList.querySelector(".dragging");
  if (draggedTaskId === null || !dragging) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  const afterElement = getDragAfterElement(taskList, event.clientY);

  if (afterElement == null) {
    if (dragging !== taskList.lastElementChild) taskList.appendChild(dragging);
  } else {
    if (dragging.nextElementSibling !== afterElement) {
      taskList.insertBefore(dragging, afterElement);
    }
  }
});

taskList.addEventListener("drop", (event) => {
  if (draggedTaskId === null || !taskList.querySelector(".dragging")) return;
  event.preventDefault();

  const newOrder = [...taskList.querySelectorAll(".task-item")].map((li) =>
    Number(li.dataset.id),
  );
  const visibleIds = new Set(newOrder);
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  let visibleIndex = 0;

  // Reorder visible slots only, preserving every hidden task's position.
  tasks = tasks.map((task) =>
    visibleIds.has(task.id)
      ? tasksById.get(newOrder[visibleIndex++])
      : task,
  );
  saveToLocalStorage();
});

function addTask(text) {
  const trimmed = text.trim();
  if (trimmed === "") return;

  tasks.push({
    id: nextId++,
    text: trimmed,
    completed: false,
  });

  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  renderTasks();
}

// TODO (Fitur #1 - Tandai Selesai):
// Buat function toggleComplete(id) yang membalik nilai task.completed
// untuk task dengan id yang cocok, lalu panggil renderTasks().
function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    renderTasks();
  }
}

function editTask(id, newText) {
  const trimmed = newText.trim();
  if (trimmed === "") return;

  const task = tasks.find((task) => task.id === id);
  if (task) {
    task.text = trimmed;
    saveToLocalStorage();
    updateTaskCounter();
  }
}

function clearCompleted() {
  tasks = tasks.filter((task) => task.completed !== true);
  renderTasks();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

clearCompletedButton.addEventListener("click", clearCompleted);

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
  taskInput.focus();
});

// theme toggle
const themeToggle = document.getElementById("theme-toggle");

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
}

function updateThemeToggle() {
  const isDarkMode = document.body.classList.contains("dark");
  const label = isDarkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap";
  themeToggle.innerHTML = `<span class="button-icon" aria-hidden="true">${isDarkMode ? "☀" : "☾"}</span>`;
  themeToggle.setAttribute("aria-label", label);
  themeToggle.title = label;
}

updateThemeToggle();

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDarkMode = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  updateThemeToggle();
});

renderTasks();
