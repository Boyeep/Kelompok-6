// Owns the snapshots and animations used while calendar content changes.
function createCalendarMotion(reduced) {
  const transitions = new Map();
  const timing = { duration: 240, easing: "cubic-bezier(.22, 1, .36, 1)" };

  function cancel(target) {
    const transition = transitions.get(target);
    if (!transition) return;
    transitions.delete(target);
    transition.animations.forEach((animation) => animation.cancel());
    transition.snapshot.remove();
    target.style.overflow = transition.overflow;
  }

  function capture(target, animate) {
    let previous = null;
    if (animate && !reduced.matches) {
      const style = getComputedStyle(target);
      const snapshot = target.cloneNode(true);
      snapshot.removeAttribute("id");
      snapshot.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      snapshot.removeAttribute("aria-live");
      snapshot.querySelectorAll("[aria-live]").forEach((node) => node.removeAttribute("aria-live"));
      snapshot.classList.add("motion-snapshot");
      snapshot.setAttribute("aria-hidden", "true");
      snapshot.inert = true;
      const scrollTops = [target, ...target.querySelectorAll("*")].map((node) => node.scrollTop);
      previous = {
        snapshot, height: target.offsetHeight,
        transform: style.transform, opacity: style.opacity, scrollTops,
      };
    }
    // Take a snapshot of the visible frame before canceling rapid transitions.
    cancel(target);
    return previous;
  }

  function transition(target, previous, direction, axis = "X", resize = false) {
    if (!previous || reduced.matches) return;
    const nextHeight = target.offsetHeight;
    const snapshot = previous.snapshot;
    snapshot.style.height = `${previous.height}px`;
    target.parentElement.append(snapshot);
    [snapshot, ...snapshot.querySelectorAll("*")].forEach((node, index) => {
      node.scrollTop = previous.scrollTops[index];
    });

    const distance = axis === "X" ? 18 : 10;
    const incoming = { transform: `translate${axis}(${direction * distance}px)`, opacity: 0 };
    const settled = { transform: "translate(0, 0)", opacity: 1 };
    const overflow = target.style.overflow;
    if (resize && Math.abs(nextHeight - previous.height) > 1) {
      incoming.height = `${previous.height}px`;
      settled.height = `${nextHeight}px`;
      target.style.overflow = "clip";
    }
    const exit = snapshot.animate([
      { transform: previous.transform, opacity: previous.opacity },
      { transform: `translate${axis}(${-direction * distance}px)`, opacity: 0 },
    ], { ...timing, duration: 180, fill: "both" });
    const enter = target.animate([incoming, settled], { ...timing, fill: "both" });
    const active = { snapshot, animations: [exit, enter], overflow };
    transitions.set(target, active);
    enter.onfinish = () => { if (transitions.get(target) === active) cancel(target); };
  }

  function cancelAll() { [...transitions.keys()].forEach(cancel); }
  return { capture, transition, cancelAll };
}
