const fs = require('fs');
const path = require('path');
const Afip = require('@afipsdk/afip.js');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');

exports.emitirFactura = async (req, res) => {
  try {
    // Leer database
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    // Leer certificados
    const cert = process.env.CERT_STRING;
    const key = process.env.KEY_STRING;

    const afip = new Afip({
      CUIT: 20387758578,
      cert,
      key,
      production: false
    });

    const {
      cliente_cuit,
      condicion_iva,
      concepto,
      descripcion,
      cantidad,
      precio_unitario,
      importe,
      fecha,
      fecha_serv_desde,
      fecha_serv_hasta,
      fecha_venc_pago,
      nombre_fantasia,
      domicilio_fiscal,
      cuit_usuario,
      inicio_actividades,
      razonSocial,
      direccion,
      tipo_documento,
      condicion_iva_texto
    } = req.body;

        // ✅ Obtener nombre directamente de la tabla usuarios
    const userResult = await pool.query(
      'SELECT nombre FROM usuarios WHERE cuit = $1',
      [cuit_usuario]
    );

    const nombre = userResult.rows[0]?.nombre || '';
    if (!nombre) {
      return res.status(404).json({ message: 'No se encontró el nombre del usuario' });
    }

    const punto_de_venta = 1;
    const tipo_de_factura = 11;
    const tipo_de_documento = parseInt(tipo_documento);

    const last_voucher = await afip.ElectronicBilling.getLastVoucher(punto_de_venta, tipo_de_factura);
    const numero_de_factura = last_voucher + 1;

    const formatDate = (dateStr) => dateStr ? parseInt(dateStr.replace(/-/g, '')) : undefined;

    const data = {
      CantReg: 1,
      PtoVta: punto_de_venta,
      CbteTipo: tipo_de_factura,
      Concepto: parseInt(concepto),
      DocTipo: tipo_de_documento,
      DocNro: parseInt(cliente_cuit),
      CbteDesde: numero_de_factura,
      CbteHasta: numero_de_factura,
      CbteFch: formatDate(fecha),
      FchServDesde: (concepto === 2 || concepto === 3) ? formatDate(fecha_serv_desde) : undefined,
      FchServHasta: (concepto === 2 || concepto === 3) ? formatDate(fecha_serv_hasta) : undefined,
      FchVtoPago: (concepto === 2 || concepto === 3) ? formatDate(fecha_venc_pago) : undefined,
      ImpTotal: parseFloat(importe),
      ImpTotConc: 0,
      ImpNeto: parseFloat(importe),
      ImpOpEx: 0,
      ImpIVA: 0,
      ImpTrib: 0,
      MonId: 'PES',
      MonCotiz: 1,
      CondicionIVAReceptorId: parseInt(condicion_iva) || 6
    };

    const response = await afip.ElectronicBilling.createVoucher(data);
    const cae = response.CAE;
    const vencimiento = response.CAEFchVto;

    const QRCode = require('qrcode');

const qrPayload = {
  ver: 1,
  fecha: fecha, // Ya está en formato YYYY-MM-DD
  cuit: parseInt(cuit_usuario),
  ptoVta: punto_de_venta,
  tipoCmp: tipo_de_factura,
  nroCmp: numero_de_factura,
  importe: parseFloat(importe),
  moneda: 'PES',
  ctz: 1,
  tipoDocRec: tipo_de_documento,
  nroDocRec: parseInt(cliente_cuit),
  tipoCodAut: 'E',
  codAut: cae
};

const qrDataBase64 = Buffer.from(JSON.stringify(qrPayload)).toString('base64');
const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${qrDataBase64}`;
const qrImageDataUrl = await QRCode.toDataURL(qrUrl);


    const nombreFinal = (nombre_fantasia && nombre_fantasia.trim() !== '') ? nombre_fantasia : nombre;
    const inicioActividadesFormatted = new Date(inicio_actividades).toISOString().split('T')[0];


    // 👉 Generar PDF
    const templatePath = path.join(__dirname, '../templates/bill.html');
    const html = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(html);

    const htmlRenderizado = template({
      nombre,
      nombre_fantasia: nombreFinal,
      domicilio_fiscal,
      cuit_usuario,
      inicio_actividades: inicioActividadesFormatted,
      numero_de_factura,
      fecha,
      cliente_cuit,
      razonSocial,
      direccion,
      condicion_iva,
      fecha_serv_desde,
      fecha_serv_hasta,
      fecha_venc_pago,
      descripcion,
      cantidad,
      precio_unitario,
      importe,
      cae,
      condicion_iva_texto,
      vencimiento,
      qr: qrImageDataUrl
    });

    const chromium = require('@sparticuz/chromium');
    const puppeteer = require('puppeteer-core');

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });


    const page = await browser.newPage();
    await page.setContent(htmlRenderizado, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    // 👉 Opcional: guardar el PDF en disco (descomentar si querés)
    // fs.writeFileSync(`factura-${numero_de_factura}.pdf`, pdfBuffer);

    // 👉 Enviar PDF y datos AFIP como respuesta
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="factura-${numero_de_factura}.pdf"`,
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error al emitir con AFIP o generar PDF:', error);
    res.status(500).json({ message: 'Error al emitir factura', detalle: error.message });
  }
};



