import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/redaction/audit');
      setAuditLogs(response.data);
    } catch (err) {
      setError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filter === 'all') return true;
    return log.action === filter;
  });

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'FILE_UPLOADED':
        return 'bg-green-100 text-green-800';
      case 'REDACTION_APPLIED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'File ID', 'Action', 'User ID', 'Redaction Codes', 'Reason', 'IP Address'],
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.fileId,
        log.action,
        log.userId,
        log.redactionCodes || '',
        log.reason || '',
        log.ipAddress || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadRedactedFile = (fileId) => {
    const downloadUrl = `http://localhost:8080/api/redaction/download/${fileId}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `redacted-${fileId}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hipaa-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchAuditLogs}
              className="mt-2 text-sm text-red-600 hover:text-red-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hipaa-blue"
          >
            <option value="all">All Actions</option>
            <option value="FILE_UPLOADED">File Uploads</option>
            <option value="REDACTION_APPLIED">Redactions</option>
          </select>
          <button
            onClick={exportAuditLogs}
            className="px-4 py-2 bg-hipaa-blue text-white rounded-md hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
            <p className="mt-1 text-sm text-gray-500">No audit logs found for the selected filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <li key={log.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        File ID: {log.fileId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimestamp(log.timestamp)} • User: {log.userId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {log.ipAddress && `IP: ${log.ipAddress}`}
                    </div>
                  </div>
                </div>
                
                {log.redactionCodes && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600">
                      <strong>Redaction Codes:</strong> {log.redactionCodes}
                    </div>
                  </div>
                )}
                
                {log.reason && (
                  <div className="mt-1">
                    <div className="text-sm text-gray-600">
                      <strong>Reason:</strong> {log.reason}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <strong>Original Hash:</strong> {log.originalHash?.substring(0, 16)}...
                  </div>
                  {log.redactedHash && (
                    <div>
                      <strong>Redacted Hash:</strong> {log.redactedHash.substring(0, 16)}...
                    </div>
                  )}
                </div>
                
                {log.action === 'REDACTION_APPLIED' && (
                  <div className="mt-2">
                    <button
                      onClick={() => downloadRedactedFile(log.fileId)}
                      className="px-3 py-1 bg-hipaa-blue text-white text-xs rounded hover:bg-blue-700"
                    >
                      Download Redacted PDF
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              HIPAA Compliance Notice
            </h4>
            <p className="mt-1 text-sm text-blue-700">
              This audit log provides a complete, immutable record of all PHI redaction activities 
              for compliance with HIPAA requirements. All entries include cryptographic hashes 
              and timestamps for verification purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
