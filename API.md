# SecureDoc API Documentation

## Overview

The SecureDoc API provides secure document redaction capabilities with HIPAA-compliant processing. All endpoints use session-based authentication and return JSON responses unless otherwise specified.

**Base URL:** `http://localhost:8080` (development)  
**API Version:** 1.0.0  
**Content-Type:** `application/json` (except file uploads)

## Authentication

SecureDoc uses session-based authentication. Sessions are automatically created on the first request and maintained via cookies.

### Session Management
- Sessions are created automatically on first API call
- Session ID is returned in `Set-Cookie` header
- Include session cookie in subsequent requests
- Sessions expire after 24 hours of inactivity

## Endpoints

### Health Check

#### GET /health
Check API health and version information.

**Response:**
```json
{
  "service": "SecureDoc Redaction API",
  "version": "1.0.0",
  "status": "UP",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes:**
- `200` - Service is healthy

---

### File Upload

#### POST /api/redaction/upload
Upload a PDF file for redaction processing.

**Content-Type:** `multipart/form-data`

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| file | File | Yes | PDF file to upload |

**Response:**
```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "fileHash": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
}
```

**Status Codes:**
- `200` - File uploaded successfully
- `400` - Invalid file type or upload error
- `413` - File too large
- `500` - Server error

**Error Response:**
```json
{
  "error": "Only PDF files are allowed"
}
```

---

### Apply Redaction

#### POST /api/redaction/redact
Apply redaction areas to an uploaded PDF file.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "fileId": "550e8400-e29b-41d4-a716-446655440000",
  "redactionAreas": [
    {
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 50,
      "pageNumber": 1,
      "redactionCode": "SSN",
      "description": "Social Security Number"
    },
    {
      "x": 300,
      "y": 400,
      "width": 200,
      "height": 30,
      "pageNumber": 1,
      "redactionCode": "DOB",
      "description": "Date of Birth"
    }
  ],
  "reason": "HIPAA compliance"
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fileId | String | Yes | UUID of uploaded file |
| redactionAreas | Array | Yes | Array of redaction areas |
| reason | String | No | Reason for redaction (default: "HIPAA compliance") |

**Redaction Area Object:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| x | Number | Yes | X coordinate (pixels) |
| y | Number | Yes | Y coordinate (pixels) |
| width | Number | Yes | Width in pixels |
| height | Number | Yes | Height in pixels |
| pageNumber | Number | Yes | PDF page number (1-based) |
| redactionCode | String | Yes | Code for redaction type |
| description | String | No | Human-readable description |

**Response:**
```json
{
  "redactedFileId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Redaction completed successfully",
  "redactionCount": 2
}
```

**Status Codes:**
- `200` - Redaction applied successfully
- `400` - Invalid request or file not found
- `500` - Server error

---

### Download Redacted File

#### GET /api/redaction/download/{fileId}
Download the redacted PDF file.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fileId | String | Yes | UUID of the file to download |

**Response:**
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="redacted-{fileId}.pdf"`
- **Body:** PDF file binary data

**Status Codes:**
- `200` - File downloaded successfully
- `400` - File not found or access denied
- `404` - File does not exist
- `500` - Server error

---

### Audit Logs

#### GET /api/redaction/audit
Get all audit logs for the current user session.

**Response:**
```json
[
  {
    "id": "audit-uuid-1",
    "fileId": "file-uuid-1",
    "originalHash": "original-sha256-hash",
    "redactedHash": "redacted-sha256-hash",
    "userId": "user-uuid",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "action": "FILE_UPLOADED",
    "redactionCodes": null,
    "reason": null,
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "filePath": "/uploads/user-id/original/file-id.pdf"
  },
  {
    "id": "audit-uuid-2",
    "fileId": "file-uuid-1",
    "originalHash": "original-sha256-hash",
    "redactedHash": "redacted-sha256-hash",
    "userId": "user-uuid",
    "timestamp": "2024-01-01T00:01:00.000Z",
    "action": "REDACTION_APPLIED",
    "redactionCodes": "SSN,DOB",
    "reason": "HIPAA compliance",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "filePath": "/uploads/user-id/redacted/file-id.pdf"
  }
]
```

