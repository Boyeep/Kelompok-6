// Calendar UI reads tasks across groups; it never owns or changes board data.
function createBoardCalendar({ state, cards, focusItem, reduced }) {
  const $ = (selector) => document.querySelector(selector);
  const dialog = $("#calendar-dialog");
  const grid = $("#calendar-grid");
  const heading = $("#calendar-month");
  const dayPanel = $("#calendar-day-view");
  const motion = createCalendarMotion(reduced);
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const monthStamp = (date) => date.getFullYear() * 12 + date.getMonth();
  const groupName = (id) => state.groups.find((entry) => entry.id === id).name;
  let selectedDate = dateKey(new Date());
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let renderedMonthStamp = null;
  let renderedDayKey = null;

  function entries() {
    const allGroups = $("#calendar-scope").value === "all";
    return state.cards
      .filter((card) => allGroups || card.groupId === state.activeGroupId)
      .flatMap((card) => card.tasks.map((task) => ({ card, task })));
  }

  function chooseDate(date, key) {
    const direction = Math.sign(key.localeCompare(selectedDate));
    selectedDate = key;
    if (monthStamp(date) !== monthStamp(calendarMonth)) {
      calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    render({ direction });
    [...grid.children].find((cell) => cell.dataset.date === key)?.focus({ preventScroll: true });
  }

  function renderMonth(allEntries, animate) {
    const stamp = monthStamp(calendarMonth);
    const changed = stamp !== renderedMonthStamp;
    const direction = renderedMonthStamp === null ? 0 : Math.sign(stamp - renderedMonthStamp);
    const previousGrid = changed ? motion.capture(grid, animate && renderedMonthStamp !== null) : null;
    const previousHeading = changed ? motion.capture(heading, animate && renderedMonthStamp !== null) : null;
    if (changed) {
      heading.textContent = calendarMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      grid.replaceChildren();
    }

    const counts = new Map();
    allEntries.forEach(({ task }) => {
      if (task.dueDate) counts.set(task.dueDate, (counts.get(task.dueDate) || 0) + 1);
    });
    const start = new Date(calendarMonth);
    start.setDate(1 - (start.getDay() + 6) % 7);
    for (let index = 0; index < 42; index++) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = dateKey(date);
      const count = counts.get(key) || 0;
      let button = grid.children[index];
      if (!button) {
        button = document.createElement("button");
        button.className = "calendar-cell";
        const number = document.createElement("span");
        number.textContent = date.getDate();
        button.append(number, document.createElement("small"));
        button.addEventListener("click", () => chooseDate(date, key));
        grid.append(button);
      }
      button.dataset.date = key;
      button.classList.toggle("today", key === dateKey(new Date()));
      button.classList.toggle("selected", key === selectedDate);
      button.classList.toggle("outside", date.getMonth() !== calendarMonth.getMonth());
      button.setAttribute("aria-pressed", String(key === selectedDate));
      button.setAttribute("aria-label", `${date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}, ${count} task`);
      button.lastElementChild.textContent = count ? `${count} task` : "";
    }
    renderedMonthStamp = stamp;
    motion.transition(grid, previousGrid, direction);
    motion.transition(heading, previousHeading, direction);
  }

  function focusTask(card, task) {
    dialog.close();
    focusItem(card);
    const paper = cards.get(card.id).element;
    paper.querySelector('[data-filter="all"]').click();
    const row = [...paper.querySelectorAll(".task-item")]
      .find((item) => Number(item.dataset.id) === task.id);
    if (!row) return;
    const list = paper.querySelector(".task-list");
    list.scrollTo({
      top: row.offsetTop - list.offsetTop,
      behavior: reduced.matches ? "instant" : "smooth",
    });
    row.querySelector(".task-checkbox").focus({ preventScroll: true });
  }

  function renderDay(allEntries, animate, direction) {
    const dated = allEntries.filter(({ task }) => task.dueDate === selectedDate);
    const undated = allEntries.filter(({ task }) => !task.dueDate).length;
    const dayKey = JSON.stringify([
      selectedDate, undated,
      dated.map(({ card, task }) => [card.id, task.id, task.text, task.completed, card.title, groupName(card.groupId)]),
    ]);
    if (dayKey === renderedDayKey) return;

    const previous = motion.capture(dayPanel, animate && renderedDayKey !== null);
    const [year, month, day] = selectedDate.split("-").map(Number);
    $("#calendar-day-title").textContent = new Date(year, month - 1, day)
      .toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
    const list = $("#calendar-tasks");
    list.replaceChildren();
    if (!dated.length) {
      const empty = document.createElement("li");
      empty.className = "calendar-note";
      empty.textContent = "Tidak ada task jatuh tempo pada tanggal ini.";
      list.append(empty);
    }
    dated.forEach(({ card, task }) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.className = "calendar-task";
      button.classList.toggle("completed", task.completed);
      const text = document.createElement("span");
      text.textContent = task.text;
      const source = document.createElement("small");
      source.textContent = `${groupName(card.groupId)} / ${card.title} · ${task.completed ? "Selesai" : "Aktif"}`;
      button.append(text, source);
      button.addEventListener("click", () => focusTask(card, task));
      li.append(button);
      list.append(li);
    });
    list.scrollTop = 0;
    $("#calendar-undated").textContent = undated
      ? `${undated} task tanpa tanggal jatuh tempo belum ditampilkan di kalender.` : "";
    renderedDayKey = dayKey;
    motion.transition(dayPanel, previous, direction, "Y", true);
  }

  function render({ direction = 0 } = {}) {
    const allEntries = entries();
    const animate = dialog.open && !reduced.matches;
    renderMonth(allEntries, animate);
    renderDay(allEntries, animate, direction);
  }

  $("#open-calendar").addEventListener("click", () => { render(); dialog.showModal(); });
  $("#calendar-scope").addEventListener("change", render);
  $("#previous-month").addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    render();
  });
  $("#next-month").addEventListener("click", () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    render();
  });
  $("#calendar-today").addEventListener("click", () => {
    const today = new Date();
    const previous = selectedDate;
    selectedDate = dateKey(today);
    calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    render({ direction: Math.sign(selectedDate.localeCompare(previous)) });
  });
  dialog.addEventListener("close", motion.cancelAll);
  reduced.addEventListener("change", () => { if (reduced.matches) motion.cancelAll(); });
  return { render };
}
