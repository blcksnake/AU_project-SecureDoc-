const request = require('supertest');
const app = require('../../server');
const agent = request.agent(app); // Use agent for session persistence
const fs = require('fs');
const path = require('path');

describe('Redaction Flow Integration Tests', () => {
  test('Complete redaction workflow', async () => {
    // 1. Upload file
    const filePath = path.join(__dirname, '../fixtures/test-document.pdf');
    expect(fs.existsSync(filePath)).toBe(true); // check file existence


    // Fetch CSRF token
    const csrfRes = await agent.get('/api/csrf-token');
    const csrfToken = csrfRes.body.csrfToken;

    const uploadResponse = await agent
      .post('/api/redaction/upload')
      .set('x-csrf-token', csrfToken)
      .attach('file', filePath)
      .expect(200);

    const fileId = uploadResponse.body.fileId;
    const userId = uploadResponse.body.userId;
    expect(fileId).toBeDefined();
    expect(userId).toBeDefined();

    // 2. Perform redaction
    const redactionData = {
      fileId: fileId,
      redactionAreas: [
        {
          x: 100,
          y: 100,
          width: 200,
          height: 50,
          redactionCode: 'PERSONAL_INFO'
        }
      ]
    };

    // Fetch new CSRF token for each POST (simulate browser behavior)
    const csrfRes2 = await agent.get('/api/csrf-token');
    const csrfToken2 = csrfRes2.body.csrfToken;

    const redactionResponse = await agent
      .post('/api/redaction/redact')
      .set('x-csrf-token', csrfToken2)
      .send(redactionData)
      .expect(200);

    console.log('Redaction response body:', redactionResponse.body);
    expect(redactionResponse.body.redactedFileId).toBeDefined();

    // 3. Download redacted file
    const downloadResponse = await agent
      .get(`/api/redaction/download/${fileId}`)
      .expect(200);

    console.log('Download response:', downloadResponse.body);
    expect(downloadResponse.headers['content-type']).toBe('application/pdf');
    expect(downloadResponse.body.length).toBeGreaterThan(0);

    // 4. Verify file exists in storage
    const redactedFilePath = path.join('uploads', userId, 'redacted', `${fileId}.pdf`);
    expect(fs.existsSync(redactedFilePath)).toBe(true);
  });
});
