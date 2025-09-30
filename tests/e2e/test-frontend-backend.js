const puppeteer = require('puppeteer');
const request = require('supertest');
const app = require('../../server');

describe('Frontend-Backend E2E Tests', () => {
  let browser;
  let page;
  let server;

  beforeAll(async () => {
    // Assume backend is already running on 8080
    // Launch browser
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('Frontend loads correctly', async () => {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    const title = await page.title();
    expect(title).toMatch(/SecureDoc|HIPAA Redaction Prototype/i);

    const uploadButton = await page.$('input[type="file"]');
    expect(uploadButton).toBeTruthy();
  });

});
