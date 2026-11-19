const loginPanel = document.querySelector("#login");
const consolePanel = document.querySelector("#console");
const loginError = document.querySelector("#login-error");
const statusPill = document.querySelector("#status");
const messagesPanel = document.querySelector("#messages");
let socket;
let agentName = "";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function addMessage(message) {
  const item = document.createElement("article");
  item.className = "message";
  item.innerHTML = "<strong>" + escapeHtml(message.sender) + "</strong><p>" + escapeHtml(message.text) +
    "</p><time>" + new Date(message.sentAt).toLocaleString() + "</time>";
  messagesPanel.append(item);
  messagesPanel.scrollTop = messagesPanel.scrollHeight;
}
function connect() {
  const scheme = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(scheme + "//" + location.host + "/ws");
  socket.addEventListener("open", () => {
    statusPill.textContent = "Conectado";
    statusPill.classList.add("online");
  });
  socket.addEventListener("close", () => {
    statusPill.textContent = "Reconectando…";
    statusPill.classList.remove("online");
    setTimeout(connect, 2000);
  });
  socket.addEventListener("message", event => {
    const payload = JSON.parse(event.data);
    if (payload.type === "history") payload.messages.forEach(addMessage);
    if (payload.type === "message") addMessage(payload.message);
  });
}
document.querySelector("#login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  agentName = String(data.get("sender")).trim();
  try {
    const response = await fetch("/api/session", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: data.get("key") })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo iniciar sesión");
    loginPanel.hidden = true;
    consolePanel.hidden = false;
    const historyResponse = await fetch("/api/messages");
    if (!historyResponse.ok) throw new Error("No se pudo recuperar el historial");
    const history = await historyResponse.json();
    history.forEach(addMessage);
    connect();
  } catch (error) {
    loginError.textContent = error.message;
  }
});
document.querySelector("#message-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#message");
  if (socket?.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ sender: agentName, text: input.value }));
  input.value = "";
});
