import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import PdfViewer from './components/PdfViewer';
import RedactionPanel from './components/RedactionPanel';
import './index.css';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [redactionAreas, setRedactionAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileUpload = (file, fileId) => {
    setCurrentFile(file);
    setCurrentFileId(fileId);
    setRedactionAreas([]);
    setSelectedArea(null);
    setActiveTab('redact');
  };

  const handleRedactionComplete = () => {
    // Redaction completed - could add success message or other actions here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-300/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* Header */}
      <header className="relative bg-gray-900/90 backdrop-blur-xl shadow-2xl border-b border-yellow-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl ring-4 ring-yellow-400/20 animate-pulse">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold brand-font-primary text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 drop-shadow-lg">
                    SecureDoc
                  </h1>
                  <p className="text-sm brand-font-secondary text-gray-300">Document Privacy Protection</p>
                </div>
              </div>
              <span className="px-4 py-2 text-xs font-bold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg ring-2 ring-yellow-400/50 animate-pulse">
                🔒 HIPAA Compliant
              </span>
            </div>
            <nav className="flex space-x-3">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-8 py-4 rounded-2xl text-sm font-bold brand-font-secondary transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black shadow-2xl ring-4 ring-yellow-400/50 scale-105 border-2 border-yellow-300'
                    : 'bg-black/80 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/20 backdrop-blur-sm border-2 border-yellow-400/60 hover:border-yellow-400 shadow-lg hover:shadow-yellow-400/20'
                }`}
              >
                📁 Upload Document
              </button>
              <button
                onClick={() => setActiveTab('redact')}
                className={`px-8 py-4 rounded-2xl text-sm font-bold brand-font-secondary transition-all duration-300 transform hover:scale-105 ${
                  activeTab === 'redact'
                    ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black shadow-2xl ring-4 ring-yellow-400/50 scale-105 border-2 border-yellow-300'
                    : 'bg-black/80 text-gray-300 hover:text-yellow-400 hover:bg-yellow-400/20 backdrop-blur-sm border-2 border-gray-600 hover:border-yellow-400 shadow-lg hover:shadow-yellow-400/20'
                }`}
                disabled={!currentFile}
              >
                🖍️ Redact Content
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-16 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-yellow-500/5 rounded-3xl blur-3xl"></div>
              <div className="relative">
                <h2 className="text-5xl font-bold brand-font-primary text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 mb-6 drop-shadow-2xl">
                  Secure Your Documents with Professional Redaction
                </h2>
                <p className="text-xl brand-font-secondary text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                  Protect sensitive information in bank statements, medical records, bills, contracts, and any PDF document. 
                  Professional-grade redaction technology that's secure, reliable, and easy to use.
                </p>
                <div className="flex justify-center space-x-12 text-sm">
                  <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-yellow-400/30">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                    <span className="brand-font-secondary text-yellow-400 font-semibold">Bank Statements</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-yellow-400/30">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                    <span className="brand-font-secondary text-yellow-400 font-semibold">Medical Records</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full border border-yellow-400/30">
                    <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                    <span className="brand-font-secondary text-yellow-400 font-semibold">Legal Documents</span>
                  </div>
                </div>
              </div>
            </div>
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}

        {activeTab === 'redact' && currentFile && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Redaction</h2>
              <p className="text-gray-600">Click and drag to select areas you want to redact, then apply the changes.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PdfViewer
                  file={currentFile}
                  redactionAreas={redactionAreas}
                  onRedactionAreasChange={setRedactionAreas}
                  selectedArea={selectedArea}
                  onSelectedAreaChange={setSelectedArea}
                />
              </div>
              <div className="lg:col-span-1">
                <RedactionPanel
                  fileId={currentFileId}
                  redactionAreas={redactionAreas}
                  selectedArea={selectedArea}
                  onSelectedAreaChange={setSelectedArea}
                  onRedactionComplete={handleRedactionComplete}
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-black via-gray-900 to-black text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold brand-font-primary text-yellow-400 mb-4">SecureDoc</h3>
              <p className="text-gray-300 text-sm brand-font-secondary mb-4">
                Professional document redaction technology for secure privacy protection. 
                Perfect for bank statements, medical records, legal documents, and any sensitive PDF.
              </p>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">
                  🔒 Enterprise-grade security
                </p>
                <p className="text-gray-400 text-sm">
                  📄 HIPAA compliant redaction
                </p>
                <p className="text-gray-400 text-sm">
                  ⚡ Real-time processing
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-400 mb-4 brand-font-secondary">Document Types</h4>
              <ul className="space-y-2 text-sm text-gray-300 brand-font-secondary">
                <li className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>🏦 Bank Statements</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>🏥 Medical Records</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>📋 Legal Documents</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>📄 Bills & Invoices</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-400 mb-4 brand-font-secondary">Security Features</h4>
              <ul className="space-y-2 text-sm text-gray-300 brand-font-secondary">
                <li className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>🔒 End-to-End Encryption</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>⚡ Real-Time Processing</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>🛡️ Secure File Handling</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>📊 Audit Trail Logging</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-400 brand-font-secondary">
              &copy; 2024 SecureDoc. Professional document redaction solutions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
