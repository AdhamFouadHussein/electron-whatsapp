import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function MessageLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, usersData] = await Promise.all([
        window.api.db.getMessageLogs(),
        window.api.db.getUsers()
      ]);
      setLogs(logsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    let filtered = [...logs];
    
    if (filterUser) {
      filtered = filtered.filter(log => log.user_id === parseInt(filterUser));
    }
    
    if (filterStatus) {
      filtered = filtered.filter(log => log.status === filterStatus);
    }
    
    if (filterType) {
      filtered = filtered.filter(log => log.message_type === filterType);
    }
    
    return filtered;
  };

  const getStatusColor = (status) => {
    return status === 'sent' ? '#4CAF50' : '#F44336';
  };

  const getTypeIcon = (type) => {
    const icons = {
      reminder: '⏰',
      birthday: '🎂',
      manual: '✉️'
    };
    return icons[type] || '📧';
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const viewDetails = (log) => {
    setSelectedLog(log);
  };

  const exportLogs = () => {
    const filtered = getFilteredLogs();
    const csv = [
      ['Date', 'User', 'Phone', 'Type', 'Status', 'Language', 'Message'],
      ...filtered.map(log => [
        formatDateTime(log.sent_at),
        log.user_name || 'N/A',
        log.phone,
        log.message_type,
        log.status,
        log.language || 'N/A',
        log.message_text.replace(/"/g, '""')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const filteredLogs = getFilteredLogs();
  const totalSent = filteredLogs.filter(l => l.status === 'sent').length;
  const totalFailed = filteredLogs.filter(l => l.status === 'failed').length;
  const successRate = filteredLogs.length > 0 
    ? ((totalSent / filteredLogs.length) * 100).toFixed(1) 
    : 0;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('nav.logs')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
          >
            📥 Export CSV
          </button>
        </div>

        {/* Statistics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px', 
          marginBottom: '25px' 
        }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Messages</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent)' }}>
              {filteredLogs.length}
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sent Successfully</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#4CAF50' }}>
              {totalSent}
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Failed</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#F44336' }}>
              {totalFailed}
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Success Rate</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: successRate >= 90 ? '#4CAF50' : '#FF9800' }}>
              {successRate}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">{t('common.filter')} by User</label>
            <select
              className="form-select"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">{t('common.filter')} by Status</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="sent">✅ Sent</option>
              <option value="failed">❌ Failed</option>
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">{t('common.filter')} by Type</label>
            <select
              className="form-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="reminder">⏰ Reminder</option>
              <option value="birthday">🎂 Birthday</option>
              <option value="manual">✉️ Manual</option>
            </select>
          </div>

          {(filterUser || filterStatus || filterType) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => { setFilterUser(''); setFilterStatus(''); setFilterType(''); }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Logs Table */}
        {filteredLogs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Language</th>
                  <th>Sent At</th>
                  <th>Message Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs
                  .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
                  .map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span style={{ fontSize: '20px' }} title={log.message_type}>
                          {getTypeIcon(log.message_type)}
                        </span>
                      </td>
                      <td>{log.user_name || 'N/A'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {log.phone}
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: getStatusColor(log.status) + '20',
                          color: getStatusColor(log.status)
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.language ? log.language.toUpperCase() : '-'}</td>
                      <td style={{ fontSize: '13px' }}>{formatDateTime(log.sent_at)}</td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontSize: '13px'
                        }}>
                          {log.message_text}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => viewDetails(log)}
                          title="View full message"
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>No message logs found</div>
            <div style={{ fontSize: '14px' }}>Messages will appear here once sent</div>
          </div>
        )}
      </div>

      {/* Message Details Modal */}
      {selectedLog && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📧 Message Details</h3>
              <button className="modal-close" onClick={() => setSelectedLog(null)}>
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              {/* Info Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '120px 1fr', 
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Type:</div>
                <div>{getTypeIcon(selectedLog.message_type)} {selectedLog.message_type}</div>

                <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>User:</div>
                <div>{selectedLog.user_name || 'N/A'}</div>

                <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Phone:</div>
                <div style={{ fontFamily: 'monospace' }}>{selectedLog.phone}</div>

                <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Status:</div>
                <div>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: getStatusColor(selectedLog.status) + '20',
                    color: getStatusColor(selectedLog.status)
                  }}>
                    {selectedLog.status}
                  </span>
                </div>

                <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Language:</div>
                <div>{selectedLog.language ? selectedLog.language.toUpperCase() : 'N/A'}</div>

                <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Sent At:</div>
                <div>{formatDateTime(selectedLog.sent_at)}</div>

                {selectedLog.file_id && (
                  <>
                    <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Attachment:</div>
                    <div>📎 File attached</div>
                  </>
                )}

                {selectedLog.error_message && (
                  <>
                    <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Error:</div>
                    <div style={{ color: '#F44336' }}>{selectedLog.error_message}</div>
                  </>
                )}
              </div>

              {/* Message Content */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                  Message Content:
                </div>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '15px',
                  borderRadius: '8px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.6',
                  border: '1px solid var(--border-color)',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  {selectedLog.message_text}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedLog(null)}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageLogs;
