// Each paper owns its tasks, filters, counters, and animations.
function createTodoController(paper, card, onChange) {
  const taskForm = paper.querySelector(".task-form");
  const taskInput = paper.querySelector(".task-input");
  const taskList = paper.querySelector(".task-list");
  const dueDateInput = paper.querySelector(".due-date-input");
  const clearCompletedButton = paper.querySelector(".clear-completed");
  const filterButtons = paper.querySelectorAll(".filter-btn");
  const counterNumber = paper.querySelector(".counter-number");
  const counterAnnouncement = paper.querySelector(".counter-announcement");

  let tasks = card.tasks;
  let nextId = 1;
  let currentFilter = "all";
  let newlyAddedTaskId = null;
  let draggedTaskId = null;
  let taskListResizeAnimation = null;
  let hasRenderedTasks = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const taskMotion = { duration: 300, easing: "cubic-bezier(0.4, 0, 0.2, 1)" };
  const taskMoveAnimations = new Map();
  const removingTaskIds = new Set();
  let counterAnimations = [];
  let displayedRemaining = null;
  let disposed = false;
  const removalTimers = new Set();

  const savedTaskIds = tasks
    .map((task) => Number(task.id))
    .filter((id) => Number.isFinite(id));

  if (savedTaskIds.length > 0) {
    nextId = savedTaskIds.reduce((max, id) => Math.max(max, id), 0) + 1;
  }

  function saveToLocalStorage() {
    if (disposed) return;
    card.tasks = tasks; onChange();
  }

  function updateTaskCounter() {
    const remaining = tasks.filter((task) => task.completed === false).length;
    if (remaining === displayedRemaining) return;

    const previousRemaining = displayedRemaining;
    displayedRemaining = remaining;
    counterAnnouncement.textContent = `${remaining} task tersisa`;

    const outgoing = counterNumber.querySelector(".counter-digit:not(.counter-digit--outgoing)");
    const outgoingStyle = getComputedStyle(outgoing);
    const outgoingTransform = outgoingStyle.transform;
    const outgoingOpacity = outgoingStyle.opacity;
    counterAnimations.forEach((animation) => animation.cancel());
    counterAnimations = [];

    const incoming = document.createElement("span");
    incoming.className = "counter-digit";
    incoming.textContent = remaining;
    counterNumber.dataset.value = remaining;
    counterNumber.style.minWidth = `${String(remaining).length}ch`;

    if (previousRemaining === null || reducedMotion.matches) {
      counterNumber.replaceChildren(incoming);
      return;
    }

    const direction = remaining > previousRemaining ? 1 : -1;
    outgoing.classList.add("counter-digit--outgoing");
    counterNumber.replaceChildren(outgoing, incoming);
    const exitAnimation = outgoing.animate(
      [
        { transform: outgoingTransform, opacity: outgoingOpacity },
        { transform: `translateY(${direction * 100}%)`, opacity: 0 },
      ],
      taskMotion,
    );
    const enterAnimation = incoming.animate(
      [
        { transform: `translateY(${-direction * 100}%)`, opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      taskMotion,
    );
    counterAnimations = [exitAnimation, enterAnimation];
    enterAnimation.onfinish = () => {
      outgoing.remove();
      counterAnimations = [];
    };
  }

  function renderTasks() {
    if (disposed) return;
    // Rectangles include the board zoom and the paper's lift scale.
    const paperScale = (Number(getComputedStyle(paper).scale) || 1) * window.boardWorkspace.zoom;
    const previousBox = taskList.getBoundingClientRect();
    const previousHeight = previousBox.height / paperScale;
    const previousPositions = new Map(
      [...taskList.querySelectorAll(".task-item")].map((item) => [
        Number(item.dataset.id),
        (item.getBoundingClientRect().top - previousBox.top) / paperScale,
      ]),
    );
    taskMoveAnimations.forEach((animation) => animation.cancel());
    taskMoveAnimations.clear();

    if (taskListResizeAnimation) {
      taskListResizeAnimation.cancel();
      taskListResizeAnimation = null;
    }
    taskList.classList.remove("resizing");

    renderTaskList();

    const nextHeight = taskList.getBoundingClientRect().height / paperScale;
    if (hasRenderedTasks && !reducedMotion.matches && previousHeight !== nextHeight) {
      taskList.classList.add("resizing");
      taskListResizeAnimation = taskList.animate(
        [{ height: `${previousHeight}px` }, { height: `${nextHeight}px` }],
        taskMotion,
      );
      taskListResizeAnimation.onfinish = () => {
        taskList.classList.remove("resizing");
        taskListResizeAnimation = null;
      };
    }

    if (!reducedMotion.matches) {
      const listTop = taskList.getBoundingClientRect().top;
      taskList.querySelectorAll(".task-item").forEach((item) => {
        const id = Number(item.dataset.id);
        if (!previousPositions.has(id)) return;
        const offset = previousPositions.get(id) - (item.getBoundingClientRect().top - listTop) / paperScale;
        if (Math.abs(offset) < 0.5) return;

        const animation = item.animate(
          [{ translate: `0 ${offset}px` }, { translate: "0 0" }],
          taskMotion,
        );
        taskMoveAnimations.set(id, animation);
        animation.onfinish = () => taskMoveAnimations.delete(id);
      });
    }

    hasRenderedTasks = true;
  }

  function renderTaskList() {
    saveToLocalStorage();
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
      taskList.replaceChildren(emptyState);
      return;
    }

    const existingItems = new Map(
      [...taskList.querySelectorAll(".task-item")].map((item) => [Number(item.dataset.id), item]),
    );
    taskList.querySelector(".empty-state")?.remove();

    filteredTasks.forEach((task, index) => {
      const item = existingItems.get(task.id) || createTaskElement(task);
      item.classList.toggle("completed", task.completed);
      const checkbox = item.querySelector(".task-checkbox");
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `Tandai "${task.text}" sebagai selesai`);
      const text = item.querySelector(".task-text");
      if (text) text.textContent = task.text;

      if (taskList.children[index] !== item) {
        taskList.insertBefore(item, taskList.children[index] || null);
      }
      existingItems.delete(task.id);
    });
    existingItems.forEach((item) => item.remove());
  }

  function createTaskElement(task) {
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
      renderTasks();
    });

    if (task.id === newlyAddedTaskId && !reducedMotion.matches) {
      li.classList.add("adding");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => li.classList.remove("adding"));
      });
    }

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

    const dueDateSpan = document.createElement("span");
    dueDateSpan.className = "task-due-date";
    if (task.dueDate) {
      dueDateSpan.textContent = formatDueDate(task.dueDate);
    }

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = '<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 12-12 4 4-12 12H4zM14 6l4 4"/></svg>';
    editBtn.setAttribute("aria-label", "Edit task");
    editBtn.title = "Edit task";
    editBtn.addEventListener("click", () => {
      const editInput = document.createElement("input");
      if (li.querySelector(".edit-input")) return; editInput.type = "text"; editInput.setAttribute("aria-label", "Edit nama task");
      editInput.className = "edit-input";
      editInput.value = task.text;

      let isSaved = false;
      let isTabbing = false;
      const saveEdit = () => {
        if (isSaved) return;
        isSaved = true;

        editTask(task.id, editInput.value);

        span.textContent = task.text;
        checkbox.setAttribute(
          "aria-label",
          `Tandai "${task.text}" sebagai selesai`,
        );

        li.replaceChild(span, editInput);

        span.classList.add("edit-saved");

        span.addEventListener(
          "animationend",
          () => {
            span.classList.remove("edit-saved");
          },
          { once: true },
        );
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
    deleteBtn.innerHTML = '<svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
    deleteBtn.setAttribute("aria-label", "Hapus task");
    deleteBtn.title = "Hapus task";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(checkbox); // checkbox buat fitur 1
    li.appendChild(span);
    if (task.dueDate) li.appendChild(dueDateSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    return li;
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

    tasks = tasks.map((task) =>
      visibleIds.has(task.id)
        ? tasksById.get(newOrder[visibleIndex++])
        : task,
    );
    saveToLocalStorage();
  });

  function addTask(text, dueDate = "") {
    const trimmed = text.trim();
    if (trimmed === "") return;

    newlyAddedTaskId = nextId;

    tasks.push({
      id: nextId++,
      text: trimmed,
      completed: false,
      dueDate,
    });

    renderTasks();

    newlyAddedTaskId = null;
  }

  function deleteTask(id) {
    if (removingTaskIds.has(id)) return;
    removingTaskIds.add(id);
    const li = taskList.querySelector(`[data-id="${id}"]`);
    const remove = () => {
      tasks = tasks.filter((task) => task.id !== id);
      removingTaskIds.delete(id);
      renderTasks();
    };

    if (!li || reducedMotion.matches) {
      remove();
      return;
    }

    li.classList.add("removing");

    scheduleRemoval(remove);
  }

  function formatDueDate(dateString) {
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function toggleComplete(id) {
    if (removingTaskIds.has(id)) return;
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
    const completedIds = new Set(
      tasks.filter((task) => task.completed && !removingTaskIds.has(task.id)).map((task) => task.id),
    );
    if (completedIds.size === 0) return;
    completedIds.forEach((id) => removingTaskIds.add(id));

    const removeCompleted = () => {
      tasks = tasks.filter((task) => !completedIds.has(task.id));
      completedIds.forEach((id) => removingTaskIds.delete(id));
      renderTasks();
    };

    const completedItems = taskList.querySelectorAll(
      ".task-item.completed"
    );

    if (completedItems.length === 0 || reducedMotion.matches) {
      removeCompleted();
      return;
    }

    completedItems.forEach((li) => {
      li.classList.add("removing");
    });

    scheduleRemoval(removeCompleted);
  }

  function scheduleRemoval(callback) {
    const timer = setTimeout(() => { removalTimers.delete(timer); callback(); }, taskMotion.duration);
    removalTimers.add(timer);
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
    addTask(taskInput.value, dueDateInput.value);
    taskInput.value = "";
    dueDateInput.value = "";
    taskInput.focus();
  });


  renderTasks();
  return {
    render: renderTasks,
    destroy() {
      disposed = true;
      removalTimers.forEach(clearTimeout);
      taskListResizeAnimation?.cancel();
      taskMoveAnimations.forEach((animation) => animation.cancel());
      counterAnimations.forEach((animation) => animation.cancel());
    },
  };
}
