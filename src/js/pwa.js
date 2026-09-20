(() => {
  const installButton = document.querySelector("#install-button");
  const status = document.querySelector("#connection-status");
  let installPrompt = null;
  let offlineReady = false;
  let offlineFailed = false;
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  function updateStatus() {
    status.classList.toggle("offline", !navigator.onLine);
    status.textContent = !navigator.onLine ? "Offline" : offlineReady ? "Siap offline" : offlineFailed ? "Offline belum siap" : "Online";
    installButton.textContent = standalone() ? "Terpasang" : "Install app";
    installButton.disabled = Boolean(standalone());
  }
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; updateStatus(); });
  window.addEventListener("appinstalled", () => { installPrompt = null; installButton.textContent = "Terpasang"; installButton.disabled = true; });
  installButton.addEventListener("click", async () => {
    if (installPrompt) {
      const prompt = installPrompt; installPrompt = null;
      await prompt.prompt(); await prompt.userChoice; updateStatus(); return;
    }
    let instructions;
    if (!/^https?:$/.test(location.protocol) || !isSecureContext) instructions = "Untuk menginstall app, buka papan melalui HTTPS atau localhost. Lalu pilih Install app atau menu install di browser.";
    else if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) instructions = "Buka menu Bagikan di browser, lalu pilih Tambahkan ke Layar Utama. Buka papan sekali saat online sebelum menggunakannya offline.";
    else instructions = "Pilih ikon install di bilah alamat atau menu browser → Install app / Pasang aplikasi. Jika opsi belum tersedia, muat ulang setelah papan selesai dibuka. Buka papan sekali saat online sebelum menggunakannya offline.";
    document.querySelector("#install-instructions").textContent = instructions;
    document.querySelector("#install-dialog").showModal();
  });
  updateStatus();
  if ("serviceWorker" in navigator && isSecureContext && /^https?:$/.test(location.protocol)) {
    const failed = () => {
      offlineFailed = true; updateStatus();
      status.title = "Coba muat ulang saat tersambung internet.";
    };
    navigator.serviceWorker.register("./service-worker.js").then((registration) => {
      const worker = registration.installing;
      if (worker) worker.addEventListener("statechange", () => { if (worker.state === "redundant" && !registration.active) failed(); });
      return navigator.serviceWorker.ready;
    }).then(() => { offlineReady = true; offlineFailed = false; updateStatus(); }).catch(failed);
  }
})();
