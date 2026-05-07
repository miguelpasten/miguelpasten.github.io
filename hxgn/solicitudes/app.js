const API_URL = "https://r0x.cl/hxgn_solicitudes/solicitudes.php";

const estadoApi = document.getElementById("estadoApi");
const estadoApiDot = document.getElementById("estadoApiDot");
const container = document.getElementById("solicitudesContainer");

const totalSolicitudes = document.getElementById("totalSolicitudes");
const totalEquipos = document.getElementById("totalEquipos");
const avanceGlobal = document.getElementById("avanceGlobal");

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
        data.reduce((sum, item) => sum + Number(item.avance_promedio || 0), 0) / data.length
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
        <span class="badge">
          ${solicitud.total_items} equipos
        </span>
        <span class="badge">
          Avance ${avance}%
        </span>
      </div>

      <div class="progress">
        <div class="progress-bar" style="width: ${avance}%"></div>
      </div>
    `;

    container.appendChild(card);
  });
}

cargarSolicitudes();