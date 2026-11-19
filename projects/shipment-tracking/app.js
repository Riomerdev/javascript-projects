let shipments = [];
const container = document.querySelector("#shipments");
const detail = document.querySelector("#detail");
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const formatDate = value => new Intl.DateTimeFormat("es-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

function render() {
  const query = document.querySelector("#search").value.trim().toLowerCase();
  const status = document.querySelector("#status").value;
  const visible = shipments.filter(item =>
    (status === "all" || item.status === status) &&
    [item.tracking, item.order, item.destination].some(value => value.toLowerCase().includes(query))
  );
  document.querySelector("#result-count").textContent = visible.length + " envíos";
  document.querySelector("#metric-route").textContent = shipments.filter(item => item.status === "En ruta").length;
  document.querySelector("#metric-delayed").textContent = shipments.filter(item => item.delayed).length;
  document.querySelector("#metric-delivered").textContent = shipments.filter(item => item.status === "Entregado").length;
  container.innerHTML = visible.length ? visible.map(item =>
    '<article class="shipment" data-id="' + escapeHtml(item.tracking) + '"><div class="shipment-head"><h2>' +
    escapeHtml(item.tracking) + ' · ' + escapeHtml(item.order) + '</h2><span class="status ' + escapeHtml(item.status) + '">' +
    escapeHtml(item.status) + '</span></div><p>' + escapeHtml(item.destination) + '</p><p class="eta">ETA ' +
    formatDate(item.eta) + '</p></article>'
  ).join("") : '<p class="shipment">No hay envíos que coincidan con esos filtros.</p>';
}
function openDetail(item) {
  detail.hidden = false;
  detail.innerHTML = '<button id="close-detail" aria-label="Cerrar detalle">Cerrar</button><span class="eyebrow">GUÍA ' +
    escapeHtml(item.tracking) + '</span><h2>' + escapeHtml(item.destination) + '</h2><p>Orden ' + escapeHtml(item.order) +
    ' · ' + escapeHtml(item.status) + '</p><div class="timeline">' + item.events.map(event =>
      '<article><strong>' + escapeHtml(event.label) + '</strong><p>' + formatDate(event.time) + '</p></article>'
    ).join("") + '</div>';
  document.querySelector("#close-detail").addEventListener("click", () => { detail.hidden = true; });
}
container.addEventListener("click", event => {
  const card = event.target.closest("[data-id]");
  if (card) openDetail(shipments.find(item => item.tracking === card.dataset.id));
});
document.querySelector("#search").addEventListener("input", render);
document.querySelector("#status").addEventListener("change", render);
document.querySelector("#today").textContent = new Intl.DateTimeFormat("es-BR", { dateStyle: "full" }).format(new Date());
fetch("./data/shipments.json").then(response => response.json()).then(data => { shipments = data; render(); })
  .catch(() => { container.textContent = "No se pudo cargar el conjunto de envíos de demostración."; });
