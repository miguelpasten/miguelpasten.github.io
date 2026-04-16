const API_URL = "https://r0x.cl/api-hxgn/vehiculos.php";

const tablaVehiculos = document.getElementById("tablaVehiculos");
const totalVehiculos = document.getElementById("totalVehiculos");
const totalFiltrados = document.getElementById("totalFiltrados");
const estadoApi = document.getElementById("estadoApi");
const btnRecargar = document.getElementById("btnRecargar");
const btnLimpiar = document.getElementById("btnLimpiar");

const casInstalar = document.getElementById("casInstalar");
const fmsInstalar = document.getElementById("fmsInstalar");
const oasInstalar = document.getElementById("oasInstalar");
const totalDesinstalar = document.getElementById("totalDesinstalar");
const totalNoAplica = document.getElementById("totalNoAplica");

const buscarTexto = document.getElementById("buscarTexto");
const filtroEmpresa = document.getElementById("filtroEmpresa");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroTipoEquipo = document.getElementById("filtroTipoEquipo");
const filtroCas = document.getElementById("filtroCas");
const filtroFms = document.getElementById("filtroFms");
const filtroOas = document.getElementById("filtroOas");
const filtroEstado = document.getElementById("filtroEstado");

let vehiculosOriginales = [];

function badgeClase(valor) {
  if (valor === "INSTALAR") return "badge badge-instalar";
  if (valor === "DESINSTALAR") return "badge badge-desinstalar";
  if (valor === "NO_APLICA") return "badge badge-noaplica";
  return "badge";
}

function badgeHtml(valor) {
  if (!valor) return `<span class="badge">-</span>`;
  return `<span class="${badgeClase(valor)}">${valor.replace("_", " ")}</span>`;
}

function normalizar(valor) {
  return (valor ?? "").toString().trim().toUpperCase();
}

function poblarSelect(select, items) {
  const valorActual = select.value;
  const opcionesBase = select.querySelector("option")?.outerHTML || '<option value="">Todos</option>';

  select.innerHTML = opcionesBase + items
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map(item => `<option value="${item}">${item}</option>`)
    .join("");

  select.value = valorActual;
}

function actualizarFiltrosDinamicos(data) {
  const empresas = [...new Set(data.map(v => v.empresa).filter(Boolean))];
  const tipos = [...new Set(data.map(v => v.tipo_equipo).filter(Boolean))];

  poblarSelect(filtroEmpresa, empresas);
  poblarSelect(filtroTipoEquipo, tipos);
}

function aplicarFiltros() {
  const texto = normalizar(buscarTexto.value);
  const empresa = normalizar(filtroEmpresa.value);
  const categoria = normalizar(filtroCategoria.value);
  const tipoEquipo = normalizar(filtroTipoEquipo.value);
  const cas = normalizar(filtroCas.value);
  const fms = normalizar(filtroFms.value);
  const oas = normalizar(filtroOas.value);
  const estado = normalizar(filtroEstado.value);

  const filtrados = vehiculosOriginales.filter(v => {
    const textoMatch =
      !texto ||
      [
        v.id_vehiculo,
        v.nro_interno,
        v.patente,
        v.marca,
        v.modelo,
        v.empresa,
        v.tipo_equipo,
        v.categoria,
        v.faena,
        v.ubicacion_actual,
        v.estado_general
      ]
        .map(normalizar)
        .some(campo => campo.includes(texto));

    return (
      textoMatch &&
      (!empresa || normalizar(v.empresa) === empresa) &&
      (!categoria || normalizar(v.categoria) === categoria) &&
      (!tipoEquipo || normalizar(v.tipo_equipo) === tipoEquipo) &&
      (!cas || normalizar(v.cas) === cas) &&
      (!fms || normalizar(v.fms) === fms) &&
      (!oas || normalizar(v.oas) === oas) &&
      (!estado || normalizar(v.estado_general) === estado)
    );
  });

  renderTabla(filtrados);
  actualizarKpis(filtrados);
}

