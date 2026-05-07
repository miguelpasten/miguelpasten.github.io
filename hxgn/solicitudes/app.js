const API_URL = "https://r0x.cl/hxgn_solicitudes/solicitudes.php";
const API_DETALLE_URL = "https://r0x.cl/hxgn_solicitudes/solicitud_detalle.php?id=";

const estadoApi = document.getElementById("estadoApi");
const estadoApiDot = document.getElementById("estadoApiDot");
const container = document.getElementById("solicitudesContainer");

const totalSolicitudes = document.getElementById("totalSolicitudes");
const totalEquipos = document.getElementById("totalEquipos");
const avanceGlobal = document.getElementById("avanceGlobal");

const modal = document.getElementById("modalDetalle");
const modalTitulo = document.getElementById("modalTitulo");
const modalBody = document.getElementById("modalBody");
const cerrarModal = document.getElementById("cerrarModal");

cerrarModal.addEventListener("click", () => {
  modal.classList.remove("show");
});

async function cargarSolicitudes() {
  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!result.ok) {
      throw new Error("La API respondió con error");
    }

    estadoApi.textContent = "API conectada";
    estadoApiDot.classList.add("ok");

    renderSolicitudes(result.data);
    renderResumen(result.data);

  } catch (error) {
    estadoApi.textContent = "Error API";
    estadoApiDot.classList.add("error");
    container.innerHTML = `<p>No fue posible cargar las solicitudes.</p>`;
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
  container.innerHTML = "";

  data.forEach((solicitud) => {
    const avance = Number(solicitud.avance_promedio || 0);

    const card = document.createElement("article");
    card.className = "solicitud-card";

    card.innerHTML = `
      <div class="solicitud-header">
        <h3>${solicitud.codigo} · ${solicitud.titulo}</h3>
        <span class="badge prioridad-${solicitud.prioridad}">
          ${solicitud.prioridad}
        </span>
      </div>

      <p class="descripcion">${solicitud.descripcion || ""}</p>

      <div class="meta">
        <span class="badge estado-${solicitud.estado}">
          ${solicitud.estado}
        </span>
        <span class="badge">${solicitud.total_items} equipos</span>
        <span class="badge">Avance ${avance}%</span>
      </div>

      <div class="progress">
        <div class="progress-bar" style="width: ${avance}%"></div>
      </div>

      <button class="btn-detalle" onclick="verDetalle(${solicitud.id})">
        Ver detalle
      </button>
    `;

    container.appendChild(card);
  });
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
          ${item.observaciones.map(o => `
            <li>${o.observacion}</li>
          `).join("")}
        </ul>
      </div>
    `).join("");

  } catch (error) {
    modalTitulo.textContent = "Error";
    modalBody.innerHTML = `<p>No fue posible cargar el detalle.</p>`;
    console.error(error);
  }
}

cargarSolicitudes();