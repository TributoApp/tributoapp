// dashboard.js

//Verifica fin de prueba
const finPrueba = localStorage.getItem('fin_prueba');

// Verifica token en localStorage
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
} else {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const ahora = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < ahora) {
      alert("Sesión expirada. Iniciá sesión nuevamente.");
      localStorage.clear();
      window.location.href = '/login.html';
    }

    if (finPrueba && new Date(finPrueba) < new Date()) {
      alert("Tu período de prueba ha finalizado. Contactanos para continuar.");
      localStorage.clear();
      window.location.href = '/login.html';
    }

  } catch (e) {
    localStorage.clear();
    window.location.href = '/login.html';
  }
}
const cuitLogueado = localStorage.getItem('cuit_usuario');

  const cuitAdmin = '20387758578';
  if (cuitLogueado === cuitAdmin) {
  localStorage.setItem('es_admin', 'true');
} else {
  localStorage.setItem('es_admin', 'false');
}
// Mostrar el panel de administrador si corresponde
if (localStorage.getItem('es_admin') === 'true') {
  const adminPanel = document.getElementById('adminSection');
  if (adminPanel) adminPanel.style.display = 'block';
}


// Cargar secciones dinámicamente
function loadSection(section) {
  const title = document.getElementById("section-title");
  const content = document.getElementById("section-content");

  switch (section) {
    
case "perfil":
  title.textContent = "Perfil";
  content.innerHTML = `
    <!-- Panel superior: filtros + resumen -->
    <div class="bg-gray-100 py-6 px-4 rounded shadow-md max-w-5xl mx-auto mb-8">
      
      <!-- Filtros -->
      <div class="flex flex-wrap items-center gap-4 mb-6">
        <label for="mes" class="font-medium">📆 Mes:</label>
        <select id="mes" class="border border-gray-300 p-2 rounded">
          ${Array.from({ length: 12 }, (_, i) => {
            const mes = i + 1;
            return `<option value="${mes}" ${mes === (new Date().getMonth() + 1) ? 'selected' : ''}>${mes.toString().padStart(2, '0')}</option>`;
          }).join('')}
        </select>

        <label for="anio" class="font-medium">🗓️ Año:</label>
        <select id="anio" class="border border-gray-300 p-2 rounded">
          ${[2024, 2025].map(y => `
            <option value="${y}" ${y === new Date().getFullYear() ? 'selected' : ''}>${y}</option>
          `).join('')}
        </select>

        <button id="filtrarBtn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Filtrar
        </button>
      </div>

      <!-- Tarjetas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6" id="resumenContable">
        <div class="bg-white shadow-sm rounded-lg p-6 text-center">
          <p class="text-gray-600 mb-1">Facturas generadas</p>
          <p id="totalFacturado" class="text-2xl font-bold text-blue-600">$0.00</p>
        </div>
        <div class="bg-white shadow-sm rounded-lg p-6 text-center">
          <p class="text-gray-600 mb-1">IIBB estimados</p>
          <p id="iibbEstimado" class="text-2xl font-bold text-green-600">$0.00</p>
        </div>
      </div>
      
    <!-- Tabla de facturas -->
    <div class="bg-white p-6 rounded shadow-md max-w-5xl mx-auto">
      <h2 class="text-xl font-bold text-gray-800 mb-4">Facturas del período</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm border">
          <thead class="bg-gray-100 text-gray-700">
            <tr>
              <th class="px-4 py-2 border">Fecha</th>
              <th class="px-4 py-2 border">Cliente CUIT</th>
              <th class="px-4 py-2 border">Importe</th>
              <th class="px-4 py-2 border">Estado</th>
              <th class="px-4 py-2 border">PDF</th>
            </tr>
          </thead>
          <tbody id="tablaFacturas">
            <tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">🔄 Cargando datos...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const resumenFact = document.getElementById('totalFacturado');
  const resumenIIBB = document.getElementById('iibbEstimado');
  const tablaFacturas = document.getElementById('tablaFacturas');
  const mesSelect = document.getElementById('mes');
  const anioSelect = document.getElementById('anio');
  const filtrarBtn = document.getElementById('filtrarBtn');
  const iibbInput = document.getElementById('iibbPorcentajeInput');
  const panelEdicion = document.getElementById('editarIibbPanel');



  const cargarFacturas = (mes, anio) => {
    resumenFact.textContent = "$0.00";
    resumenIIBB.textContent = "$0.00";
    tablaFacturas.innerHTML = `<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">🔄 Cargando datos...</td></tr>`;

    fetch('/api/facturas', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
    .then(res => res.json())
    .then(facturas => {
      const hechas = facturas.filter(f => {
        const fecha = new Date(f.fecha);
        return f.estado === 'hecha' &&
          fecha.getMonth() + 1 === mes &&
          fecha.getFullYear() === anio;
      });

      const total = hechas.reduce((sum, f) => sum + parseFloat(f.importe), 0);
      const porcentaje = parseFloat(localStorage.getItem('iibb')) || 3.5;
      const iibb = total * (porcentaje / 100);


      resumenFact.textContent = `$${total.toFixed(2)}`;
      resumenIIBB.textContent = `$${iibb.toFixed(2)}`;

      if (hechas.length === 0) {
        tablaFacturas.innerHTML = `<tr><td colspan="5" class="px-4 py-3 text-center text-gray-500">No hay facturas registradas para este mes.</td></tr>`;
        return;
      }

      tablaFacturas.innerHTML = "";
      hechas.forEach(f => {
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-gray-50";

        tr.innerHTML = `
          <td class="px-4 py-2 border">${f.fecha}</td>
          <td class="px-4 py-2 border">${f.cliente_cuit}</td>
          <td class="px-4 py-2 border">$${Number(f.importe).toFixed(2)}</td>
          <td class="px-4 py-2 border">${f.estado}</td>
          <td class="px-4 py-2 border">
            ${f.pdf_url ? `<a href="${f.pdf_url}" target="_blank" class="text-blue-600 underline">📄 Ver PDF</a>` : `<span class="text-gray-400 italic">No disponible</span>`}
          </td>
        `;
        tablaFacturas.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("❌ Error al cargar perfil:", err);
      tablaFacturas.innerHTML = `<tr><td colspan="5" class="px-4 py-3 text-center text-red-600">❌ Error al cargar facturas.</td></tr>`;
    });
  };

  // Inicial
  cargarFacturas(new Date().getMonth() + 1, new Date().getFullYear());

  // Filtro manual
  filtrarBtn.addEventListener("click", () => {
    const mes = parseInt(mesSelect.value);
    const anio = parseInt(anioSelect.value);
    cargarFacturas(mes, anio);
  });

  break;

case "facturacion":
  title.textContent = "Facturación";
  content.innerHTML = `
    <div class="bg-white p-6 rounded shadow-md max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold text-blue-600 mb-4">Generar Factura</h2>
      <form id="facturaForm" class="space-y-4">
        <div>
          <label class="block font-medium mb-1">CUIT del usuario</label>
          <input type="text" name="cuit_usuario" id="cuit_usuario" required class="w-full border border-gray-300 p-2 rounded" readonly>
        </div>
        <div>
          <label class="block font-medium mb-1">CUIT del cliente</label>
          <input type="text" name="cliente_cuit" required class="w-full border border-gray-300 p-2 rounded" placeholder="Ej: 20123456789">
        </div>
        <div>
          <label class="block font-medium mb-1">Tipo de Comprobante</label>
          <select name="tipo_cbte" required class="w-full border border-gray-300 p-2 rounded">
            <option value="11">Factura C (como Monotributista sólo podes hacer facturas C)</option>
          </select>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block font-medium mb-1">Descripción</label>
            <input type="text" name="descripcion" required class="w-full border border-gray-300 p-2 rounded" placeholder="Ej: Consultoría">
          </div>
          <div>
            <label class="block font-medium mb-1">Cantidad</label>
            <input type="number" name="cantidad" required min="1" step="1" class="w-full border border-gray-300 p-2 rounded" value="1">
          </div>
          <div>
            <label class="block font-medium mb-1">Precio unitario</label>
            <input type="number" name="precio_unitario" required min="0" step="0.01" class="w-full border border-gray-300 p-2 rounded" placeholder="Ej: 1500">
          </div>
        </div>
        <div>
          <label class="block font-medium mb-1">Fecha</label>
          <input type="date" name="fecha" id="fecha" required class="w-full border border-gray-300 p-2 rounded" readonly>
        </div>
        <button type="submit" class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
          Generar Factura
        </button>
      </form>
      <div id="facturaResultado" class="mt-6 text-sm text-gray-800"></div>
    </div>

    <div id="adminPanel" class="bg-white mt-10 p-6 rounded shadow" style="display:none;">
      <h2 class="text-xl font-bold mb-4 text-blue-700">Panel de Administración</h2>
      <div id="adminFacturasList" class="space-y-4"></div>
    </div>
  `;

  setTimeout(() => {
    const form = document.querySelector('#facturaForm');
    const resultDiv = document.querySelector('#facturaResultado');

    if (form) {
      const cuitInput = document.getElementById('cuit_usuario');
      if (cuitInput) {
        const cuitUsuario = localStorage.getItem('cuit_usuario') || '';
        cuitInput.value = cuitUsuario;
      }

      const fechaInput = document.getElementById('fecha');
      if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.value = hoy;
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const cuit_usuario = formData.get('cuit_usuario');
        const cliente_cuit = formData.get('cliente_cuit');
        const tipo_cbte = parseInt(formData.get('tipo_cbte'));
        const descripcion = formData.get('descripcion');
        const cantidad = parseFloat(formData.get('cantidad'));
        const precio_unitario = parseFloat(formData.get('precio_unitario'));
        const importe = cantidad * precio_unitario;
        const fecha = formData.get('fecha');

        if (!cuit_usuario || !cliente_cuit || isNaN(tipo_cbte) || isNaN(importe) || !fecha || !descripcion || isNaN(cantidad) || isNaN(precio_unitario)) {
          resultDiv.innerHTML = `❌ Por favor completá todos los campos correctamente.`;
          return;
        }

        try {
          const dbResponse = await fetch('/api/facturas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ cuit_usuario, cliente_cuit, tipo_cbte, descripcion, cantidad, precio_unitario, importe, fecha })
          });

          const dbData = await dbResponse.json();

          if (!dbResponse.ok) {
            resultDiv.innerHTML = `❌ Error al guardar en base de datos: ${dbData.message || 'Error desconocido'}`;
            return;
          }

          const notifResponse = await fetch('/api/facturasmail/solicitud', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ cuit_usuario, cliente_cuit, tipo_cbte, descripcion, cantidad, precio_unitario, importe, fecha })
          });

          const notifData = await notifResponse.json();

          if (!notifResponse.ok) {
            resultDiv.innerHTML = `⚠️ Factura guardada pero no se pudo notificar: ${notifData.message || 'Error en la notificación'}`;
            return;
          }

          resultDiv.innerHTML = `
            ✅ <strong>Factura registrada correctamente</strong><br>
            ID temporal: ${dbData.id || 'N/D'}<br>
            En breve recibirás confirmación.
          `;
          form.reset();
        } catch (error) {
          resultDiv.innerHTML = `❌ Error inesperado: ${error.message}`;
        }
      });
    }
   }, 250);
  break;

