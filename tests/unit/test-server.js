
const request = require('supertest');
const app = require('../../server');
const agent = request.agent(app); // Use agent for session persistence

describe('Server Unit Tests', () => {

  test('Health endpoint should return 200', async () => {
    const response = await agent
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.service).toBe('SecureDoc Redaction Service');
  });


  const fs = require('fs');
  const path = require('path');


  test('Upload, redact, and download PDF file', async () => {
    const filePath = path.join(__dirname, '../fixtures/test-document.pdf');
    expect(fs.existsSync(filePath)).toBe(true); // check file existence

    // Fetch CSRF token
    const csrfRes = await agent.get('/api/csrf-token');
    const csrfToken = csrfRes.body.csrfToken;

    // Upload
    const uploadResponse = await agent
      .post('/api/redaction/upload')
      .set('x-csrf-token', csrfToken)
      .attach('file', filePath)
      .expect(200);

    console.log('Upload response body:', uploadResponse.body);
    const fileId = uploadResponse.body.fileId;
    expect(fileId).toBeDefined();

    // Redact (required to create redacted file)
    const csrfRes2 = await agent.get('/api/csrf-token');
    const csrfToken2 = csrfRes2.body.csrfToken;
    const redactionData = {
      fileId: fileId,
      redactionAreas: [
        {
          x: 10,
          y: 10,
          width: 50,
          height: 20,
          redactionCode: 'PERSONAL_INFO'
        }
      ]
    };
    await agent
      .post('/api/redaction/redact')
      .set('x-csrf-token', csrfToken2)
      .send(redactionData)
      .expect(200);

    // Download
    const downloadResponse = await agent
      .get(`/api/redaction/download/${fileId}`)
      .buffer()
      .parse((res, callback) => {
        res.setEncoding('binary');
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => callback(null, Buffer.from(data, 'binary')));
      })
      .expect(200);

    console.log('Download response is Buffer:', Buffer.isBuffer(downloadResponse.body));
    expect(downloadResponse.headers['content-type']).toBe('application/pdf');
    expect(Buffer.isBuffer(downloadResponse.body)).toBe(true);
    expect(downloadResponse.body.length).toBeGreaterThan(0);
  });
});
