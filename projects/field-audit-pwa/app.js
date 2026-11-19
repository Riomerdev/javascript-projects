const DB_NAME = "field-audit";
const STORE = "inspections";
const form = document.querySelector("#inspection-form");
const records = document.querySelector("#records");
const connection = document.querySelector("#connection");
const queueNote = document.querySelector("#queue-note");

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

const saveInspection = (item) => withStore("readwrite", store => store.put(item));
const getInspections = () => withStore("readonly", store => store.getAll());

function safe(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
}

function updateConnection() {
  const online = navigator.onLine;
  connection.textContent = online ? "En línea · almacenamiento local activo" : "Sin conexión · se guarda en este dispositivo";
  connection.classList.toggle("offline", !online);
  queueNote.textContent = online
    ? "Los registros permanecen en este navegador hasta que los exportes."
    : "Modo sin conexión activo. Tus registros se guardan localmente y no se pierden al cerrar la pestaña.";
}

async function render() {
  const items = (await getInspections()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!items.length) {
    records.innerHTML = '<div class="empty">Todavía no hay inspecciones. Crea la primera desde el formulario.</div>';
    return;
  }
  records.innerHTML = items.map(item =>
    '<article class="record"><div><h3>' + safe(item.site) + ' · ' + safe(item.area) + '</h3>' +
    '<p>' + safe(item.inspector) + ' · ' + new Date(item.createdAt).toLocaleString() + '</p>' +
    '<p>' + safe(item.findings.join(", ") || "Sin hallazgos") + '</p></div>' +
    '<span class="badge ' + (item.findings.length ? "" : "clear") + '">' +
    (item.findings.length ? item.findings.length + " hallazgo(s)" : "Sin hallazgos") + '</span></article>'
  ).join("");
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const data = new FormData(form);
  const item = {
    id: crypto.randomUUID(),
    site: data.get("site").trim(),
    inspector: data.get("inspector").trim(),
    area: data.get("area"),
    findings: data.getAll("finding"),
    notes: data.get("notes").trim(),
    createdAt: new Date().toISOString(),
    status: "local"
  };
  await saveInspection(item);
  form.reset();
  await render();
});

document.querySelector("#export").addEventListener("click", async () => {
  const data = JSON.stringify(await getInspections(), null, 2);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
  link.download = "field-audit-export.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(() => {});
updateConnection();
render().catch(error => { records.textContent = "No se pudo abrir el almacenamiento: " + error.message; });
