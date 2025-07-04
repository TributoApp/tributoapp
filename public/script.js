const apiBase = '/api';

function registrarUsuario() {
  const nombre = document.getElementById('nombre').value;
  const cuit = document.getElementById('cuit').value;

  fetch(`${apiBase}/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, cuit }),
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('registroResultado').innerText = data.mensaje;
    });
}

function emitirFactura() {
  const cliente = document.getElementById('cliente').value;
  const monto = parseFloat(document.getElementById('montoFactura').value);

  fetch(`${apiBase}/facturacion/factura`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente, monto }),
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById('facturaResultado').innerText = JSON.stringify(data, null, 2);
    });
}

function calcularIIBB() {
  const monto = parseFloat(document.getElementById('montoIIBB').value);

  fetch(`${apiBase}/facturacion/estimacion-iibb?monto=${monto}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('iibbResultado').innerText = `IIBB estimado: $${data.iibbEstimado.toFixed(2)}`;
    });
}

function calcularGanancias() {
  const ganancia = parseFloat(document.getElementById('ganancia').value);

  fetch(`${apiBase}/facturacion/estimacion-ganancias?ganancia=${ganancia}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('gananciasResultado').innerText = `Ganancias estimadas: $${data.impuestoEstimado.toFixed(2)}`;
    });
}
