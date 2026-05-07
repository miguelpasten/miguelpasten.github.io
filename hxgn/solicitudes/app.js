const API_BASE = "https://r0x.cl/hxgn_solicitudes";

const API_URL = `${API_BASE}/solicitudes.php`;
const API_DETALLE_URL = `${API_BASE}/solicitud_detalle.php?id=`;
const SESSION_URL = `${API_BASE}/session.php`;

let usuarioActual = null;
let solicitudesGlobal = [];

const estadoApi = document.getElementById("estadoApi");
const estadoApiDot = document.getElementById("estadoApiDot");
const container = document.getElementById("solicitudesContainer");
const sidebarMenu = document.getElementById("sidebarMenu");

const totalSolicitudes = document.getElementById("totalSolicitudes");
const totalEquipos = document.getElementById("totalEquipos");
const avanceGlobal = document.getElementById("avanceGlobal");

const modal = document.getElementById("modalDetalle");
const modalTitulo = document.getElementById("modalTitulo");
const modalBody = document.getElementById("modalBody");
const cerrarModal = document.getElementById("cerrarModal");

const busquedaInput = document.getElementById("busquedaInput");
const filtroEstado = document.getElementById("filtroEstado");
const filtroPrioridad = document.getElementById("filtroPrioridad");

if (cerrarModal) {
  cerrarModal.addEventListener("click", () => {
    modal.classList.remove("show");
  });
}

async function validarSesion() {
  try {
    const response = await fetch(SESSION_URL, {
      credentials: "include"
    });

    const result = await response.json();

    if (!result.authenticated) {
      window.location.href = "login.html";
      return false;
    }

    usuarioActual = result.usuario;
    return true;

  } catch (error) {
    window.location.href = "login.html";
    return false;
  }
}

async function cargarMenu() {
  try {
    const response = await fetch(
      `${API_BASE}/menu.php?rol=${usuarioActual.rol}`
    );

    const result = await response.json();

    if (!result.ok) {
      throw new Error("Error menú");
    }

    sidebarMenu.innerHTML = "";

    result.data.forEach((item, index) => {
      const link = document.createElement("a");

      link.href = item.ruta || "#";
      link.textContent = item.nombre;

      if (index === 0) {
        link.classList.add("active");
      }

      sidebarMenu.appendChild(link);
    });

  } catch (error) {
    sidebarMenu.innerHTML = `<a class="active">Error menú</a>`;
    console.error(error);
  }
}

async function cargarSolicitudes() {
  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!result.ok) {
      throw new Error("La API respondió con error");
    }

    estadoApi.textContent = "API conectada";
    estadoApiDot.classList.add("ok");

    solicitudesGlobal = result.data;

    renderResumen(result.data);
    renderSolicitudes(result.data);

  } catch (error) {
    estadoApi.textContent = "Error API";
    estadoApiDot.classList.add("error");
    container.innerHTML = `<div class="empty">No fue posible cargar las solicitudes.</div>`;
    console.error(error);
  }
}

function renderResumen(data) {
  const totalItems = data.reduce((sum, item) => {
    return sum + Number(item.total_items || 0);
  }, 0);

  const promedio = data.length
    ? Math.round(
        data.reduce((sum, item) => {
          return sum + Number(item.avance_promedio || 0);
        }, 0) / data.length
      )
    : 0;

  totalSolicitudes.textContent = data.length;
  totalEquipos.textContent = totalItems;
  avanceGlobal.textContent = `${promedio}%`;
}

