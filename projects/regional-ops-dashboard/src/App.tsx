import { useMemo, useState } from "react";
import { getLiveProducts } from "./api";
import { demoProducts } from "./data";
import type { Product } from "./types";

const regionNames: Record<string, string> = {
  "BR-SC": "Brasil · Sul",
  "US-EAST": "Estados Unidos · Este",
  "EU-WEST": "Europa · Oeste"
};

function App() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [source, setSource] = useState("Datos de demostración");
  const [status, setStatus] = useState("Muestra local lista");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("ALL");
  const [needsReorder, setNeedsReorder] = useState(false);

  const filtered = useMemo(() => products.filter((item) => {
    const matchesSearch = (item.sku + " " + item.name).toLowerCase().includes(search.toLowerCase());
    const matchesRegion = region === "ALL" || item.region === region;
    const matchesStock = !needsReorder || item.onHand <= item.reorderPoint;
    return matchesSearch && matchesRegion && matchesStock;
  }), [products, search, region, needsReorder]);

  const reorderCount = products.filter((item) => item.onHand <= item.reorderPoint).length;
  const totalUnits = products.reduce((total, item) => total + item.onHand, 0);
  const healthyCount = products.length - reorderCount;
  const regions = [...new Set(products.map((item) => item.region))];

  async function syncLive() {
    setBusy(true);
    setStatus("Conectando con Inventory Control API…");
    try {
      const result = await getLiveProducts();
      setProducts(result.items);
      setSource("API .NET en vivo");
      setStatus("Sincronizado · " + result.total + " SKU");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo conectar con la API");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const rows = [
      ["sku", "name", "region", "on_hand", "reorder_point", "status"],
      ...filtered.map((item) => [
        item.sku, item.name, item.region, String(item.onHand), String(item.reorderPoint),
        item.onHand <= item.reorderPoint ? "REORDER" : "HEALTHY"
      ])
    ];
    const csv = rows.map((row) => row.map((field) => '"' + field.replaceAll('"', '""') + '"').join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "regional-inventory.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Northstar home">
          <span className="brand-mark">N</span>
          <span>NORTHSTAR <small>OPERATIONS</small></span>
        </a>
        <div className="topbar-right">
          <span className="live-dot" aria-hidden="true" />
          <span>Portfolio demo</span>
          <span className="avatar" aria-label="Demo user">RC</span>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">CONTROL TOWER <span>/</span> INVENTORY</p>
          <h1>Regional operations</h1>
          <p className="lede">Prioriza reposiciones y revisa la disponibilidad de tus almacenes.</p>
        </div>
        <div className="toolbar">
          <button className="button secondary" type="button" onClick={exportCsv}>Exportar CSV</button>
          <button className="button primary" type="button" onClick={syncLive} disabled={busy}>
            {busy ? "Conectando…" : "Conectar API"}
          </button>
        </div>
      </section>

      <div className="status-line" role="status">
        <span className="status-dot" />
        <span>{status}</span>
        <span className="source-label">{source}</span>
      </div>

      <section className="metrics" aria-label="Indicadores de inventario">
        <article className="metric-card"><span>UNIDADES DISPONIBLES</span><strong>{totalUnits.toLocaleString()}</strong><small>En {regions.length} regiones</small></article>
        <article className="metric-card"><span>SKU MONITOREADOS</span><strong>{products.length}</strong><small>Actualización de catálogo</small></article>
        <article className="metric-card alert"><span>REPOSICIÓN PRIORITARIA</span><strong>{reorderCount}</strong><small>Igual o bajo el punto mínimo</small></article>
        <article className="metric-card"><span>DISPONIBILIDAD SANA</span><strong>{products.length ? Math.round((healthyCount / products.length) * 100) : 0}%</strong><small>{healthyCount} SKU sobre mínimo</small></article>
      </section>

      <section className="content-grid">
        <article className="panel inventory-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">INVENTARIO</p><h2>Artículos por almacén</h2></div>
            <span className="count-pill">{filtered.length} artículos</span>
          </div>
          <div className="filters">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar SKU o producto" aria-label="Buscar SKU o producto" />
            </label>
            <label className="select-label">
              <span className="visually-hidden">Filtrar por región</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                <option value="ALL">Todas las regiones</option>
                {regions.map((item) => <option key={item} value={item}>{regionNames[item] ?? item}</option>)}
              </select>
            </label>
            <label className="toggle-filter">
              <input type="checkbox" checked={needsReorder} onChange={(event) => setNeedsReorder(event.target.checked)} />
              <span>Necesitan reposición</span>
            </label>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>SKU / PRODUCTO</th><th>REGIÓN</th><th>DISPONIBLE</th><th>PUNTO MÍNIMO</th><th>ESTADO</th></tr></thead>
              <tbody>
                {filtered.map((item) => {
                  const urgent = item.onHand <= item.reorderPoint;
                  const fill = Math.min(100, Math.round((item.onHand / Math.max(1, item.reorderPoint * 2)) * 100));
                  return <tr key={item.id}>
                    <td><strong className="sku">{item.sku}</strong><span className="product-name">{item.name}</span></td>
                    <td><span className="region-tag">{item.region}</span></td>
                    <td><div className="stock-value">{item.onHand}<div className="stock-track"><span className={urgent ? "low" : ""} style={{ width: fill + "%" }} /></div></div></td>
                    <td>{item.reorderPoint} units</td>
                    <td><span className={urgent ? "badge warning" : "badge healthy"}><i />{urgent ? "Reordenar" : "Saludable"}</span></td>
                  </tr>;
                })}
                {filtered.length === 0 && <tr><td className="empty" colSpan={5}>No hay artículos para los filtros seleccionados.</td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="table-footer">Mostrando {filtered.length} de {products.length} artículos <span>Inventario demostrativo · datos ficticios</span></footer>
        </article>

        <aside className="panel regions-panel">
          <div className="panel-heading"><div><p className="eyebrow">COBERTURA</p><h2>Salud por región</h2></div></div>
          <div className="region-list">
            {regions.map((item) => {
              const stock = products.filter((product) => product.region === item);
              const flagged = stock.filter((product) => product.onHand <= product.reorderPoint).length;
              const score = stock.length ? Math.round(((stock.length - flagged) / stock.length) * 100) : 0;
              return <button className="region-row" key={item} type="button" onClick={() => setRegion(item)}>
                <span className="region-initial">{item.slice(0, 2)}</span>
                <span className="region-info"><strong>{regionNames[item] ?? item}</strong><small>{stock.length} SKU · {flagged} requieren acción</small></span>
                <span className="region-score">{score}%</span>
              </button>;
            })}
          </div>
          <div className="insight">
            <span className="insight-icon">↗</span>
            <div><strong>Acción recomendada</strong><p>{reorderCount ? "Revisa los " + reorderCount + " SKU en nivel de reposición y coordina compra." : "No hay SKU bajo el nivel de reposición."}</p></div>
          </div>
          <button className="text-button" type="button" onClick={() => { setRegion("ALL"); setNeedsReorder(true); }}>Ver prioridades <span>→</span></button>
        </aside>
      </section>
      <footer className="page-footer"><span>Northstar Operations · Portfolio project</span><span>React · TypeScript · REST API</span></footer>
    </main>
  );
}

export default App;
