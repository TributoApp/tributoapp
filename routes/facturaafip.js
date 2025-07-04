// /routes/facturaafip.js
const fs = require('fs');
const Afip = require('@afipsdk/afip.js');

const cert = fs.readFileSync('cert.crt', { encoding: 'utf8' });
const key = fs.readFileSync('MiClavePrivada.key', { encoding: 'utf8' });

const afip = new Afip({
  CUIT: 20387758578, // Reemplazá con tu CUIT real
  cert,
  key
});

/**
 * Genera una factura y pide CAE a AFIP
 * @param {Object} facturaDatos - Datos de la factura
 * @param {number} facturaDatos.puntoDeVenta
 * @param {number} facturaDatos.tipoDeFactura
 * @param {number} facturaDatos.concepto
 * @param {number} facturaDatos.tipoDeDocumento
 * @param {number} facturaDatos.numeroDeDocumento
 * @param {number} facturaDatos.importeTotal
 * @param {number} facturaDatos.condicionIVAReceptor
 * @param {string} facturaDatos.fecha - "YYYY-MM-DD"
 * @returns {Promise<Object>} - Retorna objeto con CAE y fecha vencimiento
 */
async function generarFactura(facturaDatos) {
  const {
    puntoDeVenta,
    tipoDeFactura,
    concepto,
    tipoDeDocumento,
    numeroDeDocumento,
    importeTotal,
    condicionIVAReceptor,
    fecha
  } = facturaDatos;

  try {
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoDeVenta, tipoDeFactura);
    const numeroDeFactura = lastVoucher + 1;

    let fechaServicioDesde = null,
      fechaServicioHasta = null,
      fechaVencimientoPago = null;

    if (concepto === 2 || concepto === 3) {
      // Estos valores idealmente vienen también del frontend si son necesarios
      fechaServicioDesde = 20240601;
      fechaServicioHasta = 20240630;
      fechaVencimientoPago = 20240710;
    }

    const data = {
      CantReg: 1,
      PtoVta: puntoDeVenta,
      CbteTipo: tipoDeFactura,
      Concepto: concepto,
      DocTipo: tipoDeDocumento,
      DocNro: numeroDeDocumento,
      CbteDesde: numeroDeFactura,
      CbteHasta: numeroDeFactura,
      CbteFch: parseInt(fecha.replace(/-/g, '')),
      FchServDesde: fechaServicioDesde,
      FchServHasta: fechaServicioHasta,
      FchVtoPago: fechaVencimientoPago,
      ImpTotal: importeTotal,
      ImpTotConc: 0,
      ImpNeto: importeTotal,
      ImpOpEx: 0,
      ImpIVA: 0,
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
      CondicionIVAReceptorId: condicionIVAReceptor
    };

    const res = await afip.ElectronicBilling.createVoucher(data);

    return {
      cae: res.CAE,
      vencimiento: res.CAEFchVto,
      numeroFactura: numeroDeFactura,
      data
    };
  } catch (error) {
    throw error;
  }
}

module.exports = generarFactura;
