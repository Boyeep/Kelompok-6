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

  function commitTasks() {
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
    commitTasks();
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

  const reorder = createTaskReorder(taskList, {
    getTasks: () => tasks,
    setTasks: (ordered) => { tasks = ordered; },
    save: commitTasks,
    render: renderTasks,
  });

  function createTaskElement(task) {
    return createTaskRow(task, {
      isNew: task.id === newlyAddedTaskId,
      reducedMotion,
      onDragStart: (row, event) => reorder.start(task.id, row, event),
      onDragEnd: (row) => reorder.end(row),
      onToggle: () => toggleComplete(task.id),
      onEdit: (text) => editTask(task.id, text),
      onDelete: () => deleteTask(task.id),
    });
  }

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
      commitTasks();
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
