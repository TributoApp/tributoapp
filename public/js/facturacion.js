// public/js/facturacion.js
document.getElementById('emitirFacturaBtn').addEventListener('click', () => {
    const token = localStorage.getItem('token');
    fetch('/api/factura/emitir', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('resultado').textContent = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      document.getElementById('resultado').textContent = `Error: ${err.message}`;
    });
  });
  