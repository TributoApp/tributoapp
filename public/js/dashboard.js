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

  const cargarFacturas = (mes, anio) => {
    resumenFact.textContent = "$0.00";
    resumenIIBB.textContent = "$0.00";
    tablaFacturas.innerHTML = `
      <tr>
        <td colspan="4" class="px-4 py-3 text-center text-gray-500">
          🔄 Cargando datos...
        </td>
      </tr>
    `;

    fetch('/api/facturas', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
      .then(res => res.json())
      .then(facturas => {
        const filtradas = facturas.filter(f => {
          const fecha = new Date(f.fecha);
          return fecha.getMonth() + 1 === mes &&
                 fecha.getFullYear() === anio;
        });

        const total = filtradas.reduce((sum, f) => sum + parseFloat(f.importe), 0);
        const porcentaje = parseFloat(localStorage.getItem('iibb')) || 3.5;
        const iibb = total * (porcentaje / 100);

        resumenFact.textContent = `$${total.toFixed(2)}`;
        resumenIIBB.textContent = `$${iibb.toFixed(2)}`;

        if (filtradas.length === 0) {
          tablaFacturas.innerHTML = `
            <tr>
              <td colspan="4" class="px-4 py-3 text-center text-gray-500">
                No hay facturas registradas para este mes.
              </td>
            </tr>
          `;
          return;
        }

        tablaFacturas.innerHTML = "";
        filtradas.forEach(f => {
          const fechaFormateada = new Date(f.fecha).toLocaleDateString('es-AR');
          const tr = document.createElement("tr");
          tr.className = "border-b hover:bg-gray-50";

          tr.innerHTML = `
            <td class="px-4 py-2 border">${fechaFormateada}</td>
            <td class="px-4 py-2 border">${f.cliente_cuit}</td>
            <td class="px-4 py-2 border">$${Number(f.importe).toFixed(2)}</td>
            <td class="px-4 py-2 border">
              ${f.id
                ? `<a href="/api/facturas/${f.id}/pdf" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">📄 Ver PDF</a>`
                : `<span class="text-gray-400 italic">No disponible</span>`}
            </td>
          `;
          tablaFacturas.appendChild(tr);
        });
      })
      .catch(err => {
        console.error("❌ Error al cargar facturas:", err);
        tablaFacturas.innerHTML = `
          <tr>
            <td colspan="4" class="px-4 py-3 text-center text-red-600">
              ❌ Error al cargar facturas.
            </td>
          </tr>
        `;
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
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mb-4">
      <p class="font-semibold">Atención:</p>
      <p>Para poder emitir facturas electrónicas desde TributoApp necesitás <strong>autorizarnos en AFIP</strong>.</p>
      <p>En la sección <strong>Tutoriales -> Autorizar en AFIP</strong> vas a encontrar el tutorial paso a paso para hacerlo.</p>
    </div>
    <div class="bg-white p-6 rounded shadow-md max-w-2xl mx-auto">
      <h2 class="text-2xl font-bold text-blue-600 mb-4">Generar Factura</h2>
      <form id="facturaForm" class="space-y-4">

          <div>
            <label class="block font-medium mb-1">CUIT del usuario</label>
            <input type="text" name="cuit_usuario" id="cuit_usuario" required class="w-full border border-gray-300 p-2 rounded" readonly>
          </div>
          <div>
        
          <div class="mb-4">
          <label for="condicion_iva" class="block mb-1 font-medium">Condición frente al IVA del cliente</label>
          <select name="condicion_iva" id="condicion_iva" required class="w-full border border-gray-300 p-2 rounded">
            <option value="" disabled selected>Seleccionar condición</option>
            <option value="1">IVA Responsable Inscripto</option>
            <option value="5">Consumidor Final</option>
            <option value="6">Responsable Monotributo</option>
          </select>

          <div class="mb-4 flex gap-4 items-end">
            <!-- Tipo de Documento -->
            <div class="flex-1" id="tipoDocumentoContainer" style="display:none;">
              <label for="tipo_documento" class="block mb-1 font-medium">Tipo de Documento</label>
              <select name="tipo_documento" id="tipo_documento" class="w-full border border-gray-300 p-2 rounded" required>
                <!-- Se completa dinámicamente -->
              </select>
            </div>

            <!-- Número de Documento -->
            <div class="flex-1">
              <label for="cliente_cuit" class="block mb-1 font-medium">Número de Documento</label>
              <input type="text" name="cliente_cuit" id="cliente_cuit" class="w-full border border-gray-300 p-2 rounded" required>
            </div>
          </div>

          <!-- Mensaje de error -->
          <div class="mt-2 text-sm text-red-600" id="padronError" style="display:none;">
            ❌ Error de Arca. Ingrese Razón Social y Dirección manualmente.
          </div>

          <div class="mb-4">
            <label class="block font-medium">Nombre o Razón Social</label>
            <input type="text" id="razonSocial" name="razonSocial" class="w-full border border-gray-300 p-2 rounded" readonly />
          </div>

          <div class="mb-4">
            <label class="block font-medium">Dirección</label>
            <input type="text" id="direccion" name="direccion" class="w-full border border-gray-300 p-2 rounded" readonly />
          </div>

          <div class="mb-4">
          <label for="concepto" class="block font-medium mb-1">Concepto</label>
          <select name="concepto" id="concepto" class="w-full border border-gray-300 p-2 rounded" required>
            <option value="1">Productos</option>
            <option value="2">Servicios</option>
            <option value="3">Productos y Servicios</option>
          </select>
        </div>

        <div id="fechasServicio" style="display: none;">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block font-medium mb-1">Fecha Servicio Desde</label>
              <input type="date" id="fecha_serv_desde" name="fecha_serv_desde" class="w-full border border-gray-300 p-2 rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Fecha Servicio Hasta</label>
              <input type="date" id="fecha_serv_hasta" name="fecha_serv_hasta" class="w-full border border-gray-300 p-2 rounded">
            </div>
            <div>
              <label class="block font-medium mb-1">Fecha Vencimiento Pago</label>
              <input type="date" id="fecha_venc_pago" name="fecha_venc_pago" class="w-full border border-gray-300 p-2 rounded">
            </div>
          </div>
        </div>


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

          <div class="mt-4">
            <label class="block font-medium mb-1">Precio Total</label>
            <input type="text" id="precio_total" class="w-full border border-gray-300 p-2 rounded bg-gray-100" readonly>
          </div>

          </div>
       
          <div>
            <label class="block font-medium mb-1">Fecha</label>
            <input type="date" name="fecha" id="fecha" required class="w-full border border-gray-300 p-2 rounded" readonly>
          </div>
       
        <button id="emitirBtn" type="submit" class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center gap-2">
          <span id="btnText">Generar Factura</span>
          <svg id="btnSpinner" class="hidden animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </button>

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

    const condicionIVASelect = document.getElementById('condicion_iva');
    const tipoDocumentoContainer = document.getElementById('tipoDocumentoContainer');
    const tipoDocumentoSelect = document.getElementById('tipo_documento');
    const clienteCuitInput = document.getElementById('cliente_cuit');
    const razonSocialInput = document.getElementById('razonSocial');
    const direccionInput = document.getElementById('direccion');
    const padronErrorDiv = document.getElementById('padronError');
    const conceptoSelect = document.getElementById('concepto');
    const fechasServicioDiv = document.getElementById('fechasServicio');
    const cantidadInput = document.querySelector('input[name="cantidad"]');
    const precioUnitarioInput = document.querySelector('input[name="precio_unitario"]');
    const precioTotalInput = document.getElementById('precio_total');
    const emitirBtn = document.getElementById('emitirBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');

    // Mostrar opciones del tipo de documento según IVA
    condicionIVASelect.addEventListener('change', () => {
      const valor = condicionIVASelect.value;
      tipoDocumentoSelect.innerHTML = '';

      if (valor === '2') {
        // Responsable Monotributo
        tipoDocumentoContainer.style.display = 'block';
        tipoDocumentoSelect.innerHTML = `
          <option value="96">DNI</option>
          <option value="80">CUIT</option>
          <option value="86">CUIL</option>
          <option value="99">Consumidor Final</option>
        `;
      } else if (valor === '1' || valor === '6') {
        // Responsable Inscripto o Exento
        tipoDocumentoContainer.style.display = 'block';
        tipoDocumentoSelect.innerHTML = `<option value="80">CUIT</option>`;
      } else {
        tipoDocumentoContainer.style.display = 'block';
        tipoDocumentoSelect.innerHTML = `<option value="99">Consumidor Final</option>`;
      }
    });

    // Consulta automática al padrón AFIP
    clienteCuitInput.addEventListener('blur', async () => {
      const tipoDoc = tipoDocumentoSelect.value;
      const nroDoc = clienteCuitInput.value.trim();

      if (tipoDoc !== '80') return;
      if (!/^\d{11}$/.test(nroDoc)) return;

      razonSocialInput.value = '';
      direccionInput.value = '';
      razonSocialInput.readOnly = true;
      direccionInput.readOnly = true;
      padronErrorDiv.style.display = 'none';

      try {
        const res = await fetch(`/api/afip/padron/${nroDoc}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await res.json();

        if (res.ok && data.razonSocial) {
          razonSocialInput.value = data.razonSocial || '';
          direccionInput.value = data.domicilioFiscal?.direccion || '';
          razonSocialInput.readOnly = true;
          direccionInput.readOnly = true;
        } else {
          razonSocialInput.readOnly = false;
          direccionInput.readOnly = false;
          padronErrorDiv.style.display = 'block';
          setTimeout(() => {
            padronErrorDiv.style.display = 'none';
          }, 5000);
        }
      } catch (err) {
        razonSocialInput.readOnly = false;
        direccionInput.readOnly = false;
        padronErrorDiv.style.display = 'block';
        setTimeout(() => {
          padronErrorDiv.style.display = 'none';
        }, 5000);
      }
    });

    // Mostrar u ocultar fechas según el concepto
    conceptoSelect.addEventListener('change', () => {
      const valor = parseInt(conceptoSelect.value);
      if (valor === 2 || valor === 3) {
        fechasServicioDiv.style.display = 'block';
      } else {
        fechasServicioDiv.style.display = 'none';
      }
    });

    function actualizarPrecioTotal() {
      const cantidad = parseFloat(cantidadInput.value);
      const precioUnitario = parseFloat(precioUnitarioInput.value);

      if (!isNaN(cantidad) && !isNaN(precioUnitario)) {
        const total = cantidad * precioUnitario;
        precioTotalInput.value = total.toFixed(2);
      } else {
        precioTotalInput.value = '';
      }
    }

    cantidadInput.addEventListener('input', actualizarPrecioTotal);
    precioUnitarioInput.addEventListener('input', actualizarPrecioTotal);
    actualizarPrecioTotal();

    // Envío del formulario
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const cuit_usuario = formData.get('cuit_usuario');
      const cliente_cuit = formData.get('cliente_cuit');
      const tipo_documento = parseInt(formData.get('tipo_documento'));
      const tipo_cbte = parseInt(formData.get('tipo_cbte'));
      const descripcion = formData.get('descripcion');
      const cantidad = parseFloat(formData.get('cantidad'));
      const precio_unitario = parseFloat(formData.get('precio_unitario'));
      const importe = cantidad * precio_unitario;
      const fecha = formData.get('fecha');
      const razonSocial = formData.get('razonSocial');
      const direccion = formData.get('direccion');
      const concepto = parseInt(formData.get('concepto')) || 1;
      const fecha_serv_desde = formData.get('fecha_serv_desde') || null;
      const fecha_serv_hasta = formData.get('fecha_serv_hasta') || null;
      const fecha_venc_pago = formData.get('fecha_venc_pago') || null;

      const condicionIVASelect = document.getElementById('condicion_iva');
      const condicion_iva = condicionIVASelect.value;
      const condicion_iva_texto = condicionIVASelect.options[condicionIVASelect.selectedIndex]?.text || '';

      // 🔄 Obtener datos fiscales actualizados desde el backend
      let nombre = '';
      let nombre_fantasia = '';
      let domicilio_fiscal = '';
      let inicio_actividades = '';

      try {
        const res = await fetch('/api/perfil/datos-fiscales', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!res.ok) throw new Error('No se pudieron obtener los datos fiscales');

        const datos = await res.json();

        nombre = datos.nombre || '';
        nombre_fantasia = datos.nombre_fantasia || '';
        domicilio_fiscal = datos.domicilio_fiscal || '';
        inicio_actividades = datos.inicio_actividades || '';
      } catch (err) {
        resultDiv.innerHTML = `❌ Error al obtener datos fiscales: ${err.message}`;
        return;
      }

      // Desactivar botón y mostrar spinner
      emitirBtn.disabled = true;
      btnText.textContent = 'Generando...';
      btnSpinner.classList.remove('hidden');

      if (
        !cuit_usuario || !cliente_cuit || isNaN(tipo_cbte) || !fecha ||
        !descripcion || isNaN(cantidad) || isNaN(precio_unitario)
      ) {
        resultDiv.innerHTML = `❌ Por favor completá todos los campos correctamente.`;
        return;
      }

      const facturaPayload = {
        cuit_usuario,
        cliente_cuit,
        tipo_cbte,
        tipo_documento,
        descripcion,
        cantidad,
        precio_unitario,
        importe,
        fecha,
        razonSocial,
        direccion,
        concepto,
        fecha_serv_desde,
        fecha_serv_hasta,
        fecha_venc_pago,
        nombre,
        nombre_fantasia,
        domicilio_fiscal,
        inicio_actividades,
        condicion_iva,
        condicion_iva_texto
      };

      try {
        // 👉 Emitir en AFIP (el backend ya guarda en DB)
        const afipResponse = await fetch('/api/afip/emitir', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(facturaPayload)
        });

        if (!afipResponse.ok) {
          const errorText = await afipResponse.text();
          throw new Error(`Falló la conexión con AFIP: ${errorText}`);
        }

        // ✅ Descargar PDF generado
        const pdfBlob = await afipResponse.blob();
        const url = window.URL.createObjectURL(pdfBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `factura.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);

        resultDiv.innerHTML = `
          ✅ <strong>Factura registrada correctamente</strong><br>
          El archivo PDF fue generado y descargado correctamente.
        `;

        form.reset();

      } catch (error) {
        console.error("❌ Error en el proceso:", error);
        resultDiv.innerHTML = `
          ❌ <strong>Error:</strong> ${error.message}
        `;
      } finally {
        emitirBtn.disabled = false;
        btnText.textContent = 'Generar Factura';
        btnSpinner.classList.add('hidden');
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
//    document.getElementById("solicitar341").addEventListener("click", async () => {
//      const resultado = document.getElementById("iibbResultado");

//      try {
//       const res = await fetch("/api/facturasmail/iibb", {
//          method: "POST",
//          headers: {
//            "Content-Type": "application/json",
//            "Authorization": `Bearer ${localStorage.getItem('token')}`
//          },
//          body: JSON.stringify({ cuit_usuario })
//        });

//        const data = await res.json();
//        resultado.innerHTML = res.ok
//          ? `✅ Solicitud enviada correctamente. En breve recibirás el Formulario 341.`
//          : `❌ Error al solicitar el Formulario 341: ${data.message || "Error desconocido"}`;
//      } catch (err) {
//        resultado.innerHTML = `❌ Error inesperado: ${err.message}`;
//      }
//    });

    // Solicitud DDJJ
//    document.getElementById("solicitarDDJJ").addEventListener("click", async () => {
//      const resultado = document.getElementById("ddjjResultado");

//      try {
//        const res = await fetch("/api/facturasmail/ddjj", {
//          method: "POST",
//          headers: {
//            "Content-Type": "application/json",
//            "Authorization": `Bearer ${localStorage.getItem('token')}`
//          },
//          body: JSON.stringify({ cuit_usuario })
//        });

//        const data = await res.json();
//        resultado.innerHTML = res.ok
//          ? `✅ Solicitud de DDJJ enviada correctamente. Te contactaremos a la brevedad.`
//          : `❌ Error al solicitar la DDJJ: ${data.message || "Error desconocido"}`;
//      } catch (err) {
//        resultado.innerHTML = `❌ Error inesperado: ${err.message}`;
//      }
//    });

  }, 100);

  break;

case "tutorial":
  title.textContent = "Tutoriales";
  content.innerHTML = `
    <div class="bg-white p-6 rounded shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4 text-blue-600">Aprendé paso a paso</h2>
      <p class="mb-2">Acá vas a encontrar tutoriales para todo lo que necesites.</p>
      <ul class="list-disc list-inside text-gray-700 mb-6">
        <li>Cómo autorizar nuestro CUIT en AFIP.</li>
        <li>Cómo interpretar los paneles de Facturas, Gastos e IIBB.</li>
        <li>Cómo presentar y pagar los impuestos.</li>
      </ul>
    </div>

    <div class="bg-white p-6 rounded shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-blue-600">Seleccioná un tutorial</h2>
      <div class="flex flex-wrap gap-4 mb-6">
        <button class="tutorial-btn bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-blue-100" onclick="mostrarTutorial('afip', this)">Autorizar en AFIP</button>
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
      case 'afip':
        cont.innerHTML = `
          <div class="bg-white p-6 rounded shadow-md">
            <h2 class="text-xl font-bold text-blue-700 mb-4">Autorizar a TributoApp en AFIP</h2>
            <p class="mb-4">Para que podamos facturar electrónicamente a tu nombre sin pedirte tu clave, necesitás autorizarnos desde tu cuenta de AFIP. Es un proceso rápido y 100% seguro.</p>
            <ol class="list-decimal list-inside space-y-2 text-sm text-gray-800">
              <li>Ingresá a <a href="https://www.afip.gob.ar" target="_blank" class="text-blue-600 underline">afip.gob.ar</a> con tu CUIT y clave fiscal.</li>
              <li>Buscá el servicio <strong>Administrador de Relaciones</strong> y hacé clic.</li>
              <li>Elegí la opción <strong>“Nueva relación”</strong>.</li>
              <li>Seleccioná el servicio <strong>“Comprobantes en línea”</strong>.</li>
              <li>Cuando te pida el CUIT del apoderado, ingresá: <strong class="text-blue-700">20387758578</strong>.</li>
              <li>Confirmá la autorización.</li>
            </ol>
            <p class="mt-4 text-sm text-gray-700">Una vez autorizado, nosotros nos encargamos de la facturación. Podés revocar este permiso cuando quieras desde el mismo portal.</p>
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
          <p class="mb-2">2. Verificá el total mensual y las fechas límite.</p>
          <p class="mb-2">3. Podés usar VEP o generar el formulario desde Mis Facilidades.</p>
        `;
        break;
    }
  };
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

case "plan": {
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
            ? `Tu Plan finaliza el <strong>${finPrueba.toLocaleDateString()}</strong>.`
            : `Tu Plan ha finalizado.`
        }
      </p>
      <a href="https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=44447526-667f53f6-35bf-422c-a452-1ff58029887c"
        target="_blank" rel="noopener noreferrer"
        class="bg-green-600 text-white px-6 py-2 rounded-lg text-lg hover:bg-green-700">
        Adquirir Plan por $9.999
      </a>
    </div>
  `;
  break;
}

case "config": 
title.textContent = "Configuración";
  content.innerHTML = `
    <div class="bg-white p-6 rounded shadow-md max-w-2xl mx-auto text-center">
      <h2 class="text-2xl font-bold text-blue-700 mb-4">Terminá de configurar tus datos</h2>
      <p class="text-gray-700 mb-6">Cargá tus datos para poder generar las facturas:</p>

      <form id="datosFiscalesForm" class="space-y-4">
      <div>
        <label class="block font-medium">Domicilio Fiscal</label>
        <input type="text" name="domicilio_fiscal" required class="w-full border border-gray-300 p-2 rounded">
      </div>

      <div>
        <label class="block font-medium">Nombre de Fantasía (Opcional)</label>
        <input type="text" name="nombre_fantasia" class="w-full border border-gray-300 p-2 rounded">
      </div>

      <div>
        <label class="block font-medium">Nº de Inscripción en IIBB</label>
        <input type="text" name="numiibb" required class="w-full border border-gray-300 p-2 rounded">
      </div>

      <div>
        <label class="block font-medium">Fecha de Inicio de Actividades</label>
        <input type="date" name="inicio_actividades" required class="w-full border border-gray-300 p-2 rounded">
      </div>

      <button type="submit" class="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
        Guardar Datos Fiscales
      </button>
    </form>
  `;

  document.getElementById('datosFiscalesForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const datos = Object.fromEntries(formData.entries());

  try {
      const response = await fetch('/api/perfil/datos-fiscales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datos),
    });

    if (response.ok) {
      alert('Datos fiscales guardados correctamente.');
    } else {
      alert('Error al guardar los datos fiscales.');
    }
  } catch (error) {
    console.error('Error al enviar datos:', error);
  }
});

fetch('/api/perfil/datos-fiscales', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => {
  if (!res.ok) throw new Error('No se pudieron obtener los datos fiscales');
  return res.json();
})
.then(datos => {
  document.querySelector('[name="domicilio_fiscal"]').value = datos.domicilio_fiscal || '';
  document.querySelector('[name="nombre_fantasia"]').value = datos.nombre_fantasia || '';
  document.querySelector('[name="numiibb"]').value = datos.numiibb || '';
  document.querySelector('[name="inicio_actividades"]').value = datos.inicio_actividades?.slice(0, 10) || '';

})

.catch(err => {
  console.error(err);
  // Podés mostrar un mensaje si querés
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
          <label class="block mt-2">Fin prueba (YYYY-MM-DD):
            <input type="date" value="${u.fin_prueba?.slice(0,10)}" 
              data-cuit="${u.cuit}" class="finprueba-input border rounded p-1 ml-2">
          </label>
          <button data-cuit="${u.cuit}" class="extender-btn bg-blue-500 text-white px-2 py-1 rounded mt-2 hover:bg-blue-600">
             Extender 30 días
          </button>
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

      document.querySelectorAll('.extender-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const cuit = btn.dataset.cuit;

    try {
      const res = await fetch('/api/usuarios/extender-prueba', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ cuit })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ Período de prueba extendido hasta el ${data.nuevaFecha}`);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Error al extender prueba');
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
      const pendientes = facturas.filter(f => f.estado === 'pendiente');

      let html = `
        <table class="min-w-full border-collapse border border-gray-300 text-sm">
          <thead class="bg-gray-200">
            <tr>
              <th class="p-2 border">CUIT Usuario</th>
              <th class="p-2 border">Cliente CUIT</th>
              <th class="p-2 border">Importe</th>
              <th class="p-2 border">Fecha</th>
              <th class="p-2 border">Estado</th>
              <th class="p-2 border">Eliminar</th>
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
            <td class="p-2 border text-center">
              <button class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700" onclick="eliminarFactura(${f.id})">
                🗑️ Eliminar
              </button>
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      lista.innerHTML = html;
    })
    .catch(err => console.error("❌ Error al cargar facturas para admin:", err));
  }
  break;


    default:
      title.textContent = "Bienvenido";
      content.innerHTML = `<p>Seleccioná una opción del menú para comenzar.</p>`;
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