function renderSolicitudes(data) {
  container.innerHTML = `
    <div class="tabla-header">
      <span>Solicitud</span>
      <span>Estado</span>
      <span>Prioridad</span>
      <span>Equipos</span>
      <span>Avance</span>
      <span>Acción</span>
    </div>
  `;

  data.forEach((solicitud) => {
    const avance = Number(solicitud.avance_promedio || 0);

    const row = document.createElement("div");
    row.className = "tabla-row";

    row.innerHTML = `
      <div class="solicitud-info">
        <h3>${solicitud.titulo}</h3>
        <span class="codigo-solicitud">${solicitud.codigo}</span>
      </div>

      <div>
        <span class="badge estado-${solicitud.estado}">
          ${solicitud.estado}
        </span>
      </div>

      <div>
        <span class="badge prioridad-${solicitud.prioridad}">
          ${solicitud.prioridad}
        </span>
      </div>

      <div>
        <strong>${solicitud.total_items}</strong>
      </div>

      <div>
        <div class="mini-progress">
          <div style="width:${avance}%"></div>
        </div>
        <small>${avance}%</small>
      </div>

      <div>
        <button class="btn-detalle" onclick="verDetalle(${solicitud.id})">
          Ver detalle
        </button>
      </div>
    `;

    container.appendChild(row);
  });
}

function aplicarFiltros() {
  const texto = busquedaInput.value.toLowerCase().trim();
  const estado = filtroEstado.value;
  const prioridad = filtroPrioridad.value;

  let filtradas = [...solicitudesGlobal];

  if (texto) {
    filtradas = filtradas.filter(s => {
      return (
        s.codigo.toLowerCase().includes(texto) ||
        s.titulo.toLowerCase().includes(texto) ||
        (s.descripcion || "").toLowerCase().includes(texto)
      );
    });
  }

  if (estado) {
    filtradas = filtradas.filter(s => s.estado === estado);
  }

  if (prioridad) {
    filtradas = filtradas.filter(s => s.prioridad === prioridad);
  }

  renderSolicitudes(filtradas);
}

async function verDetalle(id) {
  try {
    modal.classList.add("show");
    modalTitulo.textContent = "Cargando detalle...";
    modalBody.innerHTML = "";

    const response = await fetch(`${API_DETALLE_URL}${id}`);
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Error al cargar detalle");
    }

    modalTitulo.textContent = `${result.solicitud.codigo} · ${result.solicitud.titulo}`;

    modalBody.innerHTML = result.items.map(item => `
      <div class="detalle-item">
        <h3>${item.nro_interno || "Sin N° interno"} · ${item.tipo_equipo || "Equipo"}</h3>

        <div class="detalle-grid">
          <div class="detalle-box"><strong>Empresa</strong>${item.empresa || "—"}</div>
          <div class="detalle-box"><strong>Marca</strong>${item.marca || "—"}</div>
          <div class="detalle-box"><strong>Modelo</strong>${item.modelo || "—"}</div>
          <div class="detalle-box"><strong>Patente</strong>${item.patente || "—"}</div>
          <div class="detalle-box"><strong>Ubicación</strong>${item.ubicacion || "—"}</div>
          <div class="detalle-box"><strong>Estado</strong>${item.estado_item || "—"}</div>
          <div class="detalle-box"><strong>Avance</strong>${item.avance_porcentaje || 0}%</div>
        </div>

        <h4>Tecnologías</h4>
        <div class="meta">
          ${item.tecnologias.map(t => `
            <span class="badge">${t.codigo}: ${t.accion}</span>
          `).join("")}
        </div>

        <h4>Observaciones</h4>
        <ul class="lista-obs">
          ${item.observaciones.map(o => `<li>${o.observacion}</li>`).join("")}
        </ul>
      </div>
    `).join("");

  } catch (error) {
    modalTitulo.textContent = "Error";
    modalBody.innerHTML = `<p>No fue posible cargar el detalle.</p>`;
    console.error(error);
  }
}

if (busquedaInput) {
  busquedaInput.addEventListener("input", aplicarFiltros);
}

if (filtroEstado) {
  filtroEstado.addEventListener("change", aplicarFiltros);
}

if (filtroPrioridad) {
  filtroPrioridad.addEventListener("change", aplicarFiltros);
}

(async () => {
  const ok = await validarSesion();

  if (!ok) return;

  await cargarMenu();
  await cargarSolicitudes();
})();