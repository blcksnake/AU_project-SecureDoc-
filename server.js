const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Session middleware
app.use(session({
    secret: 'hipaa-redaction-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// File storage configuration
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads with disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userId = req.session.userId || 'anonymous';
        const userDir = path.join(uploadsDir, userId, 'original');

        // Create user directory if it doesn't exist
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        cb(null, userDir);
    },
    filename: function (req, file, cb) {
        const fileId = uuidv4();
        req.uploadedFileId = fileId; // Store fileId for later use
        cb(null, `${fileId}.pdf`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Initialize SQLite database
const db = new sqlite3.Database('./audit.db');

// Create audit logs table
db.exec(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    original_hash TEXT NOT NULL,
    redacted_hash TEXT,
    user_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL,
    redaction_codes TEXT,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    file_path TEXT
)`);

db.exec(`CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Utility functions
function calculateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// User session management
function ensureUserSession(req, res, next) {
    if (!req.session.userId) {
        req.session.userId = uuidv4();
        // Only log session creation if not running in test environment
        if (process.env.NODE_ENV !== 'test') {
            console.log('Created new user session:', req.session.userId);
        }
    }
    next();
}

// Security middleware - ensure user can only access their own files
function checkFileAccess(req, res, next) {
    const userId = req.session.userId;
    const fileId = req.params.fileId;

    if (!userId) {
        return res.status(401).json({ error: 'No user session found' });
    }

    // Check if file belongs to user
    const filePath = path.join(uploadsDir, userId, 'original', `${fileId}.pdf`);
    const redactedPath = path.join(uploadsDir, userId, 'redacted', `${fileId}.pdf`);

    if (!fs.existsSync(filePath) && !fs.existsSync(redactedPath)) {
        return res.status(403).json({ error: 'File not found or access denied' });
    }

    req.filePath = filePath;
    req.redactedPath = redactedPath;
    next();
}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'HIPAA Redaction Prototype API',
        version: '1.0.0',
        status: 'running'
    });
});

// Test redaction endpoint
app.get('/api/redaction/test', (req, res) => {
    res.json({ message: 'Redaction endpoint is accessible' });
});

