const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer-core');

async function generarFacturaPDF(datosFactura) {
  const templatePath = path.join(__dirname, '..', 'templates', 'bill.html'); // Asegurate que esté bien el path
  const html = fs.readFileSync(templatePath, 'utf8');

  const template = handlebars.compile(html);
  const htmlFinal = template(datosFactura);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(htmlFinal, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  return pdfBuffer;
}

module.exports = generarFacturaPDF;