case "iibb":
  title.textContent = "IIBB - Rentas Misiones";

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto p-4">

      <!-- FORMULARIO 341 -->
      <div class="bg-white p-6 rounded shadow-md">
        <h2 class="text-2xl font-bold text-blue-700 mb-4">¿Qué es el Formulario 341?</h2>
        <p class="mb-4 text-gray-800">
          El <strong>Formulario 341</strong> corresponde al <strong>Pago a Cuenta de Ingresos Brutos</strong> en la provincia de Misiones.
          Es una obligación mensual para los contribuyentes que ingresen mercaderías a la Provincia de Misiones.
        </p>

        <h3 class="text-xl font-semibold text-gray-700 mt-6 mb-2">¿Por qué es importante?</h3>
        <ul class="list-disc pl-6 text-gray-800 mb-4">
          <li>Evita multas e intereses por mora.</li>
          <li>Mantiene al día tu situación fiscal provincial.</li>
          <li>Es requerido para trámites como el Libre Deuda, habilitaciones y facturación.</li>
        </ul>

        <h3 class="text-xl font-semibold text-gray-700 mb-2">¿Qué pasa si no lo pagás?</h3>
        <ul class="list-disc pl-6 text-gray-800 mb-4">
          <li>Generás deuda en Rentas Misiones.</li>
          <li>Podés quedar inhabilitado para emitir comprobantes.</li>
          <li>Podés ser incluido en un plan de ejecución fiscal o embargo.</li>
        </ul>

        <h3 class="text-xl font-semibold text-gray-700 mb-2">Costo del trámite</h3>
        <p class="text-gray-800 mb-4">
          Te facilitamos el Formulario 341 completo para abonar desde tu homebanking o con código de pago electrónico.
          La <strong>tasa</strong> del formulario es de el <strong>3.31%</strong>.
        </p>

        <button id="solicitar341" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Solicitar Formulario 341
        </button>
        <div id="iibbResultado" class="mt-4 text-sm text-gray-800"></div>
      </div>

      <!-- DDJJ IIBB -->
      <div class="bg-white p-6 rounded shadow-md">
        <h2 class="text-2xl font-bold text-blue-700 mb-4">Declaración Jurada de IIBB</h2>
        <p class="mb-4 text-gray-800">
          La <strong>Declaración Jurada de Ingresos Brutos</strong> es una presentación obligatoria que informa el monto facturado en un período determinado,
          y permite calcular cuánto se debe pagar de IIBB.
        </p>

        <h3 class="text-xl font-semibold text-gray-700 mb-2">¿Por qué es importante?</h3>
        <ul class="list-disc pl-6 text-gray-800 mb-4">
          <li>Es obligatoria incluso si no tuviste actividad.</li>
          <li>Evita sanciones por omisión o inexactitud.</li>
          <li>Es requerida para solicitar certificados de cumplimiento fiscal y realizar trámites con Rentas.</li>
        </ul>

        <h3 class="text-xl font-semibold text-gray-700 mb-2">Costo del trámite</h3>
        <p class="text-gray-800 mb-4">
          Nosotros la preparamos por vos, lista para presentar. El <strong>impuesto</strong> es como máximo el <strong>5%</strong> del valor de tu facturación mensual.
        </p>

        <button id="solicitarDDJJ" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Solicitar DDJJ IIBB
        </button>
        <div id="ddjjResultado" class="mt-4 text-sm text-gray-800"></div>
      </div>

    </div>
  `;

  setTimeout(() => {
    const cuit_usuario = localStorage.getItem('cuit_usuario');

    // Solicitud 341
    document.getElementById("solicitar341").addEventListener("click", async () => {
      const resultado = document.getElementById("iibbResultado");

      try {
        const res = await fetch("/api/facturasmail/iibb", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ cuit_usuario })
        });

        const data = await res.json();
        resultado.innerHTML = res.ok
          ? `✅ Solicitud enviada correctamente. En breve recibirás el Formulario 341.`
          : `❌ Error al solicitar el Formulario 341: ${data.message || "Error desconocido"}`;
      } catch (err) {
        resultado.innerHTML = `❌ Error inesperado: ${err.message}`;
      }
    });

    // Solicitud DDJJ
    document.getElementById("solicitarDDJJ").addEventListener("click", async () => {
      const resultado = document.getElementById("ddjjResultado");

      try {
        const res = await fetch("/api/facturasmail/ddjj", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ cuit_usuario })
        });

        const data = await res.json();
        resultado.innerHTML = res.ok
          ? `✅ Solicitud de DDJJ enviada correctamente. Te contactaremos a la brevedad.`
          : `❌ Error al solicitar la DDJJ: ${data.message || "Error desconocido"}`;
      } catch (err) {
        resultado.innerHTML = `❌ Error inesperado: ${err.message}`;
      }
    });

  }, 100);

  break;

case "tutorial":
  title.textContent = "Tutoriales";
  content.innerHTML = `
      <div class="bg-white p-6 rounded shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4 text-blue-600">Aprendé paso a paso</h2>
      <p class="mb-2">Acá vas a encontrar tutoriales para todo lo que necesites.</p>
      <ul class="list-disc list-inside text-gray-700 mb-6">
        <li>Cómo generar y cargar los certificados para facturar.</li>
        <li>Cómo interpretar los paneles de Facturas, Gastos e IIBB.</li>
        <li>Cómo presentar y pagar los impuestos.</li>
      </ul>
    </div>

    <div class="bg-white p-6 rounded shadow-md">
    <h2 class="text-xl font-semibold mb-4 text-blue-600">Aprendé paso a paso</h2>
    <p class="mb-2">Seleccioná un tutorial:</p>
    <div class="flex flex-wrap gap-4 mb-6">
      <button class="tutorial-btn bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-blue-100" onclick="mostrarTutorial('certificados', this)">Certificados AFIP</button>
      <button class="tutorial-btn bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-blue-100" onclick="mostrarTutorial('facturacion', this)">Facturación</button>
      <button class="tutorial-btn bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-blue-100" onclick="mostrarTutorial('impuestos', this)">Impuestos</button>
    </div>
    <div id="tutorial-content" class="space-y-2 text-gray-800"></div>
  </div>
  `;
 
  window.mostrarTutorial = function(nombre, boton) {
  // Marcar botón activo
  document.querySelectorAll('.tutorial-btn').forEach(btn => {
    btn.classList.remove('bg-green-100', 'text-green-800');
    btn.classList.add('bg-gray-200', 'text-gray-800');
  });

  boton.classList.remove('bg-gray-200', 'text-gray-800');
  boton.classList.add('bg-green-100', 'text-green-800');
  const cont = document.getElementById('tutorial-content');

  switch (nombre) {
    case 'certificados':
      cont.innerHTML = `
    <div class="bg-white p-6 rounded shadow-md">
     <h2 class="text-xl font-semibold mb-4 text-blue-600">Tutorial de Autorización AFIP</h2>
     <p class="mb-4">Próximamente.</p>
    
   </div>
      `;
      break;

    case 'facturacion':
      cont.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Generar factura electrónica</h3>
        <p class="mb-2">1. Andá a la sección Facturación.</p>
        <p class="mb-2">2. Completá los datos: CUIT del cliente, tipo de comprobante, importe y fecha.</p>
        <p class="mb-2">3. Presioná "Generar factura" y esperá la confirmación de AFIP.</p>
      `;
      break;

    case 'impuestos':
      cont.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Presentar y pagar impuestos</h3>
        <p class="mb-2">1. Andá a la sección IIBB.</p>
      `;
      break;
 }}
 break;

case "contacto":
  title.textContent = "Contacto";
  content.innerHTML = `
    <div class="bg-white p-6 rounded shadow-md max-w-2xl mx-auto text-center">
      <h2 class="text-2xl font-bold text-blue-700 mb-4">¿Necesitás ayuda?</h2>
      <p class="text-gray-700 mb-6">Estamos para asesorarte. Elegí el medio que más te convenga:</p>

      <div class="grid gap-6 md:grid-cols-2 text-left">

        <div class="bg-gray-100 p-4 rounded shadow">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">📞 Teléfono y WhatsApp</h3>
          <p class="text-gray-700">Llamanos o escribinos al:</p>
          <p class="font-bold text-blue-600 text-lg mt-1">+54 9 3764 24 6978</p>
          <a href="https://wa.me/5493764246978" target="_blank" class="inline-block mt-2 text-sm text-green-600 underline hover:text-green-700">Enviar mensaje por WhatsApp</a>
        </div>

        <div class="bg-gray-100 p-4 rounded shadow">
          <h3 class="text-lg font-semibold text-gray-800 mb-2">📧 Correo Electrónico</h3>
          <p class="text-gray-700">Consultas generales y soporte:</p>
          <p class="font-bold text-blue-600 mt-1">tributoapp@gmail.com</p>
          <a href="mailto:tributoapp@gmail.com" class="inline-block mt-2 text-sm text-blue-600 underline hover:text-blue-800">Enviar email</a>
        </div>

      </div>

      <div class="mt-8 text-gray-600 text-sm">
        Horario de atención: <strong>Lunes a Viernes de 7.30 a 18 hs</strong>
      </div>
    </div>
  `;
  break;

case "plan":
  title.textContent = "Plan";

  const cuit = localStorage.getItem("cuit_usuario");
  const finPrueba = new Date(localStorage.getItem("fin_prueba"));
  const hoy = new Date();
  const estaEnPrueba = hoy <= finPrueba;

  content.innerHTML = `
    <div class="bg-white p-6 rounded shadow-md max-w-xl mx-auto text-center">
      <h2 class="text-2xl font-bold text-blue-700 mb-4">Estado del Plan</h2>
      <p class="text-lg mb-4">CUIT: <strong>${cuit}</strong></p>
      <p class="text-lg mb-6">
        ${
          estaEnPrueba
            ? `Estás en período de prueba hasta el <strong>${finPrueba.toLocaleDateString()}</strong>.`
            : `Tu período de prueba ha finalizado.`
        }
      </p>
      <button id="btnPagarPremium" class="bg-green-600 text-white px-6 py-2 rounded-lg text-lg hover:bg-green-700">
        Adquirir Plan Premium por $9.999
      </button>
    </div>
  `;

  document.getElementById("btnPagarPremium").addEventListener("click", async () => {
    try {
      const res = await fetch("/api/crear-link-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuit })
      });

      const data = await res.json();

      if (res.ok && data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("❌ Error al generar el link de pago.");
      }
    } catch (err) {
      console.error("❌ Error al conectar con el servidor:", err);
      alert("❌ Error al conectar con el servidor.");
    }
  });

  break;

case "usuarios":
  title.textContent = "Usuarios Registrados";
  content.innerHTML = `
    <div class="bg-white p-6 rounded shadow-md max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-blue-700 mb-6">Gestión de Usuarios</h2>
      <div id="usuariosLista" class="space-y-4">
        <p>🔄 Cargando usuarios...</p>
      </div>
    </div>
  `;

  fetch('/api/usuarios', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(res => res.json())
    .then(usuarios => {
      const contenedor = document.getElementById('usuariosLista');
      contenedor.innerHTML = '';

      usuarios.forEach(u => {
        const card = document.createElement('div');
        card.className = 'border p-4 rounded bg-gray-50';
        card.innerHTML = `
          <p><strong>CUIT:</strong> ${u.cuit}</p>
          <p><strong>Mail:</strong> ${u.email || 'No informado'}</p>
          <label class="block mt-2">Porcentaje IIBB:
            <input type="number" min="0" max="100" step="0.1" value="${(u.iibb || 3.5)}" 
                   data-cuit="${u.cuit}" class="iibb-input border rounded p-1 ml-2 w-24">
          </label>
        `;
        contenedor.appendChild(card);
      });

      document.querySelectorAll('.iibb-input').forEach(input => {
        input.addEventListener('change', async () => {
          const cuit = input.dataset.cuit;
          const nuevoPorcentaje = parseFloat(input.value);

          try {
            const res = await fetch('/api/usuarios/editar-iibb', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ cuit, nuevoPorcentaje })
            });

            const data = await res.json();
            if (res.ok) {
              alert(`✅ Porcentaje actualizado para ${cuit}`);
            } else {
              alert(`❌ Error: ${data.message}`);
            }
          } catch (err) {
            console.error(err);
            alert('❌ Error al guardar');
          }
        });
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById('usuariosLista').innerHTML = `<p class="text-red-600">❌ Error al cargar usuarios</p>`;
    });

  break;

case "facturas_admin":
  title.textContent = "Facturas - Panel de Administración";
  content.innerHTML = `
    <div id="adminPanel" class="bg-white mt-10 p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4 text-blue-700">Panel de Administración</h2>
      <div id="adminFacturasList" class="space-y-4"></div>
    </div>
  `;


  if (cuitLogueado === cuitAdmin) {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.style.display = 'block';

const lista = document.getElementById('adminFacturasList');
if (!lista) return;

fetch('/api/facturas', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(facturas => {
  // Filtrar facturas pendientes
  const pendientes = facturas.filter(f => f.estado === 'pendiente');

  // Crear la tabla base
  let html = `
    <table class="min-w-full border-collapse border border-gray-300 text-sm">
      <thead class="bg-gray-200">
        <tr>
          <th class="p-2 border">CUIT Usuario</th>
          <th class="p-2 border">Cliente CUIT</th>
          <th class="p-2 border">Importe</th>
          <th class="p-2 border">Fecha</th>
          <th class="p-2 border">Estado</th>
          <th class="p-2 border">Acciones</th>
          <th class="p-2 border">PDF</th>
        </tr>
      </thead>
      <tbody>
  `;

  pendientes.forEach(f => {
    html += `
      <tr class="border-t border-gray-300">
        <td class="p-2 border">${f.cuit_usuario}</td>
        <td class="p-2 border">${f.cliente_cuit}</td>
        <td class="p-2 border">$${Number(f.importe).toFixed(2)}</td>
        <td class="p-2 border">${f.fecha}</td>
        <td class="p-2 border">${f.estado}</td>
        <td class="p-2 border">
        <button class="bg-green-600 text-white px-3 py-1 rounded mb-1 text-xs" onclick="marcarFacturaHecha(${f.id})">
          ✅ Marcar como hecha
        </button>
        <form class="upload-pdf-form" data-id="${f.id}" enctype="multipart/form-data">
          <input type="file" name="pdf" accept="application/pdf" required class="text-xs mb-1">
          <button type="submit" class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">Subir PDF</button>
        </form>
        <button class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 mt-1" onclick="eliminarFactura(${f.id})">
          🗑️ Eliminar
        </button>
      </td>
        <td class="p-2 border text-center">
          ${f.pdf_url ? `<a href="${f.pdf_url}" target="_blank" class="text-blue-600 underline text-xs">📄 Ver</a>` : '—'}
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  lista.innerHTML = html;

  // Agregar listeners para subir PDF
  document.querySelectorAll('.upload-pdf-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = form.dataset.id;
      const formData = new FormData(form);

      try {
        const res = await fetch(`/api/facturas/${id}/pdf`, {
          method: 'POST',
          body: formData
        });

        const data = await res.json();

        if (res.ok) {
          alert('✅ PDF subido correctamente');
          // Recargar sección o actualizar tabla
          loadSection('facturas_admin');
        } else {
          alert(`❌ Error: ${data.message}`);
        }
      } catch (err) {
        alert(`❌ Error inesperado: ${err.message}`);
      }
    });
  });

  // Eliminar una factura (solo admin)
