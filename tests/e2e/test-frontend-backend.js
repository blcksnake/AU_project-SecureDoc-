const puppeteer = require('puppeteer');
const request = require('supertest');
const app = require('../../server');

describe('Frontend-Backend E2E Tests', () => {
  let browser;
  let page;
  let server;

  beforeAll(async () => {
    // Start the backend server if not already running
    server = app.listen(8080, () => {
      console.log('Test backend server running on port 8080');
    });

    // Wait for backend to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Launch browser
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    server.close();
  });

  test('Frontend loads correctly', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    const title = await page.title();
    expect(title).toContain('SecureDoc');

    const uploadButton = await page.$('input[type="file"]');
    expect(uploadButton).toBeTruthy();
  });

  test('File upload and redaction workflow', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    // Upload file
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('tests/fixtures/test-document.pdf');

    // Wait for upload to complete
    await page.waitForSelector('.text-green-500', { timeout: 10000 });

    // Check if redaction panel appears
    const redactionPanel = await page.$('.redaction-panel');
    expect(redactionPanel).toBeTruthy();

    // Check if PDF viewer loads
    const pdfViewer = await page.$('.pdf-viewer');
    expect(pdfViewer).toBeTruthy();
  });
});
