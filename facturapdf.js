const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generarPDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Leer el contenido del archivo HTML
  const filePath = path.join(__dirname, 'templatefactura.html');
  const content = fs.readFileSync(filePath, 'utf8');

  // Cargar el HTML como template local
  await page.setContent(content, { waitUntil: 'networkidle0' });

  // Generar PDF
  await page.pdf({
    path: 'FacturaGenerada.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
  });

  await browser.close();
  console.log('✅ PDF generado: FacturaGenerada.pdf');
}

generarPDF();
