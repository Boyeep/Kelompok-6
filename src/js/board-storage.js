// Keep board data validation and legacy migration separate from the UI.
function createBoardStorage(assetCatalog, notify) {
  const key = "my-todo-board-v1";
  const uid = () => globalThis.crypto?.randomUUID?.() || `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const clamp = (number, min, max) => Math.min(max, Math.max(min, number));

  function normalizeTasks(value) {
    const used = new Set();
    let next = 1;
    return (Array.isArray(value) ? value : [])
      .filter((task) => task && typeof task.text === "string")
      .map((task) => {
        let id = finite(task.id, next);
        if (used.has(id)) id = next;
        used.add(id);
        next = Math.max(next, id + 1);
        return {
          id,
          text: task.text,
          completed: Boolean(task.completed),
          dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
        };
      });
  }

  function restore(saved) {
    if (saved?.version !== 1 || !Array.isArray(saved.groups) || !saved.groups.length) return null;
    const groupIds = new Set();
    const groups = saved.groups
      .filter((group) => group && typeof group.id === "string" && !groupIds.has(group.id) && groupIds.add(group.id))
      .map((group) => ({
        id: group.id,
        name: typeof group.name === "string" ? group.name : "Grup saya",
        camera: {
          x: finite(group.camera?.x),
          y: finite(group.camera?.y),
          zoom: clamp(finite(group.camera?.zoom, 1), .5, 100 / 60),
        },
      }));
    if (!groups.length) return null;

    const itemIds = new Set();
    const validItems = (list) => (Array.isArray(list) ? list : [])
      .filter((item) => item && typeof item.id === "string" && groupIds.has(item.groupId) && !itemIds.has(item.id) && itemIds.add(item.id));
    const position = (item) => ({
      id: item.id, groupId: item.groupId,
      x: finite(item.x, 48), y: finite(item.y, 56), z: finite(item.z, 1),
    });

    return {
      version: 1,
      groups,
      activeGroupId: groupIds.has(saved.activeGroupId) ? saved.activeGroupId : groups[0].id,
      cards: validItems(saved.cards).map((card) => ({
        ...position(card),
        title: typeof card.title === "string" ? card.title : "My To Do List",
        tasks: normalizeTasks(card.tasks),
      })),
      assets: validItems(saved.assets)
        .filter((asset) => assetCatalog.has(asset.assetId))
        .map((asset) => ({ ...position(asset), assetId: asset.assetId })),
    };
  }

  function migrateLegacy() {
    let legacy = [];
    try { legacy = normalizeTasks(JSON.parse(localStorage.getItem("tasks"))); }
    catch { /* Leave legacy storage untouched. */ }
    const groupId = uid();
    return {
      version: 1,
      activeGroupId: groupId,
      groups: [{ id: groupId, name: "Grup saya", camera: { x: 0, y: 0, zoom: 1 } }],
      cards: [{ id: uid(), groupId, title: "My To Do List", x: 48, y: 56, z: 1, tasks: legacy }],
      assets: [],
    };
  }

  function load() {
    let saved;
    let hadSavedBoard = false;
    try {
      const raw = localStorage.getItem(key);
      hadSavedBoard = Boolean(raw);
      saved = JSON.parse(raw);
    } catch {
      notify("Data papan tidak terbaca. Task lama tetap dipertahankan.", true);
    }
    return { state: restore(saved) || migrateLegacy(), hadSavedBoard };
  }

  function save(state) {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { notify("Penyimpanan perangkat penuh atau tidak tersedia. Perubahan belum tersimpan.", true); }
  }

  return { load, save, uid, clamp };
}
