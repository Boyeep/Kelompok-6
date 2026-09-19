// A task row owns its controls; the controller supplies mutations and reorder actions.
function createTaskRow(task, actions) {
  const row = document.createElement("li");
  row.className = "task-item";
  row.dataset.id = task.id;
  row.draggable = true;
  row.addEventListener("dragstart", (event) => actions.onDragStart(row, event));
  row.addEventListener("dragend", () => actions.onDragEnd(row));

  if (actions.isNew && !actions.reducedMotion.matches) {
    row.classList.add("adding");
    requestAnimationFrame(() => requestAnimationFrame(() => row.classList.remove("adding")));
  }
  row.classList.toggle("completed", task.completed);

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.setAttribute("aria-label", `Tandai "${task.text}" sebagai selesai`);
  checkbox.checked = task.completed;
  checkbox.addEventListener("change", actions.onToggle);

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  const dueDate = document.createElement("span");
  dueDate.className = "task-due-date";
  if (task.dueDate) {
    const parts = task.dueDate.split("-");
    dueDate.textContent = parts.length === 3
      ? `${parts[2]}/${parts[1]}/${parts[0]}`
      : task.dueDate;
  }

  const editButton = document.createElement("button");
  editButton.className = "edit-btn";
  editButton.innerHTML = '<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 12-12 4 4-12 12H4zM14 6l4 4"/></svg>';
  editButton.setAttribute("aria-label", "Edit task");
  editButton.title = "Edit task";
  editButton.addEventListener("click", () => startEditing());

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-btn";
  deleteButton.innerHTML = '<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
  deleteButton.setAttribute("aria-label", "Hapus task");
  deleteButton.title = "Hapus task";
  deleteButton.addEventListener("click", actions.onDelete);

  function startEditing() {
    if (row.querySelector(".edit-input")) return;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.setAttribute("aria-label", "Edit nama task");
    input.value = task.text;
    let saved = false;
    let tabbing = false;

    function saveEdit() {
      if (saved) return;
      saved = true;
      actions.onEdit(input.value);
      text.textContent = task.text;
      checkbox.setAttribute("aria-label", `Tandai "${task.text}" sebagai selesai`);
      row.replaceChild(text, input);
      text.classList.add("edit-saved");
      text.addEventListener("animationend", () => text.classList.remove("edit-saved"), { once: true });
    }

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { event.preventDefault(); saveEdit(); }
      else if (event.key === "Tab") tabbing = true;
    });
    input.addEventListener("blur", (event) => {
      if (!tabbing && event.relatedTarget) {
        actions.onEdit(input.value);
        document.addEventListener("click", saveEdit, { capture: true, once: true });
      } else saveEdit();
    });
    row.replaceChild(input, text);
    input.focus();
    input.select();
  }

  row.append(checkbox, text);
  if (task.dueDate) row.append(dueDate);
  row.append(editButton, deleteButton);
  return row;
}

// Keep drag order and filtered task order in one place.
function createTaskReorder(taskList, { getTasks, setTasks, save, render }) {
  let draggedId = null;

  function start(id, row, event) {
    draggedId = id;
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
  }
  function end(row) {
    draggedId = null;
    row.classList.remove("dragging");
    render();
  }
  function insertionPoint(y) {
    let nearest = null;
    let nearestOffset = Number.NEGATIVE_INFINITY;
    taskList.querySelectorAll(".task-item:not(.dragging)").forEach((row) => {
      const box = row.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > nearestOffset) {
        nearest = row;
        nearestOffset = offset;
      }
    });
    return nearest;
  }
  function activeRow() { return draggedId === null ? null : taskList.querySelector(".dragging"); }

  taskList.addEventListener("dragenter", (event) => {
    if (!activeRow()) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });
  taskList.addEventListener("dragover", (event) => {
    const dragging = activeRow();
    if (!dragging) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const after = insertionPoint(event.clientY);
    if (!after) {
      if (dragging !== taskList.lastElementChild) taskList.append(dragging);
    } else if (dragging.nextElementSibling !== after) {
      taskList.insertBefore(dragging, after);
    }
  });
  taskList.addEventListener("drop", (event) => {
    if (!activeRow()) return;
    event.preventDefault();
    const order = [...taskList.querySelectorAll(".task-item")].map((row) => Number(row.dataset.id));
    const visibleIds = new Set(order);
    const tasks = getTasks();
    const byId = new Map(tasks.map((task) => [task.id, task]));
    let visibleIndex = 0;
    setTasks(tasks.map((task) => visibleIds.has(task.id) ? byId.get(order[visibleIndex++]) : task));
    save();
  });
  return { start, end };
}