// Upload PDF file
app.post('/api/redaction/upload', ensureUserSession, upload.single('file'), (req, res) => {
    try {
        console.log('Upload request received:', {
            hasFile: !!req.file,
            userId: req.session.userId,
            headers: req.headers
        });

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileId = req.uploadedFileId;
        const userId = req.session.userId;
        const filePath = req.file.path;

        console.log('Processing file:', { fileId, userId, filePath });

        // Calculate hash of the uploaded file
        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = calculateHash(fileBuffer);

        // Log file upload
        db.run(`
            INSERT INTO audit_logs (id, file_id, original_hash, user_id, action, ip_address, user_agent, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            uuidv4(),
            fileId,
            fileHash,
            userId,
            'FILE_UPLOADED',
            getClientIp(req),
            req.get('User-Agent'),
            filePath
        ], function (err) {
            if (err) {
                console.error('Database error:', err);
            }
        });

        console.log('Upload successful:', { fileId, userId });
        res.json({
            fileId: fileId,
            fileHash: fileHash,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            userId: userId
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error processing file upload' });
    }
});

// Apply redaction
app.post('/api/redaction/redact', ensureUserSession, async (req, res) => {
    console.log('Redaction endpoint hit - processing request...');
    try {
        console.log('Redaction request received:', {
            body: req.body,
            userId: req.session.userId,
            headers: req.headers
        });

        const { fileId, redactionAreas, reason, redactionType } = req.body;
        const userId = req.session.userId;

        if (!fileId) {
            console.log('No fileId provided');
            return res.status(400).json({ error: 'No fileId provided' });
        }

        if (!redactionAreas || redactionAreas.length === 0) {
            console.log('No redaction areas provided');
            return res.status(400).json({ error: 'No redaction areas provided' });
        }

        // Find the original file
        const originalFilePath = path.join(uploadsDir, userId, 'original', `${fileId}.pdf`);
        console.log('Looking for original file at:', originalFilePath);

        if (!fs.existsSync(originalFilePath)) {
            console.log('Original file not found at:', originalFilePath);
            return res.status(404).json({ error: 'Original file not found' });
        }

        // Create redacted directory if it doesn't exist
        const redactedDir = path.join(uploadsDir, userId, 'redacted');
        if (!fs.existsSync(redactedDir)) {
            console.log('Creating redacted directory:', redactedDir);
            fs.mkdirSync(redactedDir, { recursive: true });
        }

        // Process the PDF with redactions
        console.log('Loading PDF for redaction...');
        const { PDFDocument, rgb } = require('pdf-lib');
        const originalPdfBytes = fs.readFileSync(originalFilePath);
        const pdfDoc = await PDFDocument.load(originalPdfBytes);

        // Apply redactions (simplified - just add black rectangles)
        const pages = pdfDoc.getPages();
        console.log(`PDF loaded with ${pages.length} pages`);

        redactionAreas.forEach((area, index) => {
            console.log(`Processing redaction area ${index + 1}:`, area);
            if (area.pageNumber <= pages.length) {
                const page = pages[area.pageNumber - 1];
                const { width, height } = page.getSize();

                // Convert coordinates to PDF coordinates (PDF has origin at bottom-left)
                const x = area.x;
                const y = height - area.y - area.height; // Flip Y coordinate

                console.log(`Drawing rectangle at x:${x}, y:${y}, w:${area.width}, h:${area.height}`);

                // Draw black rectangle
                page.drawRectangle({
                    x: x,
                    y: y,
                    width: area.width,
                    height: area.height,
                    color: rgb(0, 0, 0)
                });

                // Add redaction label
                if (area.description) {
                    page.drawText(`[REDACTED: ${area.description}]`, {
                        x: x + 5,
                        y: y + area.height / 2,
                        size: 8,
                        color: rgb(1, 1, 1)
                    });
                }
            } else {
                console.log(`Skipping area ${index + 1} - page ${area.pageNumber} doesn't exist`);
            }
        });

        // Save redacted PDF
        console.log('Saving redacted PDF...');
        const redactedPdfBytes = await pdfDoc.save();
        const redactedFilePath = path.join(redactedDir, `${fileId}.pdf`);
        fs.writeFileSync(redactedFilePath, redactedPdfBytes);
        console.log('Redacted PDF saved to:', redactedFilePath);

        // Calculate hashes
        const originalHash = calculateHash(originalPdfBytes);
        const redactedHash = calculateHash(redactedPdfBytes);

        // Log redaction
        const redactionCodes = redactionAreas.map(area => area.redactionCode).join(',');
        console.log('Logging redaction to database...');
        db.run(`
            INSERT INTO audit_logs (id, file_id, original_hash, redacted_hash, user_id, action, redaction_codes, reason, ip_address, user_agent, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            uuidv4(),
            fileId,
            originalHash,
            redactedHash,
            userId,
            'REDACTION_APPLIED',
            redactionCodes,
            reason || 'HIPAA compliance',
            getClientIp(req),
            req.get('User-Agent'),
            redactedFilePath
        ], function (err) {
            if (err) {
                console.error('Database error:', err);
            }
        });

        console.log('Redaction completed successfully');
        res.json({
            redactedFileId: fileId,
            message: 'Redaction completed successfully',
            redactionCount: redactionAreas.length,
            downloadUrl: `/api/redaction/download/${fileId}`,
            originalFileId: fileId
        });
    } catch (error) {
        console.error('Redaction error:', error);
        res.status(500).json({ error: 'Error during redaction process' });
    }
});

// Download redacted PDF
app.get('/api/redaction/download/:fileId', ensureUserSession, checkFileAccess, (req, res) => {
    try {
        const { fileId } = req.params;
        const redactedFilePath = req.redactedPath;

        console.log('[Download route] fileId:', fileId);
        console.log('[Download route] redactedFilePath:', redactedFilePath);

        if (!fs.existsSync(redactedFilePath)) {
            console.error('[Download route] File does not exist:', redactedFilePath);
            return res.status(404).json({ error: 'Redacted file not found' });
        }

        // Send the actual redacted PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="redacted-${fileId}.pdf"`);
        res.sendFile(redactedFilePath);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Error downloading redacted PDF' });
    }
});

// Get audit logs
app.get('/api/redaction/audit', ensureUserSession, (req, res) => {
    const { fileId } = req.query;
    const userId = req.session.userId;

    let query = 'SELECT * FROM audit_logs WHERE user_id = ?';
    let params = [userId];

    if (fileId) {
        query += ' AND file_id = ?';
        params.push(fileId);
    }

    query += ' ORDER BY timestamp DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get specific file audit logs
app.get('/api/redaction/audit/:fileId', ensureUserSession, (req, res) => {
    const { fileId } = req.params;
    const userId = req.session.userId;

    db.all('SELECT * FROM audit_logs WHERE file_id = ? AND user_id = ? ORDER BY timestamp DESC', [fileId, userId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'SecureDoc Redaction Service',
        version: '1.0.0',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
    // Start server only if run directly
    app.listen(PORT, () => {
        console.log(`SecureDoc Redaction API running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`API Documentation: http://localhost:${PORT}/`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down server...');
        try {
            db.close();
            console.log('Database connection closed.');
        } catch (err) {
            console.error('Error closing database:', err);
        }
        process.exit(0);
    });
}

module.exports = app;
