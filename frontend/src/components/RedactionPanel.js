import React, { useState } from 'react';
import axios from 'axios';

const RedactionPanel = ({
  fileId,
  redactionAreas,
  selectedArea,
  onSelectedAreaChange,
  onRedactionComplete
}) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRedactedFileId, setLastRedactedFileId] = useState(null);

  const [redactionCodes] = useState([
    { code: 'PERSONAL_INFO', label: 'Personal Information' },
    { code: 'NAME', label: 'Name' },
    { code: 'DATE_OF_BIRTH', label: 'Date of Birth' },
    { code: 'SSN', label: 'Social Security Number' },
    { code: 'ADDRESS', label: 'Address' },
    { code: 'PHONE', label: 'Phone Number' },
    { code: 'EMAIL', label: 'Email Address' },
    { code: 'ACCOUNT_NUMBER', label: 'Account Number' },
    { code: 'FINANCIAL_INFO', label: 'Financial Information' },
    { code: 'MEDICAL_INFO', label: 'Medical Information' },
    { code: 'LEGAL_INFO', label: 'Legal Information' },
    { code: 'CUSTOM', label: 'Custom' }
  ]);

  const handleCodeChange = (code) => {
    if (selectedArea) {
      const updatedArea = { ...selectedArea, redactionCode: code };
      onSelectedAreaChange(updatedArea);
    }
  };

  const handleDescriptionChange = (description) => {
    if (selectedArea) {
      const updatedArea = { ...selectedArea, description };
      onSelectedAreaChange(updatedArea);
    }
  };

  const handleApplyRedaction = async () => {
    if (redactionAreas.length === 0) {
      alert('Please create at least one redaction area before applying redaction.');
      return;
    }

    if (!fileId) {
      alert('No file ID available. Please upload a file first.');
      return;
    }

    setIsProcessing(true);

    try {
      // Fetch CSRF token first
      const csrfRes = await axios.get('http://localhost:8080/api/csrf-token', { withCredentials: true });
      const csrfToken = csrfRes.data.csrfToken;

      const redactionRequest = {
        fileId: fileId,
        redactionAreas: redactionAreas.map(area => ({
          pageNumber: area.pageNumber,
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          redactionCode: area.redactionCode,
          description: area.description
        })),
        reason: reason,
        redactionType: 'MANUAL'
      };

      const response = await axios.post('http://localhost:8080/api/redaction/redact', redactionRequest, {
        withCredentials: true,
        headers: {
          'x-csrf-token': csrfToken
        }
      });

      // Store the redacted file ID for manual download
      setLastRedactedFileId(response.data.redactedFileId);

      // Download the redacted PDF
      if (response.data.downloadUrl) {
        const downloadUrl = `http://localhost:8080${response.data.downloadUrl}`;
        const redactedFileId = response.data.redactedFileId;

        // Test if the download URL is accessible
        fetch(downloadUrl, { credentials: 'include' })
          .then(fetchResponse => {
            if (fetchResponse.ok) {
              const link = document.createElement('a');
              link.href = downloadUrl;
              link.download = `redacted-${redactedFileId}.pdf`;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              alert('Redaction applied successfully! Download started.');
            } else {
              console.error('Download URL not accessible:', fetchResponse.status);
              alert('Redaction applied successfully! Use the download button below to get your file.');
            }
          })
          .catch(error => {
            console.error('Download error:', error);
            alert('Redaction applied successfully! Use the download button below to get your file.');
          });
      } else {
        console.error('No download URL received from server');
        alert('Redaction applied successfully! Use the download button below to get your file.');
      }

      onRedactionComplete();
    } catch (error) {
      console.error('Redaction error:', error);
      alert('Error applying redaction. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalAreas = () => {
    return redactionAreas.length;
  };

  const handleManualDownload = () => {
    if (!lastRedactedFileId) {
      alert('No redacted file available for download. Please apply redaction first.');
      return;
    }

    const downloadUrl = `http://localhost:8080/api/redaction/download/${lastRedactedFileId}`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `redacted-${lastRedactedFileId}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAreasByCode = () => {
    const codeCounts = {};
    redactionAreas.forEach(area => {
      codeCounts[area.redactionCode] = (codeCounts[area.redactionCode] || 0) + 1;
    });
    return codeCounts;
  };

  return (
    <div className="space-y-6">
      {/* Redaction Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Redaction Summary
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Areas:</span>
            <span className="font-medium">{getTotalAreas()}</span>
          </div>

          {Object.entries(getAreasByCode()).map(([code, count]) => {
            const codeInfo = redactionCodes.find(c => c.code === code);
            return (
              <div key={code} className="flex justify-between text-sm">
                <span className="text-gray-600">{codeInfo?.label || code}:</span>
                <span className="font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Area Details */}
      {selectedArea && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Selected Area Details
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redaction Code
              </label>
              <select
                value={selectedArea.redactionCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hipaa-blue"
              >
                {redactionCodes.map(code => (
                  <option key={code.code} value={code.code}>
                    {code.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={selectedArea.description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Describe what is being redacted..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hipaa-blue"
                rows={3}
              />
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Page:</strong> {selectedArea.pageNumber}</p>
              <p><strong>Position:</strong> ({Math.round(selectedArea.x)}, {Math.round(selectedArea.y)})</p>
              <p><strong>Size:</strong> {Math.round(selectedArea.width)} × {Math.round(selectedArea.height)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Redaction Reason */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Redaction Details
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Redaction
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for redacting this document..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hipaa-blue"
            rows={3}
          />
        </div>
      </div>

      {/* Apply Redaction */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Apply Redaction
        </h3>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">
                  Irreversible Action
                </h4>
                <p className="mt-1 text-sm text-yellow-700">
                  This action will permanently remove the selected content from the PDF.
                  This cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyRedaction}
            disabled={isProcessing || redactionAreas.length === 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold brand-font-secondary rounded-lg hover:from-yellow-500 hover:to-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg"
          >
            {isProcessing ? 'Processing...' : 'Apply Irreversible Redaction'}
          </button>

          {/* Download Button */}
          {lastRedactedFileId && (
            <button
              onClick={handleManualDownload}
              className="w-full mt-3 px-4 py-3 bg-black text-yellow-400 font-semibold brand-font-secondary rounded-lg hover:bg-gray-800 shadow-lg"
            >
              📥 Download Redacted PDF
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default RedactionPanel;
