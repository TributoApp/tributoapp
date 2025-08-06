const fs = require('fs');
const path = require('path');
const Afip = require('@afipsdk/afip.js');

(async () => {
  try {
    const cert = fs.readFileSync(path.join(__dirname, 'cert.crt'), 'utf8');
    const key = fs.readFileSync(path.join(__dirname, 'MiClavePrivada.key'), 'utf8');

    const afip = new Afip({
      CUIT: 20387758578, // Tu CUIT real
      cert,
      key,
      production: false // o true si estás en producción
    });

    const cuitAConsultar = 20387758578; // Ejemplo válido: Telecom Argentina

    const datos = await afip.RegisterScopeThirteen.getTaxpayerDetails(cuitAConsultar);

    console.log('✅ Datos del contribuyente:');
    console.log(`Razón Social: ${datos.razonSocial}`);
    console.log(`Dirección: ${datos.domicilioFiscal.direccion}`);
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('❌ Error al consultar padrón (detalle):', error.response.data);
    } else {
      console.error('❌ Error al consultar padrón:', error.message || error);
    }
  }
})();



