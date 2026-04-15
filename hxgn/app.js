const API_URL = "https://r0x.cl/api-hxgn/vehiculos.php";

const tablaVehiculos = document.getElementById("tablaVehiculos");
const totalVehiculos = document.getElementById("totalVehiculos");
const estadoApi = document.getElementById("estadoApi");
const btnRecargar = document.getElementById("btnRecargar");

async function cargarVehiculos() {
  tablaVehiculos.innerHTML = `
    <tr>
      <td colspan="11" class="loading">Cargando datos...</td>
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

    totalVehiculos.textContent = result.total;
    estadoApi.textContent = "Conectada";
    estadoApi.className = "estado-ok";

    if (!result.data || result.data.length === 0) {
      tablaVehiculos.innerHTML = `
        <tr>
          <td colspan="11" class="empty">No hay vehículos registrados.</td>
        </tr>
      `;
      return;
    }

    tablaVehiculos.innerHTML = result.data.map(v => `
      <tr>
        <td>${v.id_vehiculo ?? ""}</td>
        <td>${v.nro_interno ?? "-"}</td>
        <td>${v.patente ?? "-"}</td>
        <td>${v.marca ?? "-"}</td>
        <td>${v.modelo ?? "-"}</td>
        <td>${v.empresa ?? "-"}</td>
        <td>${v.tipo_equipo ?? "-"}</td>
        <td>${v.categoria ?? "-"}</td>
        <td>${v.faena ?? "-"}</td>
        <td>${v.ubicacion_actual ?? "-"}</td>
        <td>${v.estado_general ?? "-"}</td>
      </tr>
    `).join("");

  } catch (error) {
    console.error(error);

    totalVehiculos.textContent = "0";
    estadoApi.textContent = "Error";
    estadoApi.className = "estado-error";

    tablaVehiculos.innerHTML = `
      <tr>
        <td colspan="11" class="error">
          No se pudo cargar la información desde la API.
        </td>
      </tr>
    `;
  }
}

btnRecargar.addEventListener("click", cargarVehiculos);
cargarVehiculos();
