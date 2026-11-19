const products = [
  { id: "vest", name: "Chaleco reflectante", category: "Seguridad", cents: 2490, detail: "Alta visibilidad para trabajo en almacén." },
  { id: "gloves", name: "Guantes anticorte", category: "Protección", cents: 1890, detail: "Pack de 2 pares, talla universal." },
  { id: "lamp", name: "Lámpara de inspección", category: "Herramientas", cents: 4290, detail: "Luz recargable para revisión de equipos." },
  { id: "kit", name: "Kit de señalización", category: "Instalaciones", cents: 6490, detail: "Conos y cinta para aislar una zona." }
];
const cart = new Map(JSON.parse(localStorage.getItem("norte-cart") || "[]"));
let couponApplied = false;
const money = cents => new Intl.NumberFormat("es-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function persist() { localStorage.setItem("norte-cart", JSON.stringify([...cart])); }
function renderProducts() {
  document.querySelector("#products").innerHTML = products.map(item =>
    '<article class="product"><span class="category">' + escapeHtml(item.category) + '</span><h3>' + escapeHtml(item.name) +
    '</h3><p>' + escapeHtml(item.detail) + '</p><div class="bottom"><span class="price">' + money(item.cents) +
    '</span><button data-add="' + item.id + '">Agregar</button></div></article>'
  ).join("");
}
function totals() {
  const subtotal = products.reduce((sum, item) => sum + item.cents * (cart.get(item.id) || 0), 0);
  const discount = couponApplied ? Math.round(subtotal * 0.10) : 0;
  const shipping = subtotal === 0 || subtotal >= 15000 ? 0 : 1200;
  const tax = Math.round((subtotal - discount) * 0.085);
  return { subtotal, discount, shipping, tax, total: subtotal - discount + shipping + tax };
}
function renderCart() {
  const lines = products.filter(item => cart.get(item.id)).map(item =>
    '<div class="cart-item"><span>' + escapeHtml(item.name) + ' × ' + cart.get(item.id) + '</span><span>' +
    money(item.cents * cart.get(item.id)) + ' <button class="remove" data-remove="' + item.id + '" aria-label="Quitar ' + escapeHtml(item.name) + '">×</button></span></div>'
  ).join("");
  document.querySelector("#cart").innerHTML = lines || '<p class="fine">Tu carrito está vacío.</p>';
  const value = totals();
  document.querySelector("#totals").innerHTML =
    '<div class="total-line"><span>Subtotal</span><span>' + money(value.subtotal) + '</span></div>' +
    '<div class="total-line"><span>Descuento</span><span>−' + money(value.discount) + '</span></div>' +
    '<div class="total-line"><span>Envío</span><span>' + (value.shipping ? money(value.shipping) : "Gratis") + '</span></div>' +
    '<div class="total-line"><span>Impuestos estimados</span><span>' + money(value.tax) + '</span></div>' +
    '<div class="total-line grand"><span>Total</span><span>' + money(value.total) + '</span></div>';
}
document.querySelector("#products").addEventListener("click", event => {
  const id = event.target.dataset.add;
  if (!id) return;
  cart.set(id, (cart.get(id) || 0) + 1);
  persist(); renderCart();
});
document.querySelector("#cart").addEventListener("click", event => {
  const id = event.target.dataset.remove;
  if (!id) return;
  const count = (cart.get(id) || 0) - 1;
  if (count > 0) cart.set(id, count); else cart.delete(id);
  persist(); renderCart();
});
document.querySelector("#apply-coupon").addEventListener("click", () => {
  couponApplied = document.querySelector("#coupon").value.trim().toUpperCase() === "FIELD10";
  document.querySelector("#coupon").setCustomValidity(couponApplied || !document.querySelector("#coupon").value ? "" : "Cupón no válido");
  document.querySelector("#coupon").reportValidity();
  renderCart();
});
document.querySelector("#checkout").addEventListener("submit", event => {
  event.preventDefault();
  if (!cart.size) {
    document.querySelector("#receipt").textContent = "Agrega al menos un producto antes de confirmar.";
    return;
  }
  const form = new FormData(event.currentTarget);
  const order = {
    reference: "DEMO-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
    contact: String(form.get("contact")).trim(),
    totalCents: totals().total,
    itemCount: [...cart.values()].reduce((a, b) => a + b, 0),
    createdAt: new Date().toISOString(),
    payment: "simulated"
  };
  const orders = JSON.parse(localStorage.getItem("norte-orders") || "[]");
  orders.unshift(order);
  localStorage.setItem("norte-orders", JSON.stringify(orders.slice(0, 20)));
  document.querySelector("#receipt").textContent = "Pedido de prueba " + order.reference + " confirmado. Total " + money(order.totalCents) + ".";
  cart.clear(); couponApplied = false; persist(); renderCart(); event.currentTarget.reset();
});
renderProducts(); renderCart();
