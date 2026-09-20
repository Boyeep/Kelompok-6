(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let current = null;

  document.querySelectorAll("select").forEach((select, number) => {
    if (select.multiple || select.size > 1) return;
    const id = select.id || `board-select-${number}`;
    const labels = [...select.labels];
    const wrapper = document.createElement("div"); wrapper.className = "themed-select";
    const trigger = document.createElement("button"); trigger.type = "button"; trigger.className = "dropdown-trigger"; trigger.id = `${id}-trigger`;
    const value = document.createElement("span"); value.className = "dropdown-value";
    const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevron.classList.add("dropdown-chevron"); chevron.setAttribute("viewBox", "0 0 24 24"); chevron.setAttribute("aria-hidden", "true");
    chevron.innerHTML = '<path d="m6 9 6 6 6-6"/>';
    trigger.append(value, chevron);
    const list = document.createElement("div"); list.className = "dropdown-options"; list.id = `${id}-options`; list.hidden = true; list.setAttribute("role", "listbox");
    const topLayer = typeof list.showPopover === "function";
    if (topLayer) list.setAttribute("popover", "manual"); else wrapper.classList.add("dropdown-inline");
    trigger.setAttribute("role", "combobox"); trigger.setAttribute("aria-haspopup", "listbox"); trigger.setAttribute("aria-controls", list.id); trigger.setAttribute("aria-expanded", "false");
    if (labels.length) {
      const labelIds = labels.map((label, index) => {
        if (!label.id) label.id = `${id}-label-${index}`;
        label.htmlFor = trigger.id;
        return label.id;
      }).join(" ");
      trigger.setAttribute("aria-labelledby", labelIds); list.setAttribute("aria-labelledby", labelIds);
    } else {
      trigger.setAttribute("aria-label", select.getAttribute("aria-label") || "Pilih opsi");
    }
    if (select.hasAttribute("aria-describedby")) trigger.setAttribute("aria-describedby", select.getAttribute("aria-describedby"));
    select.before(wrapper); wrapper.append(select, trigger, list); select.hidden = true;
    let open = false, active = -1, animation = null, frame = null, search = "", searchTimer;
    const controller = { close };
    const enabled = () => [...select.options].map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled && !option.parentElement.disabled);

    function markActive(index, scroll = true) {
      active = index;
      [...list.children].forEach((option, itemIndex) => option.classList.toggle("is-active", itemIndex === index));
      const option = list.children[index];
      if (open && option) trigger.setAttribute("aria-activedescendant", option.id); else trigger.removeAttribute("aria-activedescendant");
      if (scroll && option && open) {
        if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
        else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
      }
    }
    function sync() {
      const selected = select.options[select.selectedIndex];
      value.textContent = selected?.label || "Pilih grup"; trigger.title = value.textContent;
      trigger.disabled = select.disabled || enabled().length === 0;
      list.replaceChildren(...[...select.options].map((option, index) => {
        const item = document.createElement("div"); item.className = "dropdown-option"; item.id = `${id}-option-${index}`; item.dataset.index = index;
        item.setAttribute("role", "option"); item.setAttribute("aria-selected", String(index === select.selectedIndex)); item.classList.toggle("is-selected", index === select.selectedIndex);
        const disabled = option.disabled || Boolean(option.parentElement.disabled);
        item.setAttribute("aria-disabled", String(disabled));
        const text = document.createElement("span"); text.textContent = option.label;
        const check = document.createElementNS("http://www.w3.org/2000/svg", "svg"); check.setAttribute("viewBox", "0 0 24 24"); check.setAttribute("aria-hidden", "true"); check.classList.add("dropdown-check"); check.innerHTML = '<path d="m5 12 4 4L19 6"/>';
        item.append(text, check);
        return item;
      }));
      if (trigger.disabled && open) close(false);
      const next = enabled().some(({ index }) => index === active) ? active : enabled()[0]?.index ?? -1;
      markActive(open ? next : select.selectedIndex, false);
      if (open) position();
    }
    function position() {
      if (!open || !topLayer) return;
      const box = trigger.getBoundingClientRect();
      const margin = 12, gap = 6;
      const width = Math.min(box.width, innerWidth - margin * 2);
      list.style.width = `${width}px`; list.style.left = `${Math.max(margin, Math.min(box.left, innerWidth - width - margin))}px`;
      const below = innerHeight - box.bottom - gap - margin, above = box.top - gap - margin;
      const desired = Math.min(list.scrollHeight, 240);
      const downward = below >= Math.min(desired, 88) || below >= above;
      list.style.maxHeight = `${Math.max(44, Math.min(240, downward ? below : above))}px`;
      list.style.top = `${downward ? box.bottom + gap : box.top - gap - list.offsetHeight}px`;
      list.dataset.direction = downward ? "down" : "up";
    }
    function cancelAnimation() { animation?.cancel(); animation = null; }
    function hide() {
      if (topLayer && list.matches(":popover-open")) list.hidePopover();
      list.hidden = true;
    }
    function close(animate = true) {
      const visible = !list.hidden;
      const style = visible ? { opacity: getComputedStyle(list).opacity, translate: getComputedStyle(list).translate } : null;
      cancelAnimation(); cancelAnimationFrame(frame); clearTimeout(searchTimer); search = "";
      open = false; list.inert = true; wrapper.classList.remove("is-open"); trigger.setAttribute("aria-expanded", "false"); trigger.removeAttribute("aria-activedescendant");
      if (current === controller) current = null;
      if (!visible || !animate || reduced.matches) { hide(); return; }
      animation = list.animate([{ opacity: style.opacity, translate: style.translate }, { opacity: 0, translate: "0 -4px" }], { duration: 120, easing: "ease-in", fill: "both" });
      const closing = animation;
      closing.onfinish = () => { if (animation !== closing || open) return; hide(); cancelAnimation(); };
    }
    function show(index = select.selectedIndex) {
      if (trigger.disabled || select.closest("dialog") && !select.closest("dialog").open) return;
      const previous = !list.hidden ? { opacity: getComputedStyle(list).opacity, translate: getComputedStyle(list).translate } : null;
      if (current !== controller) current?.close(false);
      cancelAnimation(); sync(); open = true; current = controller; list.inert = false; list.hidden = false;
      wrapper.classList.add("is-open"); trigger.setAttribute("aria-expanded", "true");
      if (topLayer && !list.matches(":popover-open")) list.showPopover();
      position(); markActive(enabled().some((item) => item.index === index) ? index : enabled()[0]?.index ?? -1);
      trigger.focus({ preventScroll: true });
      if (!reduced.matches) {
        const offset = list.dataset.direction === "up" ? "0 5px" : "0 -5px";
        animation = list.animate([{ opacity: previous?.opacity ?? 0, translate: previous?.translate ?? offset }, { opacity: 1, translate: "0 0" }], { duration: 180, easing: "cubic-bezier(.22,1,.36,1)" });
        const opening = animation;
        opening.onfinish = () => { if (animation === opening) cancelAnimation(); };
      }
      const followDialog = () => {
        if (!open) return;
        position();
        if (select.closest("dialog")?.getAnimations().some((motion) => motion.playState === "running")) frame = requestAnimationFrame(followDialog);
      };
      frame = requestAnimationFrame(followDialog);
    }
    function choose(index, focus = true) {
      if (!enabled().some((item) => item.index === index)) return;
      const changed = select.selectedIndex !== index;
      select.selectedIndex = index; close(); sync();
      if (changed) { select.dispatchEvent(new Event("input", { bubbles: true })); select.dispatchEvent(new Event("change", { bubbles: true })); }
      if (focus) trigger.focus({ preventScroll: true });
    }
    trigger.addEventListener("click", () => open ? close() : show());
    trigger.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey) return;
      const options = enabled(), indices = options.map(({ index }) => index);
      if (!options.length) return;
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); return; }
      if (event.key === "Tab") { if (open) choose(active, false); return; }
      if (event.altKey && event.key === "ArrowUp") { if (open) { event.preventDefault(); choose(active); } return; }
      if (["ArrowDown", "ArrowUp", "Home", "End", "PageUp", "PageDown", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        if (!open) { show(event.key === "Home" ? indices[0] : event.key === "End" ? indices.at(-1) : select.selectedIndex); return; }
        if (event.key === "Enter" || event.key === " ") { choose(active); return; }
        const offset = event.key === "PageUp" ? -10 : event.key === "PageDown" ? 10 : event.key === "ArrowUp" ? -1 : 1;
        markActive(event.key === "Home" ? indices[0] : event.key === "End" ? indices.at(-1) : indices[Math.max(0, Math.min(indices.length - 1, indices.indexOf(active) + offset))]);
        return;
      }
      if (event.key.length !== 1 || event.altKey) return;
      event.preventDefault(); if (!open) show();
      clearTimeout(searchTimer); search += event.key.toLocaleLowerCase("id");
      const repeated = [...search].every((letter) => letter === search[0]);
      const prefix = repeated ? search[0] : search;
      const start = indices.indexOf(active) + (prefix.length === 1 ? 1 : 0);
      const match = options.map((_, index) => options[(start + index + options.length) % options.length]).find(({ option }) => option.label.trim().toLocaleLowerCase("id").startsWith(prefix));
      if (match) markActive(match.index);
      searchTimer = setTimeout(() => { search = ""; }, 500);
    });
    list.addEventListener("pointerdown", (event) => { if (event.target.closest(".dropdown-option")) event.preventDefault(); });
    list.addEventListener("pointermove", (event) => {
      const item = event.target.closest(".dropdown-option");
      if (open && item?.getAttribute("aria-disabled") === "false") markActive(Number(item.dataset.index), false);
    });
    list.addEventListener("click", (event) => {
      const item = event.target.closest(".dropdown-option");
      if (open && item?.getAttribute("aria-disabled") === "false") choose(Number(item.dataset.index));
    });
    document.addEventListener("pointerdown", (event) => { if (open && !wrapper.contains(event.target)) close(); });
    trigger.addEventListener("blur", () => { if (open) close(); });
    select.addEventListener("change", sync);
    select.addEventListener("input", sync);
    select.addEventListener("dropdown:sync", sync);
    new MutationObserver(sync).observe(select, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["disabled", "selected", "label", "value"] });
    select.closest("form")?.addEventListener("reset", () => { close(false); queueMicrotask(sync); });
    select.closest("dialog")?.addEventListener("close", () => close(false));
    window.addEventListener("resize", position);
    window.addEventListener("blur", () => close(false));
    document.addEventListener("scroll", (event) => { if (!list.contains(event.target)) position(); }, true);
    reduced.addEventListener("change", () => { if (reduced.matches) { cancelAnimation(); if (!open) hide(); } });
    sync();
  });
})();