router.delete('/facturas/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM facturas_solicitadas WHERE id = $1', [id]);
    res.json({ message: 'Factura eliminada correctamente' });
  } catch (error) {
    console.error("❌ Error al eliminar factura:", error);
    res.status(500).json({ message: 'Error al eliminar factura' });
  }
});
})
.catch(err => console.error("❌ Error al cargar facturas para admin:", err));
}
  break;

    default:
      title.textContent = "Bienvenido";
      content.innerHTML = `<p>Seleccioná una opción del menú para comenzar.</p>`;
  }
}

async function marcarFacturaHecha(id) {
  try {
    const res = await fetch(`/api/facturas/${id}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ estado: 'hecha' })
    });

    if (res.ok) {
      alert("✅ Factura marcada como hecha");
      loadSection('facturacion'); // recarga sección
    } else {
      alert("❌ No se pudo marcar la factura");
    }
  } catch (err) {
    console.error(err);
    alert("❌ Error al actualizar estado");
  }
}


function logout() {
  alert("Sesión cerrada");
  // Redirección opcional:
  window.location.href = "/login.html";
}

function eliminarFactura(id) {
  if (!confirm("¿Estás seguro de que querés eliminar esta factura?")) return;

  fetch(`/api/facturas/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(res => res.json())
    .then(data => {
      alert('✅ Factura eliminada correctamente');
      loadSection('facturas_admin'); // recarga la sección
    })
    .catch(err => {
      alert(`❌ Error al eliminar factura: ${err.message}`);
    });
}