#### GET /api/redaction/audit/{fileId}
Get audit logs for a specific file.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| fileId | String | Yes | UUID of the file |

**Response:** Same as above, filtered by fileId

**Status Codes:**
- `200` - Audit logs retrieved successfully
- `400` - Invalid file ID
- `500` - Database error

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message description"
}
```

### Common Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Invalid parameters, missing required fields |
| 401 | Unauthorized | Invalid or expired session |
| 403 | Forbidden | Access denied, insufficient permissions |
| 404 | Not Found | File or resource not found |
| 413 | Payload Too Large | File size exceeds limit |
| 415 | Unsupported Media Type | Invalid file type |
| 500 | Internal Server Error | Server-side error, database issues |

### Error Examples

**File Not Found:**
```json
{
  "error": "File not found or access denied"
}
```

**Invalid File Type:**
```json
{
  "error": "Only PDF files are allowed"
}
```

**Database Error:**
```json
{
  "error": "Database error"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

## File Size Limits

- **Maximum file size:** 100MB
- **Supported formats:** PDF only
- **Processing timeout:** 30 seconds

## Security Considerations

### Data Protection
- All files are stored in user-isolated directories
- Files are automatically deleted after 24 hours (configurable)
- All file operations are logged for audit purposes
- File integrity is verified using SHA-256 hashing

### Session Security
- Sessions use secure, HTTP-only cookies
- Session data is stored server-side
- Sessions automatically expire after 24 hours
- IP address and user agent are logged for security

### Input Validation
- All input parameters are validated
- File types are strictly enforced
- Redaction coordinates are bounds-checked
- SQL injection protection via parameterized queries

---

## SDK Examples

### JavaScript/Node.js
```javascript
const FormData = require('form-data');
const fs = require('fs');

// Upload file
const form = new FormData();
form.append('file', fs.createReadStream('document.pdf'));

const uploadResponse = await fetch('http://localhost:8080/api/redaction/upload', {
  method: 'POST',
  body: form,
  credentials: 'include'
});

const { fileId } = await uploadResponse.json();

// Apply redaction
const redactionResponse = await fetch('http://localhost:8080/api/redaction/redact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileId,
    redactionAreas: [{
      x: 100, y: 200, width: 150, height: 50,
      pageNumber: 1, redactionCode: 'SSN',
      description: 'Social Security Number'
    }],
    reason: 'HIPAA compliance'
  }),
  credentials: 'include'
});

// Download redacted file
const downloadResponse = await fetch(`http://localhost:8080/api/redaction/download/${fileId}`, {
  credentials: 'include'
});

const pdfBuffer = await downloadResponse.arrayBuffer();
```

### Python
```python
import requests

# Upload file
with open('document.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8080/api/redaction/upload', 
                           files=files, cookies=session.cookies)
    file_id = response.json()['fileId']

# Apply redaction
redaction_data = {
    'fileId': file_id,
    'redactionAreas': [{
        'x': 100, 'y': 200, 'width': 150, 'height': 50,
        'pageNumber': 1, 'redactionCode': 'SSN',
        'description': 'Social Security Number'
    }],
    'reason': 'HIPAA compliance'
}
response = requests.post('http://localhost:8080/api/redaction/redact',
                        json=redaction_data, cookies=session.cookies)

# Download redacted file
response = requests.get(f'http://localhost:8080/api/redaction/download/{file_id}',
                       cookies=session.cookies)
with open('redacted_document.pdf', 'wb') as f:
    f.write(response.content)
```

---

## Support

For API support and questions:
- **Documentation**: Check this API documentation
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions via GitHub Discussions
