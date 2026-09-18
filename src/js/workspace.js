(() => {
  "use strict";
  const STORAGE_KEY = "my-todo-board-v1";
  const $ = (selector) => document.querySelector(selector);
  const viewport = $("#board-viewport");
  const world = $("#board-world");
  const cardLayer = $("#card-layer");
  const assetLayer = $("#asset-layer");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const contentTransitions = new Map();
  const contentMotion = { duration: 240, easing: "cubic-bezier(.22, 1, .36, 1)" };
  function cancelContentTransition(target) {
    const transition = contentTransitions.get(target);
    if (!transition) return;
    contentTransitions.delete(target);
    transition.animations.forEach((animation) => animation.cancel());
    transition.snapshot.remove();
    target.style.overflow = transition.overflow;
  }
  function captureContent(target, animate) {
    let previous = null;
    if (animate && !reduced.matches) {
      const style = getComputedStyle(target);
      const snapshot = target.cloneNode(true);
      snapshot.removeAttribute("id");
      snapshot.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      snapshot.removeAttribute("aria-live");
      snapshot.querySelectorAll("[aria-live]").forEach((node) => node.removeAttribute("aria-live"));
      snapshot.classList.add("motion-snapshot");
      snapshot.setAttribute("aria-hidden", "true"); snapshot.inert = true;
      const scrollTops = [target, ...target.querySelectorAll("*")].map((node) => node.scrollTop);
      previous = { snapshot, height: target.offsetHeight, transform: style.transform, opacity: style.opacity, scrollTops };
    }
    // Capture the visible state before canceling, so rapid navigation stays continuous.
    cancelContentTransition(target);
    return previous;
  }
  function transitionContent(target, previous, direction, axis = "X", resize = false) {
    if (!previous || reduced.matches) return;
    const nextHeight = target.offsetHeight;
    const snapshot = previous.snapshot;
    snapshot.style.height = `${previous.height}px`;
    target.parentElement.append(snapshot);
    [snapshot, ...snapshot.querySelectorAll("*")].forEach((node, index) => { node.scrollTop = previous.scrollTops[index]; });
    const distance = axis === "X" ? 18 : 10;
    const incoming = { transform: `translate${axis}(${direction * distance}px)`, opacity: 0 };
    const settled = { transform: "translate(0, 0)", opacity: 1 };
    const overflow = target.style.overflow;
    if (resize && Math.abs(nextHeight - previous.height) > 1) {
      incoming.height = `${previous.height}px`; settled.height = `${nextHeight}px`;
      target.style.overflow = "clip";
    }
    const exit = snapshot.animate([
      { transform: previous.transform, opacity: previous.opacity },
      { transform: `translate${axis}(${-direction * distance}px)`, opacity: 0 },
    ], { ...contentMotion, duration: 180, fill: "both" });
    const enter = target.animate([incoming, settled], { ...contentMotion, fill: "both" });
    const transition = { snapshot, animations: [exit, enter], overflow };
    contentTransitions.set(target, transition);
    enter.onfinish = () => { if (contentTransitions.get(target) === transition) cancelContentTransition(target); };
  }
  const catalog = new Map(window.BOARD_ASSETS.map((asset) => [asset.id, asset]));
  const cards = new Map();
  const assets = new Map();
  const uid = () => globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (number, min, max) => Math.min(max, Math.max(min, number));
  let toastTimer;
  function notify(message, persistent = false) {
    clearTimeout(toastTimer);
    $("#save-status").textContent = message;
    $("#save-status").hidden = false;
    if (!persistent) toastTimer = setTimeout(() => { $("#save-status").hidden = true; }, 3400);
  }
  function normalizeTasks(value) {
    const used = new Set();
    let next = 1;
    return (Array.isArray(value) ? value : []).filter((task) => task && typeof task.text === "string").map((task) => {
      let id = finite(task.id, next);
      if (used.has(id)) id = next;
      used.add(id); next = Math.max(next, id + 1);
      return { id, text: task.text, completed: Boolean(task.completed), dueDate: typeof task.dueDate === "string" ? task.dueDate : "" };
    });
  }
  function load() {
    let parsed;
    try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { notify("Data papan tidak terbaca. Task lama tetap dipertahankan.", true); }
    if (parsed?.version === 1 && Array.isArray(parsed.groups) && parsed.groups.length) {
      const groupIds = new Set();
      const groups = parsed.groups.filter((group) => group && typeof group.id === "string" && !groupIds.has(group.id) && groupIds.add(group.id)).map((group) => ({
        id: group.id, name: typeof group.name === "string" ? group.name : "Grup saya",
        camera: { x: finite(group.camera?.x), y: finite(group.camera?.y), zoom: clamp(finite(group.camera?.zoom, 1), .5, 100 / 60) },
      }));
      if (groups.length) {
        const itemIds = new Set();
        const validItems = (list) => (Array.isArray(list) ? list : []).filter((item) => item && typeof item.id === "string" && groupIds.has(item.groupId) && !itemIds.has(item.id) && itemIds.add(item.id));
        const position = (item) => ({ id: item.id, groupId: item.groupId, x: finite(item.x, 48), y: finite(item.y, 56), z: finite(item.z, 1) });
        return { version: 1, groups, activeGroupId: groupIds.has(parsed.activeGroupId) ? parsed.activeGroupId : groups[0].id,
          cards: validItems(parsed.cards).map((card) => ({ ...position(card), title: typeof card.title === "string" ? card.title : "My To Do List", tasks: normalizeTasks(card.tasks) })),
          assets: validItems(parsed.assets).filter((asset) => catalog.has(asset.assetId)).map((asset) => ({ ...position(asset), assetId: asset.assetId })),
        };
      }
    }
    let legacy = [];
    try { legacy = normalizeTasks(JSON.parse(localStorage.getItem("tasks"))); } catch { /* Leave the legacy storage untouched. */ }
    const groupId = uid();
    return { version: 1, activeGroupId: groupId, groups: [{ id: groupId, name: "Grup saya", camera: { x: 0, y: 0, zoom: 1 } }], cards: [{ id: uid(), groupId, title: "My To Do List", x: 48, y: 56, z: 1, tasks: legacy }], assets: [] };
  }
  let hadSavedBoard = false;
  try { hadSavedBoard = Boolean(localStorage.getItem(STORAGE_KEY)); } catch { /* No persistence available. */ }
  const state = load();
  let cameraAnimation = null;
  let groupTransition = null;
  let stack = Math.max(1, ...state.cards.concat(state.assets).map((item) => item.z));
  let saveTimer;
  const group = () => state.groups.find((item) => item.id === state.activeGroupId);
  const camera = () => group().camera;
  function viewBounds() {
    const box = viewport.getBoundingClientRect();
    const origin = getComputedStyle(world);
    const x = parseFloat(origin.left), y = parseFloat(origin.top);
    return { left: box.left + x, top: box.top + y, width: box.width - x, height: box.height - y };
  }
  function save() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { notify("Penyimpanan perangkat penuh atau tidak tersedia. Perubahan belum tersimpan.", true); }
  }
  function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 150); }
  const board = window.boardWorkspace = {
    get zoom() { return camera().zoom; },
    save, focus: focusItem, stopNavigation,
    front(item, element) {
      if (item.z === stack) return;
      item.z = ++stack;
      element.style.zIndex = item.z;
      queueSave();
    },
  };
  function stopCameraMotion(keepView = false) {
    if (!cameraAnimation) return;
    const visible = keepView ? new DOMMatrixReadOnly(getComputedStyle(world).transform) : null;
    cameraAnimation.cancel(); cameraAnimation = null;
    if (visible) {
      Object.assign(camera(), { x: visible.e, y: visible.f, zoom: visible.a });
      applyCamera(); save();
    }
  }
  function stopGroupMotion() {
    if (!groupTransition) return;
    groupTransition.animations.forEach((animation) => animation.cancel());
    groupTransition.ghost.remove(); groupTransition = null;
  }
  function stopNavigation(keepView = true) { stopCameraMotion(keepView); stopGroupMotion(); }
  function captureGroupView() {
    const ghost = document.createElement("div"); ghost.className = "group-transition"; ghost.inert = true; ghost.setAttribute("aria-hidden", "true");
    const scene = document.createElement("div"); scene.className = "group-transition-world"; scene.style.transform = getComputedStyle(world).transform;
    [...cards.values(), ...assets.values()].forEach(({ element }) => {
      if (element.hidden) return;
      const snapshot = element.cloneNode(true);
      snapshot.removeAttribute("data-card-id"); snapshot.removeAttribute("data-asset-id");
      snapshot.removeAttribute("id"); snapshot.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      snapshot.querySelectorAll("[aria-live]").forEach((node) => node.removeAttribute("aria-live"));
      snapshot.classList.remove("is-entering");
      snapshot.style.scale = getComputedStyle(element).scale;
      snapshot.style.opacity = Number(getComputedStyle(element).opacity) * Number(getComputedStyle(element.parentElement).opacity);
      scene.append(snapshot);
    });
    stopGroupMotion();
    ghost.append(scene);
    if (!$("#empty-board").hidden) {
      const empty = $("#empty-board").cloneNode(true); empty.removeAttribute("id"); empty.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id")); ghost.append(empty);
    }
    viewport.append(ghost);
    return ghost;
  }
  function transitionGroupView(ghost) {
    const incoming = [cardLayer, assetLayer, $("#empty-board")].filter((element) => !element.hidden);
    const animations = [ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: "ease-out", fill: "both" }), ...incoming.map((element) => element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" }))];
    const transition = groupTransition = { ghost, animations };
    animations.at(-1).onfinish = () => { if (groupTransition === transition) stopGroupMotion(); };
  }
  function applyCamera(smooth = false) {
    const previous = smooth && !reduced.matches ? getComputedStyle(world).transform : null;
    stopCameraMotion();
    const { x, y, zoom } = camera();
    const target = `translate(${x}px, ${y}px) scale(${zoom})`;
    world.style.transform = target;
    if (previous) {
      const from = new DOMMatrixReadOnly(previous);
      if (Math.abs(from.e - x) > .1 || Math.abs(from.f - y) > .1 || Math.abs(from.a - zoom) > .001) {
        cameraAnimation = world.animate([{ transform: previous }, { transform: target }], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
        const animation = cameraAnimation;
        animation.onfinish = () => { if (cameraAnimation === animation) stopCameraMotion(); };
      }
    }
    const extent = Math.round(100 / zoom);
    $("#board-zoom").value = extent;
    $("#zoom-label").textContent = `${extent}%`;
    $("#board-zoom").setAttribute("aria-valuetext", `${extent}% luas tampilan papan`);
  }
  function focusItem(item, focusHandle = true, smooth = false) {
    const switchingGroup = item.groupId !== state.activeGroupId;
    const ghost = switchingGroup && smooth && !reduced.matches ? captureGroupView() : null;
    if (switchingGroup) selectGroup(item.groupId, false, false);
    const element = cards.get(item.id)?.element || assets.get(item.id)?.element;
    if (!element) { ghost?.remove(); return; }
    const { width, height } = viewBounds();
    const cam = camera();
    // Keep the complete paper visible on smaller screens when navigating to it.
    const usableWidth = width - (innerWidth <= 700 ? 68 : 0);
    cam.zoom = Math.min(cam.zoom, Math.max(.5, (usableWidth - 32) / element.offsetWidth), Math.max(.5, (height - 100) / element.offsetHeight));
    cam.x = (usableWidth - element.offsetWidth * cam.zoom) / 2 - item.x * cam.zoom;
    cam.y = Math.max(35, (height - element.offsetHeight * cam.zoom) / 2 - 25) - item.y * cam.zoom;
    applyCamera(smooth); if (ghost) transitionGroupView(ghost); board.front(item, element); save();
    if (focusHandle) (element.querySelector(".paper-drag-handle") || element).focus({ preventScroll: true });
  }
  function change() {
    save(); renderSidebar();
    if ($("#calendar-dialog").open) renderCalendar();
  }
  function mountCard(card, entering = false) {
    const element = $("#paper-template").content.firstElementChild.cloneNode(true);
    element.dataset.cardId = card.id;
    element.querySelector(".paper-title").textContent = card.title;
    element.setAttribute("aria-label", card.title);
    element.style.zIndex = card.z;
    cardLayer.append(element);
    cards.set(card.id, { element });
    const controller = createTodoController(element, card, change);
    const drag = bindBoardDrag(element, element.querySelector(".paper-drag-handle"), card, board);
    cards.set(card.id, { element, controller, drag });
    element.addEventListener("pointerenter", () => board.front(card, element));
    element.addEventListener("pointerdown", () => board.front(card, element));
    element.addEventListener("focusin", () => board.front(card, element));
    element.querySelector(".paper-options").addEventListener("click", () => openCardSettings(card));
    if (entering && !reduced.matches) {
      element.classList.add("is-entering");
      element.addEventListener("animationend", (event) => { if (event.animationName === "paper-pop") element.classList.remove("is-entering"); }, { once: true });
    }
  }
  function mountAsset(asset) {
    const artwork = catalog.get(asset.assetId);
    const element = document.createElement("div");
    element.className = "board-asset"; element.tabIndex = 0; element.dataset.assetId = asset.id;
    element.setAttribute("role", "group"); element.setAttribute("aria-label", `Aset ${artwork.name}. Tarik atau gunakan tombol panah untuk menggeser.`);
    element.style.width = `${artwork.width}px`; element.style.height = `${artwork.height}px`; element.style.zIndex = asset.z;
    const image = new Image(); image.src = artwork.src; image.alt = ""; image.draggable = false;
    const remove = document.createElement("button"); remove.className = "asset-remove"; remove.textContent = "×"; remove.setAttribute("aria-label", `Lepas aset ${artwork.name}`);
    element.append(image, remove); assetLayer.append(element);
    const drag = bindBoardDrag(element, element, asset, board);
    assets.set(asset.id, { element, drag });
    element.addEventListener("pointerenter", () => board.front(asset, element));
    element.addEventListener("pointerdown", () => board.front(asset, element));
    element.addEventListener("focusin", () => board.front(asset, element));
    remove.addEventListener("click", () => { drag.destroy(); element.remove(); assets.delete(asset.id); state.assets = state.assets.filter((item) => item.id !== asset.id); change(); });
  }
  function renderSidebar() {
    const nav = $("#group-list");
    const sections = new Map([...nav.children].map((section) => [section.dataset.groupId, section]));
    state.groups.forEach((entry, index) => {
      let section = sections.get(entry.id);
      if (!section) {
        section = document.createElement("div"); section.className = "group-section"; section.dataset.groupId = entry.id;
        const button = document.createElement("button"); button.type = "button"; button.className = "group-button"; button.dataset.linkId = entry.id;
        const name = document.createElement("span");
        const count = document.createElement("span"); count.className = "group-count";
        button.append(name, count); button.addEventListener("click", () => selectGroup(entry.id, true)); section.append(button);
        const list = document.createElement("div"); list.className = "group-cards"; section.append(list);
      }
      const button = section.querySelector(".group-button");
      const selected = entry.id === state.activeGroupId;
      button.classList.toggle("active", selected); button.setAttribute("aria-pressed", String(selected));
      const groupCards = state.cards.filter((card) => card.groupId === entry.id);
      const active = groupCards.reduce((sum, card) => sum + card.tasks.filter((task) => !task.completed).length, 0);
      button.firstElementChild.textContent = entry.name; button.lastElementChild.textContent = `${active} task`;
      const list = section.querySelector(".group-cards");
      list.hidden = groupCards.length === 0;
      const links = new Map([...list.children].map((link) => [link.dataset.linkId, link]));
      groupCards.forEach((card, cardIndex) => {
        let link = links.get(card.id);
        if (!link) {
          link = document.createElement("button"); link.className = "sidebar-card-link"; link.dataset.linkId = card.id;
          link.append(document.createElement("span"), document.createElement("small"));
          link.addEventListener("click", () => { closeSidebar(); focusItem(card, true, true); });
        }
        link.firstElementChild.textContent = card.title;
        link.lastElementChild.textContent = card.tasks.filter((task) => !task.completed).length;
        if (list.children[cardIndex] !== link) list.insertBefore(link, list.children[cardIndex] || null);
        links.delete(card.id);
      });
      links.forEach((link) => link.remove());
      if (nav.children[index] !== section) nav.insertBefore(section, nav.children[index] || null);
      sections.delete(entry.id);
    });
    sections.forEach((section) => section.remove());
    $("#current-group-name").textContent = group().name;
    $("#board-summary").textContent = `${state.groups.length} grup · ${state.cards.length} kertas`;
  }
  function updateVisibility() {
    state.cards.forEach((card) => { cards.get(card.id).element.hidden = card.groupId !== state.activeGroupId; });
    state.assets.forEach((asset) => { assets.get(asset.id).element.hidden = asset.groupId !== state.activeGroupId; });
    $("#empty-board").hidden = state.cards.some((card) => card.groupId === state.activeGroupId);
  }
  function selectGroup(id, smooth = false, moveCamera = true) {
    if (!state.groups.some((entry) => entry.id === id)) return;
    const ghost = smooth && !reduced.matches && id !== state.activeGroupId ? captureGroupView() : null;
    if (!smooth && moveCamera) stopGroupMotion();
    state.activeGroupId = id; updateVisibility();
    if (moveCamera) applyCamera(smooth);
    if (ghost) transitionGroupView(ghost);
    renderSidebar(); closeSidebar(); save();
  }
  function spawnPosition(width, height) {
    const cam = camera();
    const viewWidth = viewBounds().width / cam.zoom;
    const originX = Math.max(24, (viewBounds().width - width * cam.zoom) / 2) / cam.zoom - cam.x / cam.zoom;
    const originY = 56 / cam.zoom - cam.y / cam.zoom;
    const occupied = state.cards.concat(state.assets).filter((item) => item.groupId === state.activeGroupId).map((item) => {
      const element = cards.get(item.id)?.element || assets.get(item.id)?.element;
      return { x: item.x - 16, y: item.y - 20, width: (element?.offsetWidth || 520) + 32, height: (element?.offsetHeight || 360) + 40 };
    });
    const columns = Math.max(1, Math.floor(viewWidth / (width + 48)));
    for (let index = 0; index < 10000; index++) {
      const x = originX + (index % columns) * (width + 48);
      const y = originY + Math.floor(index / columns) * (height + 64);
      if (!occupied.some((box) => x < box.x + box.width && x + width > box.x && y < box.y + box.height && y + height > box.y)) return { x, y };
    }
    const bottom = occupied.reduce((max, box) => Math.max(max, box.y + box.height), originY);
    return { x: originX, y: bottom + 64 };
  }
  function createCard(title = "My To Do List") {
    closeCreateMenu();
    const width = innerWidth <= 700 ? 340 : 520;
    // Reserve the full task viewport so a new card has room to grow.
    const position = spawnPosition(width, 600);
    const card = { id: uid(), groupId: state.activeGroupId, title, ...position, z: ++stack, tasks: [] };
    state.cards.push(card); mountCard(card, true); updateVisibility(); change(); focusItem(card, false);
    cards.get(card.id).element.querySelector(".task-input").focus({ preventScroll: true });
  }
  let nameAction;
  let editingGroupId = null;
  function openName(title, value, action, groupId = null) {
    editingGroupId = groupId; $("#delete-group").hidden = groupId === null;
    nameAction = action; $("#name-dialog-title").textContent = title; $("#name-input").value = value; $("#name-dialog").showModal(); $("#name-input").focus();
  }
  $("#add-group").addEventListener("click", () => openName("Tambah grup", "", (name) => {
    const entry = { id: uid(), name, camera: { x: 0, y: 0, zoom: 1 } }; state.groups.push(entry); selectGroup(entry.id); notify("Grup dibuat. Tambahkan kertas lewat tombol +.");
  }));
  $("#rename-group").addEventListener("click", () => {
    const entry = group();
    openName("Ubah nama grup", entry.name, (name) => { entry.name = name; change(); }, entry.id);
  });
  $("#delete-group").addEventListener("click", () => { if ($("#name-dialog").open && editingGroupId) openDeleteGroup(editingGroupId); });
  $("#name-form").addEventListener("submit", (event) => { event.preventDefault(); const name = $("#name-input").value.trim(); if (!name) return; nameAction(name); $("#name-dialog").close(); });
  let pendingDeleteGroupId = null;
  const deleteGroupDialog = $("#delete-group-dialog");
  function openDeleteGroup(id) {
    const entry = state.groups.find((item) => item.id === id);
    if (!entry) return;
    const groupCards = state.cards.filter((card) => card.groupId === id);
    const taskCount = groupCards.reduce((count, card) => count + card.tasks.length, 0);
    const assetCount = state.assets.filter((asset) => asset.groupId === id).length;
    pendingDeleteGroupId = id;
    $("#delete-group-message").textContent = `Hapus grup “${entry.name}”? ${groupCards.length} kertas, ${taskCount} task, dan ${assetCount} aset di dalamnya ikut dihapus. Tindakan ini tidak bisa dibatalkan.`;
    $("#delete-group-last-note").hidden = state.groups.length > 1;
    deleteGroupDialog.showModal();
  }
  deleteGroupDialog.addEventListener("close", () => { if (!deleteGroupDialog.open) pendingDeleteGroupId = null; });
  $("#confirm-delete-group").addEventListener("click", () => {
    const id = pendingDeleteGroupId;
    const index = state.groups.findIndex((entry) => entry.id === id);
    if (index < 0) return;
    // Cancel pending task animations and drag listeners before removing their data.
    state.cards.filter((card) => card.groupId === id).forEach((card) => {
      const mounted = cards.get(card.id);
      mounted.controller.destroy(); mounted.drag.destroy(); mounted.element.remove(); cards.delete(card.id);
    });
    state.assets.filter((asset) => asset.groupId === id).forEach((asset) => {
      const mounted = assets.get(asset.id);
      mounted.drag.destroy(); mounted.element.remove(); assets.delete(asset.id);
    });
    state.cards = state.cards.filter((card) => card.groupId !== id);
    state.assets = state.assets.filter((asset) => asset.groupId !== id);
    state.groups.splice(index, 1);
    // Keep a valid empty group so reloading never restores the old migrated tasks.
    if (!state.groups.length) state.groups.push({ id: uid(), name: "Grup saya", camera: { x: 0, y: 0, zoom: 1 } });
    if (state.activeGroupId === id) state.activeGroupId = state.groups[Math.min(index, state.groups.length - 1)].id;
    deleteGroupDialog.close();
    if (editingGroupId === id && $("#name-dialog").open) $("#name-dialog").close();
    updateVisibility(); applyCamera(); change(); closeSidebar();
    viewport.focus({ preventScroll: true }); notify("Grup beserta isinya dihapus.");
  });
  let settingsCard;
  let deleteConfirmed = false;
  function openCardSettings(card) {
    settingsCard = card; deleteConfirmed = false; $("#delete-card-warning").hidden = true;
    $("#card-title-input").value = card.title; const select = $("#card-group-input"); select.replaceChildren();
    state.groups.forEach((entry) => select.add(new Option(entry.name, entry.id)));
    select.value = card.groupId; select.dispatchEvent(new Event("dropdown:sync")); $("#card-dialog").showModal();
  }
  $("#card-settings-form").addEventListener("submit", (event) => {
    event.preventDefault(); const title = $("#card-title-input").value.trim(); if (!title || !settingsCard) return;
    settingsCard.title = title;
    const destination = $("#card-group-input").value;
    if (destination !== settingsCard.groupId) {
      selectGroup(destination);
      Object.assign(settingsCard, spawnPosition(innerWidth <= 700 ? 340 : 520, 600));
      settingsCard.groupId = destination;
      cards.get(settingsCard.id).drag.update();
    }
    const element = cards.get(settingsCard.id).element; element.querySelector(".paper-title").textContent = title; element.setAttribute("aria-label", title);
    updateVisibility(); change(); $("#card-dialog").close(); focusItem(settingsCard);
  });
  $("#delete-card").addEventListener("click", () => {
    if (!deleteConfirmed) { deleteConfirmed = true; $("#delete-card-warning").hidden = false; return; }
    const card = settingsCard; const mounted = cards.get(card.id); mounted.drag.destroy(); mounted.controller.destroy(); mounted.element.remove(); cards.delete(card.id);
    state.cards = state.cards.filter((item) => item.id !== card.id); $("#card-dialog").close(); updateVisibility(); change(); viewport.focus({ preventScroll: true });
  });
  const createMenu = $("#create-menu");
  let createMenuOpen = false;
  let menuAnimation = null;
  function setCreateMenu(open) {
    if (open === createMenuOpen) return;
    createMenuOpen = open;
    const wasHidden = createMenu.hidden;
    const style = getComputedStyle(createMenu);
    const from = wasHidden ? { opacity: 0, translate: "0 12px", scale: .96 } : { opacity: style.opacity, translate: style.translate, scale: style.scale };
    menuAnimation?.cancel(); menuAnimation = null;
    createMenu.hidden = false; createMenu.inert = !open;
    if (!open && createMenu.contains(document.activeElement)) $("#toggle-create").focus({ preventScroll: true });
    createMenu.setAttribute("aria-hidden", String(!open));
    $("#toggle-create").setAttribute("aria-expanded", String(open));
    if (reduced.matches) createMenu.hidden = !open;
    else {
      const to = open ? { opacity: 1, translate: "0 0", scale: 1 } : { opacity: 0, translate: "0 8px", scale: .98 };
      const animation = createMenu.animate([from, to], { ...contentMotion, duration: open ? 220 : 150, fill: "both" });
      menuAnimation = animation;
      animation.onfinish = () => {
        if (menuAnimation !== animation) return;
        createMenu.hidden = !createMenuOpen; menuAnimation = null; animation.cancel();
      };
    }
    if (open) $("#create-card").focus({ preventScroll: true });
  }
  function closeCreateMenu() { setCreateMenu(false); }
  $("#toggle-create").addEventListener("click", () => setCreateMenu(!createMenuOpen));
  $("#create-card").addEventListener("click", () => { closeCreateMenu(); openName("Buat to-do list", "My To Do List", createCard); });
  $("#empty-create").addEventListener("click", () => openName("Buat to-do list", "My To Do List", createCard));
  document.addEventListener("pointerdown", (event) => { if (!event.target.closest(".create-menu-wrap")) closeCreateMenu(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && createMenuOpen) { closeCreateMenu(); $("#toggle-create").focus(); } });
  $("#open-assets").addEventListener("click", () => { closeCreateMenu(); $("#asset-dialog").showModal(); });
  catalog.forEach((artwork) => {
    const button = document.createElement("button"); button.className = "asset-choice";
    const image = new Image(); image.src = artwork.src; image.alt = ""; const label = document.createElement("span"); label.textContent = artwork.name;
    button.append(image, label); button.addEventListener("click", () => {
      const asset = { id: uid(), groupId: state.activeGroupId, assetId: artwork.id, ...spawnPosition(artwork.width, artwork.height), z: ++stack };
      state.assets.push(asset); mountAsset(asset); updateVisibility(); change(); $("#asset-dialog").close(); focusItem(asset);
    }); $("#asset-catalog").append(button);
  });
  document.querySelectorAll(".dialog-close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
  document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }));
  $("#calendar-dialog").addEventListener("close", () => { [...contentTransitions.keys()].forEach(cancelContentTransition); });
  reduced.addEventListener("change", () => {
    if (!reduced.matches) return;
    stopNavigation(false);
    [...contentTransitions.keys()].forEach(cancelContentTransition);
    menuAnimation?.cancel(); menuAnimation = null; createMenu.hidden = !createMenuOpen;
  });
  function closeSidebar() {
    if (innerWidth <= 700) window.boardPanels.dismissSidebar();
  }
  // Pan the empty board. Inputs, task scrolling, cards, and controls keep their own gestures.
  let pan;
  viewport.addEventListener("pointerdown", () => stopNavigation(), { capture: true });
  viewport.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest(".paper, .board-asset, button")) return;
    event.preventDefault(); viewport.focus({ preventScroll: true });
    pan = { id: event.pointerId, x: event.clientX, y: event.clientY, originalX: camera().x, originalY: camera().y };
    viewport.setPointerCapture(event.pointerId); document.body.classList.add("is-board-panning");
  });
  window.addEventListener("pointermove", (event) => {
    if (!pan || event.pointerId !== pan.id) return;
    camera().x = pan.originalX + event.clientX - pan.x; camera().y = pan.originalY + event.clientY - pan.y; applyCamera();
  });
  function finishPan(cancel = false) {
    if (!pan) return; const previous = pan; pan = null;
    if (cancel) { camera().x = previous.originalX; camera().y = previous.originalY; applyCamera(); }
    document.body.classList.remove("is-board-panning");
    if (viewport.hasPointerCapture(previous.id)) viewport.releasePointerCapture(previous.id); save();
  }
  window.addEventListener("pointerup", (event) => { if (event.pointerId === pan?.id) finishPan(); });
  window.addEventListener("pointercancel", (event) => { if (event.pointerId === pan?.id) finishPan(true); });
  window.addEventListener("blur", () => finishPan(true));
  viewport.addEventListener("keydown", (event) => {
    if (event.target !== viewport) return;
    if (event.key === "Escape") { finishPan(true); return; }
    const directions = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (directions[event.key]) { event.preventDefault(); stopNavigation(); const step = event.shiftKey ? 160 : 40; camera().x += directions[event.key][0] * step; camera().y += directions[event.key][1] * step; applyCamera(); save(); }
    if (event.key === "Home") { event.preventDefault(); resetView(); }
  });
  function setExtent(value, anchorX = viewBounds().width / 2, anchorY = viewBounds().height / 2) {
    stopNavigation();
    const cam = camera(); const oldZoom = cam.zoom; const newZoom = 100 / clamp(value, 60, 200);
    cam.x = anchorX - (anchorX - cam.x) * newZoom / oldZoom;
    cam.y = anchorY - (anchorY - cam.y) * newZoom / oldZoom; cam.zoom = newZoom; applyCamera(); queueSave();
  }
  $("#board-zoom").addEventListener("input", (event) => setExtent(Number(event.target.value)));
  $("#zoom-out").addEventListener("click", () => setExtent(100 / camera().zoom + 10));
  $("#zoom-in").addEventListener("click", () => setExtent(100 / camera().zoom - 10));
  viewport.addEventListener("wheel", (event) => {
    if (event.target.closest(".task-list, input, select")) return;
    event.preventDefault();
    stopNavigation();
    if (event.ctrlKey || event.metaKey) { const box = viewBounds(); setExtent(100 / camera().zoom + Math.sign(event.deltaY) * 5, event.clientX - box.left, event.clientY - box.top); }
    else { camera().x -= event.deltaX; camera().y -= event.deltaY; applyCamera(); queueSave(); }
  }, { passive: false });
  function resetView() {
    camera().zoom = 1;
    const first = state.cards.find((card) => card.groupId === state.activeGroupId) || state.assets.find((asset) => asset.groupId === state.activeGroupId);
    if (first) focusItem(first, false); else { camera().x = 0; camera().y = 0; applyCamera(); save(); }
  }
  $("#reset-view").addEventListener("click", resetView);
  let previousMobile = innerWidth <= 700;
  window.addEventListener("resize", () => { const mobile = innerWidth <= 700; if (mobile !== previousMobile) { previousMobile = mobile; resetView(); } });
  // Calendar dates are local dates, avoiding UTC shifts of date-input values.
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  let selectedDate = dateKey(new Date());
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthStamp = (date) => date.getFullYear() * 12 + date.getMonth();
  let renderedMonthStamp = null;
  let renderedDayKey = null;
  function calendarEntries() {
    return state.cards.filter((card) => $("#calendar-scope").value === "all" || card.groupId === state.activeGroupId).flatMap((card) => card.tasks.map((task) => ({ card, task })));
  }
  function renderCalendar(options = {}) {
    const entries = calendarEntries();
    const stamp = monthStamp(calendarMonth);
    const monthChanged = stamp !== renderedMonthStamp;
    const monthDirection = renderedMonthStamp === null ? 0 : Math.sign(stamp - renderedMonthStamp);
    const animate = $("#calendar-dialog").open && !reduced.matches;
    const grid = $("#calendar-grid");
    const heading = $("#calendar-month");
    const previousGrid = monthChanged ? captureContent(grid, animate && renderedMonthStamp !== null) : null;
    const previousHeading = monthChanged ? captureContent(heading, animate && renderedMonthStamp !== null) : null;
    if (monthChanged) { heading.textContent = calendarMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" }); grid.replaceChildren(); }
    const counts = new Map(); entries.forEach(({ task }) => { if (task.dueDate) counts.set(task.dueDate, (counts.get(task.dueDate) || 0) + 1); });
    const start = new Date(calendarMonth); start.setDate(1 - (start.getDay() + 6) % 7);
    for (let index = 0; index < 42; index++) {
      const date = new Date(start); date.setDate(start.getDate() + index);
      const key = dateKey(date); const count = counts.get(key) || 0;
      let button = grid.children[index];
      if (!button) {
        button = document.createElement("button"); button.className = "calendar-cell"; button.dataset.date = key;
        const number = document.createElement("span"); number.textContent = date.getDate(); const badge = document.createElement("small");
        button.append(number, badge);
        button.addEventListener("click", () => {
          const direction = Math.sign(key.localeCompare(selectedDate));
          selectedDate = key;
          if (monthStamp(date) !== monthStamp(calendarMonth)) calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          renderCalendar({ direction });
          [...grid.children].find((cell) => cell.dataset.date === key)?.focus({ preventScroll: true });
        });
        grid.append(button);
      }
      button.classList.toggle("today", key === dateKey(new Date())); button.classList.toggle("selected", key === selectedDate); button.classList.toggle("outside", date.getMonth() !== calendarMonth.getMonth());
      button.setAttribute("aria-pressed", String(key === selectedDate)); button.setAttribute("aria-label", `${date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}, ${count} task`);
      button.lastElementChild.textContent = count ? `${count} task` : "";
    }
    renderedMonthStamp = stamp;
    transitionContent(grid, previousGrid, monthDirection);
    transitionContent(heading, previousHeading, monthDirection);
    const dated = entries.filter(({ task }) => task.dueDate === selectedDate);
    const undated = entries.filter(({ task }) => !task.dueDate).length;
    const dayKey = JSON.stringify([selectedDate, undated, dated.map(({ card, task }) => [card.id, task.id, task.text, task.completed, card.title, state.groups.find((entry) => entry.id === card.groupId).name])]);
    if (dayKey !== renderedDayKey) {
      const panel = $("#calendar-day-view");
      const previousDay = captureContent(panel, animate && renderedDayKey !== null);
      const [year, month, day] = selectedDate.split("-").map(Number);
      $("#calendar-day-title").textContent = new Date(year, month - 1, day).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
      const list = $("#calendar-tasks"); list.replaceChildren();
      if (!dated.length) { const empty = document.createElement("li"); empty.textContent = "Tidak ada task jatuh tempo pada tanggal ini."; empty.className = "calendar-note"; list.append(empty); }
      dated.forEach(({ card, task }) => {
        const li = document.createElement("li"); const button = document.createElement("button"); button.className = "calendar-task"; button.classList.toggle("completed", task.completed);
        const text = document.createElement("span"); text.textContent = task.text;
        const source = document.createElement("small"); source.textContent = `${state.groups.find((entry) => entry.id === card.groupId).name} / ${card.title} · ${task.completed ? "Selesai" : "Aktif"}`;
        button.append(text, source); button.addEventListener("click", () => {
          $("#calendar-dialog").close(); focusItem(card); const mounted = cards.get(card.id);
          mounted.element.querySelector('[data-filter="all"]').click();
          const row = [...mounted.element.querySelectorAll(".task-item")].find((item) => Number(item.dataset.id) === task.id);
          if (row) { const taskList = mounted.element.querySelector(".task-list"); taskList.scrollTo({ top: row.offsetTop - taskList.offsetTop, behavior: reduced.matches ? "instant" : "smooth" }); row.querySelector(".task-checkbox").focus({ preventScroll: true }); }
        }); li.append(button); list.append(li);
      });
      list.scrollTop = 0;
      $("#calendar-undated").textContent = undated ? `${undated} task tanpa tanggal jatuh tempo belum ditampilkan di kalender.` : "";
      renderedDayKey = dayKey;
      transitionContent(panel, previousDay, options.direction || 0, "Y", true);
    }
  }
  $("#open-calendar").addEventListener("click", () => { renderCalendar(); $("#calendar-dialog").showModal(); });
  $("#calendar-scope").addEventListener("change", () => renderCalendar());
  $("#previous-month").addEventListener("click", () => { calendarMonth.setMonth(calendarMonth.getMonth() - 1); renderCalendar(); });
  $("#next-month").addEventListener("click", () => { calendarMonth.setMonth(calendarMonth.getMonth() + 1); renderCalendar(); });
  $("#calendar-today").addEventListener("click", () => { const today = new Date(); const previous = selectedDate; selectedDate = dateKey(today); calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1); renderCalendar({ direction: Math.sign(selectedDate.localeCompare(previous)) }); });
  // Board gets darker; the paper and its black ink keep the same palette.
  try { document.body.classList.toggle("dark", localStorage.getItem("theme") === "dark"); } catch { /* Theme is optional. */ }
  function updateThemeToggle() {
    const dark = document.body.classList.contains("dark");
    const paths = dark ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>' : '<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>';
    $("#theme-toggle").innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
    $("#theme-toggle").setAttribute("aria-label", dark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    $("meta[name='theme-color']").content = dark ? "#302b25" : "#3c5446";
  }
  $("#theme-toggle").addEventListener("click", () => { document.body.classList.toggle("dark"); try { localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light"); } catch { /* Keep the in-memory theme. */ } updateThemeToggle(); });
  updateThemeToggle();
  state.cards.forEach((card) => mountCard(card, card.groupId === state.activeGroupId));
  state.assets.forEach(mountAsset);
  updateVisibility(); renderSidebar(); applyCamera();
  // Center only on first migration. Subsequent openings restore the saved camera.
  if (!hadSavedBoard && state.cards.length === 1) focusItem(state.cards[0], false);
  save();
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
})();