function actualizarKpis(data) {
  totalVehiculos.textContent = vehiculosOriginales.length;
  totalFiltrados.textContent = data.length;

  casInstalar.textContent = data.filter(v => v.cas === "INSTALAR").length;
  fmsInstalar.textContent = data.filter(v => v.fms === "INSTALAR").length;
  oasInstalar.textContent = data.filter(v => v.oas === "INSTALAR").length;

  totalDesinstalar.textContent = data.filter(v =>
    v.cas === "DESINSTALAR" || v.fms === "DESINSTALAR" || v.oas === "DESINSTALAR"
  ).length;

  totalNoAplica.textContent = data.filter(v =>
    v.cas === "NO_APLICA" && v.fms === "NO_APLICA" && v.oas === "NO_APLICA"
  ).length;
}

function renderTabla(data) {
  if (!data || data.length === 0) {
    tablaVehiculos.innerHTML = `
      <tr>
        <td colspan="14" class="empty">No hay resultados para los filtros seleccionados.</td>
      </tr>
    `;
    return;
  }

  tablaVehiculos.innerHTML = data.map(v => `
    <tr>
      <td>${v.id_vehiculo ?? ""}</td>
      <td>${v.nro_interno ?? "-"}</td>
      <td>${v.patente ?? "-"}</td>
      <td>${v.marca ?? "-"}</td>
      <td>${v.modelo ?? "-"}</td>
      <td>${v.empresa ?? "-"}</td>
      <td>${v.tipo_equipo ?? "-"}</td>
      <td>${v.categoria ?? "-"}</td>
      <td>${badgeHtml(v.cas)}</td>
      <td>${badgeHtml(v.fms)}</td>
      <td>${badgeHtml(v.oas)}</td>
      <td>${v.faena ?? "-"}</td>
      <td>${v.ubicacion_actual ?? "-"}</td>
      <td>${v.estado_general ?? "-"}</td>
    </tr>
  `).join("");
}

async function cargarVehiculos() {
  tablaVehiculos.innerHTML = `
    <tr>
      <td colspan="14" class="loading">Cargando datos...</td>
    </tr>
  `;

  estadoApi.textContent = "Conectando...";
  estadoApi.className = "";

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Error desconocido en la API");
    }

    vehiculosOriginales = result.data || [];

    estadoApi.textContent = "Conectada";
    estadoApi.className = "estado-ok";

    actualizarFiltrosDinamicos(vehiculosOriginales);
    aplicarFiltros();

  } catch (error) {
    console.error(error);

    totalVehiculos.textContent = "0";
    totalFiltrados.textContent = "0";
    casInstalar.textContent = "0";
    fmsInstalar.textContent = "0";
    oasInstalar.textContent = "0";
    totalDesinstalar.textContent = "0";
    totalNoAplica.textContent = "0";

    estadoApi.textContent = "Error";
    estadoApi.className = "estado-error";

    tablaVehiculos.innerHTML = `
      <tr>
        <td colspan="14" class="error">
          No se pudo cargar la información desde la API.
        </td>
      </tr>
    `;
  }
}

[
  buscarTexto,
  filtroEmpresa,
  filtroCategoria,
  filtroTipoEquipo,
  filtroCas,
  filtroFms,
  filtroOas,
  filtroEstado
].forEach(control => {
  control.addEventListener("input", aplicarFiltros);
  control.addEventListener("change", aplicarFiltros);
});

btnRecargar.addEventListener("click", cargarVehiculos);

btnLimpiar.addEventListener("click", () => {
  buscarTexto.value = "";
  filtroEmpresa.value = "";
  filtroCategoria.value = "";
  filtroTipoEquipo.value = "";
  filtroCas.value = "";
  filtroFms.value = "";
  filtroOas.value = "";
  filtroEstado.value = "";
  aplicarFiltros();
});

cargarVehiculos();
