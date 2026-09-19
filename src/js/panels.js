// Focus mode overlays or hides both panels without changing paper coordinates.
(() => {
  const STORAGE_KEY = "my-todo-panels-v1";
  const sidebar = document.querySelector("#sidebar");
  const toolbar = document.querySelector("#workspace-toolbar");
  const focusToggle = document.querySelector("#focus-mode");
  const backdrop = document.querySelector("#sidebar-backdrop");
  let mobile = innerWidth <= 700;
  let focused = mobile;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (typeof saved?.focused === "boolean") focused = saved.focused;
    else if (typeof saved?.sidebar === "boolean" && typeof saved?.toolbar === "boolean") focused = !saved.sidebar && !saved.toolbar;
  } catch { /* Start with the default panels if storage is unavailable. */ }
  function render() {
    const open = !focused;
    [sidebar, toolbar].forEach((element) => {
      if (!open && element.contains(document.activeElement)) focusToggle.focus({ preventScroll: true });
      element.inert = !open;
      element.setAttribute("aria-hidden", String(!open));
      element.classList.toggle("open", open);
    });
    document.body.classList.toggle("sidebar-open", open);
    document.body.classList.toggle("toolbar-open", open);
    backdrop.hidden = !(mobile && open);
    focusToggle.setAttribute("aria-pressed", String(focused));
    const label = focused ? "Keluar mode fokus" : "Mode fokus";
    focusToggle.setAttribute("aria-label", label);
  }
  function setFocused(next, persist = true) {
    if (focused === next) return;
    focused = next; render();
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ focused })); }
      catch { /* Focus mode still works without persistent storage. */ }
    }
  }
  focusToggle.addEventListener("click", () => setFocused(!focused));
  backdrop.addEventListener("click", () => setFocused(true));
  document.addEventListener("keydown", (event) => {
    if (document.querySelector("dialog[open]")) return;
    if (event.key === "Escape") {
      const active = document.activeElement;
      if (!focused && (mobile || sidebar.contains(active) || toolbar.contains(active))) setFocused(true);
    }
    if (event.key !== "Tab" || !mobile || focused) return;
    const controls = [focusToggle, ...sidebar.querySelectorAll("button:not(:disabled)"), ...toolbar.querySelectorAll("button:not(:disabled)")].filter((element) => !element.hidden && element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (!controls.includes(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener("resize", () => {
    const nextMobile = innerWidth <= 700;
    if (mobile === nextMobile) return;
    mobile = nextMobile;
    if (mobile && !focused) setFocused(true, false); else render();
  });
  window.boardPanels = { dismissSidebar: () => { if (mobile) setFocused(true); } };
  render();
})();
