// Configuración base (sin inventario - se carga desde API)
const CONFIG = {
  title: "Operacional",
  subtitle: "Inventario de equipos - Almacenamiento Servidores",
  logoUrl: "./img/icons/logo_blk.png",
  footerBrand: "By Miguel Pastén.",
  thresholds: {
    greenEnd: 0.65,
    amberEnd: 0.80,
  },
  inventario: [],
  fisicos: [
    { name: "Servidor Primario", ip: "10.79.1.53", value: 889, max: 3500, os: "linux" },
    { name: "Servidor Secundario", ip: "10.79.1.49", value: 1200, max: 3500, os: "linux" },
    { name: "Servidor BD MineOps", ip: "10.79.1.57", value: 556, max: 1740, os: "windows" },
    { name: "Servidor JVIEW", ip: "10.79.1.9", value: 148, max: 1090, os: "windows" },
    { name: "Servidor BD CAS", ip: "10.79.1.58", value: 919, max: 1090, os: "windows" },
    { name: "Servidor MPDATA CAS", ip: "10.78.45.2", value: 274, max: 403, os: "linux", greenEnd: 0.75, amberEnd: 0.95 },
  ],
  virtuales: [
    { name: "Servidor BD MineOps", ip: "10.77.249.7", value: 314, max: 1000, os: "windows" },
    { name: "Servidor JVIEW", ip: "10.77.249.8", value: 0.5, max: 1000, os: "windows" },
    { name: "Servidor BD CAS", ip: "10.77.249.6", value: 175, max: 1000, os: "windows" },
  ],
};

// Función para cargar inventario desde API
async function cargarInventario() {
  console.log('🔄 Intentando cargar inventario...');
  
  try {
    const response = await fetch('http://r0x.cl/hxgn/inventario.php');
    
    console.log('Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    if (data.error) {
      console.error('Error en API:', data.error);
      console.error('Detalles:', data.details);
      return;
    }
    
    if (!data.inventario || data.inventario.length === 0) {
      console.warn('️ No hay datos de inventario');
      return;
    }
    
    CONFIG.inventario = data.inventario;
    renderInventario();
    console.log('✅ Inventario cargado desde API');
    
  } catch (error) {
    console.error('❌ Error al cargar inventario:', error);
    console.error('URL intentada:', 'https://r0x.cl/hxgn/inventario.php');
  }
}

// Función para renderizar inventario
function renderInventario() {
  console.log('🎨 Renderizando inventario...', CONFIG.inventario);
  
  const grid = document.getElementById('inventarioGrid');
  
  if (!grid) {
    console.error('❌ No se encontró el elemento inventarioGrid');
    return;
  }
  
  grid.innerHTML = CONFIG.inventario.map(inv => {
    console.log(' Procesando:', inv);
    
    return `
      <div class="inv-card" style="--card-color: ${inv.color}">
        <div class="inv-header">
          <div class="inv-label">${inv.label}</div>
          <div class="inv-total-wrap">
            <div class="inv-total">${inv.total}</div>
            <div class="inv-total-label">Equipos</div>
          </div>
        </div>
        <div class="inv-subitems">
          ${inv.subitems.map(sub => {
            const icons = { 
              'CAEX': './img/icons/caex.png', 
              'PALAS': './img/icons/pala.png', 
              'TRACTOR': './img/icons/tractor.png', 
              'REGADOR': './img/icons/regador.png', 
              'MOTO': './img/icons/moto.png', 
              'PERFO': './img/icons/perfo.png' 
            };
            return `
              <div class="inv-subitem">
                <img src="${icons[sub.label] || ''}" class="inv-subitem-icon" onerror="this.style.display='none'" />
                <div class="inv-subitem-value">${sub.value}</div>
                <div class="inv-subitem-label">${sub.label}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Funciones auxiliares
function getStatus(value, max, server) {
  const ratio = value / max;
  const greenEnd = server.greenEnd ?? CONFIG.thresholds.greenEnd;
  const amberEnd = server.amberEnd ?? CONFIG.thresholds.amberEnd;
  if (ratio > amberEnd) return 'critico';
  if (ratio > greenEnd) return 'atencion';
  return 'normal';
}

function getStatusLabel(s) {
  return { normal: 'Normal', atencion: 'Atención', critico: 'Crítico' }[s];
}

function renderServerCard(s) {
  const status = getStatus(s.value, s.max, s);
  const pct = ((s.value / s.max) * 100).toFixed(1);
  const osIcon = s.os === 'linux' ? './img/icons/tux.png' : './img/icons/w11.png';
  return `
    <div class="server-card status-${status}">
      <div class="server-header">
        <img src="${osIcon}" class="server-os-icon" onerror="this.style.display='none'" />
        <div class="server-info">
          <div class="server-name">${s.name}</div>
          <div class="server-ip">${s.ip}</div>
        </div>
        <div class="server-status-badge ${status}">${getStatusLabel(status)}</div>
      </div>
      <div class="server-bar-wrap">
        <div class="server-bar-info">
          <span class="server-bar-label">Almacenamiento</span>
          <span class="server-bar-value">${s.value} / ${s.max} GB</span>
          <span class="server-pct ${status}">${pct}%</span>
        </div>
        <div class="server-bar">
          <div class="server-bar-fill ${status}" style="width: ${pct}%"></div>
        </div>
      </div>
    </div>`;
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard inicializando...');
  
  document.getElementById('subtitle').textContent = CONFIG.subtitle;
  document.getElementById('footer').textContent = `${CONFIG.footerBrand} · ${CONFIG.title}`;
  
  document.getElementById('fisicosGrid').innerHTML = CONFIG.fisicos.map(renderServerCard).join('');
  document.getElementById('virtualesGrid').innerHTML = CONFIG.virtuales.map(renderServerCard).join('');
  
  cargarInventario();
});
