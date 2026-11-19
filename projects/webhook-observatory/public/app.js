const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
async function refresh() {
  const [eventsResponse, deliveriesResponse] = await Promise.all([fetch("/api/events"), fetch("/api/deliveries")]);
  const events = await eventsResponse.json();
  const deliveries = await deliveriesResponse.json();
  document.querySelector("#event-count").textContent = events.length;
  document.querySelector("#delivery-count").textContent = deliveries.length;
  const container = document.querySelector("#events");
  container.innerHTML = events.length ? events.slice().reverse().map(event =>
    '<article class="event"><div class="event-top"><h3>' + escapeHtml(event.source) + ' · ' + escapeHtml(event.id) +
    '</h3><time>' + new Date(event.receivedAt).toLocaleString() + '</time></div><pre>' +
    escapeHtml(JSON.stringify(event.body, null, 2)) + '</pre><button data-replay="' + escapeHtml(event.id) + '">Reintentar en simulador local</button></article>'
  ).join("") : '<div class="empty">No hay eventos todavía. Envía un JSON a /hooks/{source} para iniciar.</div>';
}
document.querySelector("#refresh").addEventListener("click", () => refresh().catch(showError));
document.querySelector("#events").addEventListener("click", async event => {
  const id = event.target.dataset.replay;
  if (!id) return;
  const response = await fetch("/api/events/" + encodeURIComponent(id) + "/replay", { method: "POST" });
  const result = await response.json();
  document.querySelector("#notice").textContent = response.ok ? "Reenvío local registrado." : result.error;
  refresh().catch(showError);
});
function showError(error) { document.querySelector("#notice").textContent = "Error: " + error.message; }
refresh().catch(showError);
