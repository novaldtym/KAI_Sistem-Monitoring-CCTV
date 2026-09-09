const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// Register Handlebars helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('formatDate', (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
});
Handlebars.registerHelper('statusSymbol', (val) => {
  if (val === 'V') return '✓';
  if (val === 'X') return '✗';
  return '';
});

const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

async function generateMonitoringPDF(reportData) {
  const templatePath = path.join(__dirname, '../templates/pdf/monitoring-cctv.html');
  const templateHTML = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateHTML);

  // Sort details
  const details = (reportData.details || []).sort(
    (a, b) => (a.cctvPoint?.nomor_urut || 0) - (b.cctvPoint?.nomor_urut || 0)
  );

  // Prepare data
  const bulanLabel = `${String(reportData.bulan).padStart(2, '0')}-${MONTHS[reportData.bulan].substring(0, 3)}-${String(reportData.tahun).slice(-2)}`;
  const tanggalLabel = `${String(reportData.bulan).padStart(2, '0')}-12-${reportData.tahun}`;

  const approvalLog = reportData.approvalLogs && reportData.approvalLogs[0];

  const html = template({
    noRef: reportData.no_ref || '-',
    nomorDokumen: 'FR.SM/IT/015.017/10-2020',
    tanggalTerbit: '12 Oktober 2020',
    versi: '002-2020',
    businessArea: reportData.station?.business_area || '-',
    tanggal: tanggalLabel,
    bulan: bulanLabel,
    stasiunNama: reportData.station?.nama_stasiun || '-',
    tanggalM1: reportData.tanggal_m1,
    tanggalM2: reportData.tanggal_m2,
    tanggalM3: reportData.tanggal_m3,
    tanggalM4: reportData.tanggal_m4,
    details,
    catatan: reportData.catatan || '',
    managerNama: approvalLog?.approver?.nama || '-',
    managerNipp: approvalLog?.approver?.nipp || '-',
    managerJabatan: approvalLog?.approver?.jabatan || 'Assistant Manager IT Support 1',
    petugasNama: reportData.createdBy?.nama || '-',
    petugasNipp: reportData.createdBy?.nipp || '-',
  });

  function getExecutablePath() {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return undefined;
  }

  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  };

  const execPath = getExecutablePath();
  if (execPath) {
    launchOptions.executablePath = execPath;
  }

  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: { top: '6mm', right: '8mm', bottom: '6mm', left: '8mm' },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}

module.exports = { generateMonitoringPDF };
