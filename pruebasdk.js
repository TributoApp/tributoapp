const fs = require('fs');
const Afip = require('@afipsdk/afip.js');

const cert = fs.readFileSync('cert.crt', { encoding: 'utf8' });
const key = fs.readFileSync('MiClavePrivada.key', { encoding: 'utf8' });

const afip = new Afip({
  CUIT: 20387758578, // Reemplazá con tu CUIT real
  cert,
  key
});

(async () => {
  const punto_de_venta = 1;
  const tipo_de_factura = 11; // 11 = Factura C

  try {
    const last_voucher = await afip.ElectronicBilling.getLastVoucher(punto_de_venta, tipo_de_factura);
    const numero_de_factura = last_voucher + 1;

    const concepto = 1;
    const tipo_de_documento = 80; // CUIT
    const numero_de_documento = 33693450239;
    const condicion_iva_receptor = 6; // Monotributo

    const fecha = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

    let fecha_servicio_desde = null,
        fecha_servicio_hasta = null,
        fecha_vencimiento_pago = null;

    if (concepto === 2 || concepto === 3) {
      fecha_servicio_desde = 20240601;
      fecha_servicio_hasta = 20240630;
      fecha_vencimiento_pago = 20240710;
    }

    const data = {
      CantReg: 1,
      PtoVta: punto_de_venta,
      CbteTipo: tipo_de_factura,
      Concepto: concepto,
      DocTipo: tipo_de_documento,
      DocNro: numero_de_documento,
      CbteDesde: numero_de_factura,
      CbteHasta: numero_de_factura,
      CbteFch: parseInt(fecha.replace(/-/g, '')),
      FchServDesde: fecha_servicio_desde,
      FchServHasta: fecha_servicio_hasta,
      FchVtoPago: fecha_vencimiento_pago,
      ImpTotal: 100,
      ImpTotConc: 0,
      ImpNeto: 100,
      ImpOpEx: 0,
      ImpIVA: 0,
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
      CondicionIVAReceptorId: condicion_iva_receptor
    };

    const res = await afip.ElectronicBilling.createVoucher(data);

    console.log({
      cae: res.CAE,
      vencimiento: res.CAEFchVto
    });

  } catch (error) {
    console.error("Error al generar factura:", error.response?.data || error.message || error);
  }
})();
