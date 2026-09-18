// Drag in board coordinates, independent of zoom and viewport size.
function bindBoardDrag(element, handle, item, board) {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  let drag = null;
  let keyboardLift = false;
  const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const apply = () => {
    element.style.setProperty("--paper-x", `${item.x}px`);
    element.style.setProperty("--paper-y", `${item.y}px`);
  };
  const drop = (cancel = false) => {
    if (!drag) return;
    const previous = drag;
    drag = null;
    if (cancel) { item.x = previous.x; item.y = previous.y; apply(); }
    element.classList.remove("is-lifted");
    document.body.classList.remove("is-paper-dragging");
    if (handle.hasPointerCapture(previous.id)) handle.releasePointerCapture(previous.id);
    board.save();
  };
  handle.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || event.target.closest("button, input, select")) return;
    event.preventDefault();
    board.stopNavigation?.();
    element.classList.remove("is-entering");
    handle.focus({ preventScroll: true });
    board.front(item, element);
    drag = { id: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: item.x, y: item.y };
    handle.setPointerCapture(event.pointerId);
    element.classList.add("is-lifted");
    document.body.classList.add("is-paper-dragging");
  }, options);
  window.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    item.x = drag.x + (event.clientX - drag.clientX) / board.zoom;
    item.y = drag.y + (event.clientY - drag.clientY) / board.zoom;
    apply();
  }, options);
  window.addEventListener("pointerup", (event) => { if (drag?.id === event.pointerId) drop(); }, options);
  window.addEventListener("pointercancel", (event) => { if (drag?.id === event.pointerId) drop(true); }, options);
  // Window listeners keep the drag alive if a browser releases pointer capture
  // during a transform. Pointerup, pointercancel, Escape, and blur finish it.
  handle.addEventListener("dragstart", (event) => event.preventDefault(), options);
  handle.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { drop(true); return; }
    if (drag) return;
    if (event.key === "Home") { event.preventDefault(); board.stopNavigation?.(); board.focus(item); return; }
    if (!arrows[event.key]) return;
    event.preventDefault();
    board.stopNavigation?.();
    element.classList.remove("is-entering");
    board.front(item, element);
    keyboardLift = true;
    element.classList.add("is-lifted");
    const step = event.shiftKey ? 40 : 10;
    item.x += arrows[event.key][0] * step;
    item.y += arrows[event.key][1] * step;
    apply();
    board.save();
  }, options);
  const dropKeyboard = () => { if (keyboardLift) { keyboardLift = false; element.classList.remove("is-lifted"); } };
  handle.addEventListener("keyup", dropKeyboard, options);
  handle.addEventListener("blur", dropKeyboard, options);
  window.addEventListener("blur", () => { drop(true); dropKeyboard(); }, options);
  apply();
  return { update: apply, destroy() { drop(); abort.abort(); } };
}
