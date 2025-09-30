# SecureDoc - Professional Document Redaction Platform


[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/blcksnake/AU_project-SecureDoc)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/blcksnake/AU_project-SecureDoc/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18+-blue.svg)](https://reactjs.org/)

SecureDoc is a professional-grade document redaction platform designed for secure privacy protection. Perfect for bank statements, medical records, legal documents, and any sensitive PDF that requires HIPAA-compliant redaction.

## 🚀 Features

- **🔒 HIPAA Compliant**: Meets healthcare privacy standards
- **📄 Universal PDF Support**: Works with any PDF document type
- **⚡ Real-time Processing**: Instant redaction and download
- **🛡️ Secure Storage**: User-isolated file storage
- **📊 Audit Trail**: Complete activity logging
- **🎨 Modern UI**: Intuitive drag-and-drop interface
- **🐳 Docker Ready**: Production-ready containerization

## 📋 Supported Document Types

- 🏦 Bank Statements
- 🏥 Medical Records
- ⚖️ Legal Documents
- 📊 Financial Reports
- 🆔 Identity Documents
- 📄 Insurance Claims
- 📝 Personal Records

## 🛠️ Technology Stack

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **sqlite3** - Database
- **pdf-lib** - PDF manipulation
- **multer** - File upload handling
- **express-session** - Session management

### Frontend
- **React 18+** - UI framework
- **Tailwind CSS** - Styling
- **react-pdf** - PDF viewing
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📁 Project Structure

```
securedoc/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   └── App.js          # Main application
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── tests/                   # Test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── e2e/               # End-to-end tests
│   └── fixtures/          # Test data
├── uploads/                # File storage (user-isolated)
├── logs/                   # Application logs
├── server.js              # Node.js backend server
├── package.json           # Backend dependencies
├── docker-compose.yml     # Docker orchestration
├── Dockerfile             # Frontend Docker image
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- Docker & Docker Compose (for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/blcksnake/AU_project-SecureDoc.git
   cd AU_project-SecureDoc
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the application**
   ```bash
   # Windows
   start-standalone.bat
   
   # Linux/Mac
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

### Testing

1. **Install test dependencies**
   ```bash
   npm install --save-dev jest supertest puppeteer
   ```

2. **Run tests**
   ```bash
   # All tests
   npm test
   
   # Unit tests only
   npm test -- tests/unit/
   
   # Integration tests only
   npm test -- tests/integration/
   
   # E2E tests only
   npm test -- tests/e2e/
   ```

### Docker Deployment

1. **Build and start containers**
   ```bash
   docker-compose up --build -d
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## 📖 API Documentation

### Authentication
All API endpoints use session-based authentication. Sessions are automatically created on first request.

### Endpoints

#### File Upload
```http
POST /api/redaction/upload
Content-Type: multipart/form-data

file: [PDF file]
```

**Response:**
```json
{
  "fileId": "uuid",
  "fileHash": "sha256-hash"
}
```

#### Apply Redaction
```http
POST /api/redaction/redact
Content-Type: application/json

{
  "fileId": "uuid",
  "redactionAreas": [
    {
      "x": 100,
      "y": 200,
      "width": 150,
      "height": 50,
      "pageNumber": 1,
      "redactionCode": "SSN",
      "description": "Social Security Number"
    }
  ],
  "reason": "HIPAA compliance"
}
```

#### Download Redacted File
```http
GET /api/redaction/download/{fileId}
```

**Response:** PDF file download

#### Audit Logs
```http
GET /api/redaction/audit
GET /api/redaction/audit/{fileId}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "fileId": "uuid",
    "action": "FILE_UPLOADED|REDACTION_APPLIED",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "user_id": "uuid",
    "original_hash": "sha256-hash",
    "redacted_hash": "sha256-hash",
    "redaction_codes": "SSN,DOB",
    "reason": "HIPAA compliance"
  }
]
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `8080` |
| `NODE_ENV` | Environment | `development` |

### File Storage

Files are stored in user-isolated directories:
```
uploads/
├── {userId}/
│   ├── original/
│   │   └── {fileId}.pdf
│   └── redacted/
│       └── {fileId}.pdf
```

### Database

SQLite3 database (`audit.db`) stores:
- Audit logs
- User sessions
- File metadata

## 🔒 Security Features

- **Session-based Authentication**: Secure user sessions
- **File Isolation**: User-specific file storage
- **Audit Logging**: Complete activity tracking
- **Hash Verification**: File integrity checking
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Request sanitization

## 📊 Monitoring

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "service": "SecureDoc Redaction API",
  "version": "1.0.0",
  "status": "UP",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logs
- Application logs: `logs/` directory
- Database logs: SQLite audit trail
- Container logs: `docker-compose logs`

## 🚀 Deployment

### Production Checklist

- [ ] Update environment variables
- [ ] Configure HTTPS certificates
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring
- [ ] Review security settings

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml up --build -d

# Scale services
docker-compose up --scale backend=3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/blcksnake/AU_project-SecureDoc/wiki)
- **Issues**: [GitHub Issues](https://github.com/blcksnake/AU_project-SecureDoc/issues)
- **Discussions**: [GitHub Discussions](https://github.com/blcksnake/AU_project-SecureDoc/discussions)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

**SecureDoc** - Professional Document Redaction Platform