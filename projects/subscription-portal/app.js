const prices = { starter: 8900, growth: 14900, scale: 22900 };
const labels = { starter: "Starter", growth: "Growth", scale: "Scale" };
const planInput = document.querySelector("#plan");
const seatsInput = document.querySelector("#seats");
const daysInput = document.querySelector("#days");
const summary = document.querySelector("#summary");
const current = JSON.parse(localStorage.getItem("northstar-subscription") || '{"plan":"starter","seats":12}');
planInput.value = current.plan;
seatsInput.value = current.seats;
const money = value => new Intl.NumberFormat("es-BR", { style: "currency", currency: "BRL" }).format(value / 100);

function calculate() {
  const plan = planInput.value;
  const seats = Math.min(500, Math.max(1, Number(seatsInput.value) || 1));
  const days = Math.min(30, Math.max(0, Number(daysInput.value) || 0));
  const currentMonthly = prices[current.plan] * current.seats;
  const nextMonthly = prices[plan] * seats;
  const immediate = Math.round((nextMonthly - currentMonthly) * days / 30);
  summary.innerHTML =
    '<div class="summary-line"><span>Plan actual</span><strong>' + labels[current.plan] + ' · ' + current.seats + ' licencias</strong></div>' +
    '<div class="summary-line"><span>Nuevo plan</span><strong>' + labels[plan] + ' · ' + seats + ' licencias</strong></div>' +
    '<div class="summary-line"><span>Días restantes</span><strong>' + days + ' / 30</strong></div>' +
    '<div class="summary-line"><span>Ajuste estimado ahora</span><strong>' + money(immediate) + '</strong></div>' +
    '<div class="summary-line total"><span>Próximo ciclo</span><strong>' + money(nextMonthly) + '/mes</strong></div>';
  return { plan, seats, immediate, nextMonthly };
}
[planInput,seatsInput,daysInput].forEach(input => input.addEventListener("input", calculate));
document.querySelector("#confirm").addEventListener("click", () => {
  const result = calculate();
  current.plan = result.plan;
  current.seats = result.seats;
  localStorage.setItem("northstar-subscription", JSON.stringify(current));
  const status = document.querySelector("#status");
  status.className = "status-ok";
  status.textContent = "Cambio de demostración guardado. Próximo ciclo: " + money(result.nextMonthly) + "/mes.";
});
calculate();
