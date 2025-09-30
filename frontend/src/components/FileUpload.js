import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ onFileUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file only.');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      // Fetch CSRF token first
      const csrfRes = await axios.get('http://localhost:8080/api/csrf-token', { withCredentials: true });
      const csrfToken = csrfRes.data.csrfToken;

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:8080/api/redaction/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-csrf-token': csrfToken
        },
        withCredentials: true
      });

      setUploadResult({
        fileId: response.data.fileId,
        fileHash: response.data.fileHash,
        fileName: file.name,
        fileSize: file.size
      });

      onFileUpload(file, response.data.fileId);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-yellow-400/20 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-yellow-500/5 rounded-3xl"></div>
        <div className="text-center mb-8 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-yellow-400/20 animate-pulse">
            <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold brand-font-primary text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 mb-3 drop-shadow-lg">Upload Your PDF</h2>
          <p className="text-gray-300 brand-font-secondary text-lg">Drag and drop your document or click to browse</p>
        </div>

        <div
          className={`relative border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 relative z-10 ${dragActive
              ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/10 to-yellow-500/10 scale-105 shadow-2xl ring-4 ring-yellow-400/20'
              : 'border-yellow-400/40 hover:border-yellow-400 hover:bg-yellow-400/5 backdrop-blur-sm'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          <div className="space-y-8">
            <div className="mx-auto w-28 h-28 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 rounded-3xl flex items-center justify-center ring-2 ring-yellow-400/30">
              <svg className="w-14 h-14 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div>
              <p className="text-3xl font-bold brand-font-primary text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 mb-3">
                {uploading ? '⏳ Processing...' : dragActive ? '🎯 Drop your PDF here' : '📄 Choose your PDF document'}
              </p>
              <p className="text-gray-300 text-xl brand-font-secondary">
                {uploading ? 'Please wait while we process your file' : 'or click to browse files'}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                <span className="brand-font-secondary text-yellow-400 font-semibold">Max 100MB</span>
              </div>
              <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                <span className="brand-font-secondary text-yellow-400 font-semibold">PDF Only</span>
              </div>
              <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full border border-yellow-400/30">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                <span className="brand-font-secondary text-yellow-400 font-semibold">Secure Upload</span>
              </div>
            </div>
          </div>
        </div>

        {uploadResult && (
          <div className="mt-8 relative z-10">
            <div className="bg-gradient-to-r from-yellow-400/10 to-yellow-500/10 border border-yellow-400/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg ring-2 ring-yellow-400/30">
                  <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-yellow-400 font-bold text-xl brand-font-primary">🎉 Upload Successful!</p>
                  <p className="text-gray-300 brand-font-secondary text-lg">
                    <span className="font-semibold">{uploadResult.fileName}</span>
                    <span className="text-sm ml-2 text-gray-400">({Math.round(uploadResult.fileSize / 1024)} KB)</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-1 brand-font-secondary">
                    Ready for redaction • ID: {uploadResult.fileId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default FileUpload;
