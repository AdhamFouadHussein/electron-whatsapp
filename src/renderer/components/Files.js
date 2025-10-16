import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiUpload, 
  FiFile,
  FiTrash2, 
  FiDownload,
  FiEye,
  FiPaperclip,
  FiX,
  FiFilter,
  FiSearch
} from 'react-icons/fi';

function Files() {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterUserId, setFilterUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    user_id: '',
    file: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, filesData] = await Promise.all([
        window.api.db.getUsers(),
        window.api.db.getAllFiles()
      ]);
      setUsers(usersData);
      setFiles(filesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserFiles = async (userId) => {
    try {
      const filesData = await window.api.db.getUserFiles(userId);
      setFiles(filesData);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 16MB for MySQL BLOB)
      if (file.size > 16 * 1024 * 1024) {
        alert(t('files.fileTooLarge'));
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.user_id) {
      alert(t('files.selectUser'));
      return;
    }
    if (!uploadForm.file) {
      alert(t('files.selectFile'));
      return;
    }

    try {
      setUploading(true);
      
      // Read file as buffer
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        const buffer = new Uint8Array(arrayBuffer);
        
        const fileData = {
          user_id: parseInt(uploadForm.user_id),
          filename: uploadForm.file.name,
          original_name: uploadForm.file.name,
          file_type: uploadForm.file.type.split('/')[0] || 'document',
          file_size: uploadForm.file.size,
          file_data: Array.from(buffer), // Convert to regular array for IPC
          mime_type: uploadForm.file.type || 'application/octet-stream'
        };

        try {
          await window.api.db.uploadFile(fileData);
          alert(t('files.uploadSuccess'));
          setShowUploadModal(false);
          resetUploadForm();
          loadData();
        } catch (error) {
          console.error('Upload error:', error);
          alert(t('files.uploadError') + ': ' + error.message);
        } finally {
          setUploading(false);
        }
      };
      
      reader.onerror = () => {
        alert(t('files.fileReadError'));
        setUploading(false);
      };
      
      reader.readAsArrayBuffer(uploadForm.file);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert(t('files.uploadError') + ': ' + error.message);
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (confirm(t('files.confirmDelete'))) {
      try {
        await window.api.db.deleteFile(fileId);
        alert(t('common.success'));
        loadData();
      } catch (error) {
        console.error('Failed to delete file:', error);
        alert(t('files.deleteError') + ': ' + error.message);
      }
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      user_id: '',
      file: null
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredFiles = () => {
    let filtered = [...files];
    
    // Filter by user
    if (filterUserId) {
      filtered = filtered.filter(f => f.user_id === parseInt(filterUserId));
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.user_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getFileIcon = (fileType) => {
    const icons = {
      image: '🖼️',
      video: '🎥',
      audio: '🎵',
      document: '📄',
      application: '📦'
    };
    return icons[fileType] || '📎';
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const filteredFiles = getFilteredFiles();

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('files.title')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowUploadModal(true)}
          >
            <FiUpload style={{ marginRight: '5px' }} />
            {t('files.uploadFile')}
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
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {t('files.totalFiles')}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--primary)' }}>
              {files.length}
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {t('files.totalSize')}
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#4CAF50' }}>
              {formatFileSize(files.reduce((sum, f) => sum + f.file_size, 0))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px' 
        }}>
          <div>
            <label className="form-label">
              <FiFilter style={{ marginRight: '5px' }} />
              {t('files.filterByUser')}
            </label>
            <select
              className="form-select"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            >
              <option value="">{t('files.allUsers')}</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.phone})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">
              <FiSearch style={{ marginRight: '5px' }} />
              {t('files.search')}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={t('files.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Files Table */}
        {filteredFiles.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('files.type')}</th>
                  <th>{t('files.fileName')}</th>
                  <th>{t('files.user')}</th>
                  <th>{t('files.fileSize')}</th>
                  <th>{t('files.uploadDate')}</th>
                  <th>{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td style={{ fontSize: '24px' }}>
                      {getFileIcon(file.file_type)}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{file.original_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {file.mime_type}
                      </div>
                    </td>
                    <td>
                      <div>{file.user_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {file.user_phone}
                      </div>
                    </td>
                    <td>{formatFileSize(file.file_size)}</td>
                    <td>{formatDateTime(file.created_at)}</td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => handleDelete(file.id)}
                        title={t('common.delete')}
                      >
                        <FiTrash2 />
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
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>
              <FiFile style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>
              {t('files.noFilesFound')}
            </div>
            <div style={{ fontSize: '14px' }}>{t('files.uploadFirstFile')}</div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <FiUpload style={{ marginRight: '8px' }} />
                {t('files.uploadFile')}
              </h3>
              <button className="modal-close" onClick={() => { setShowUploadModal(false); resetUploadForm(); }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              {/* User Selection */}
              <div className="form-group">
                <label className="form-label">{t('files.selectUser')} *</label>
                <select
                  className="form-select"
                  value={uploadForm.user_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, user_id: e.target.value })}
                  required
                >
                  <option value="">{t('common.select')} {t('files.user').toLowerCase()}...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.phone})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  {t('files.userHelp')}
                </div>
              </div>

              {/* File Input */}
              <div className="form-group">
                <label className="form-label">{t('files.selectFile')} *</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={handleFileSelect}
                  required
                  style={{ padding: '8px' }}
                />
                {uploadForm.file && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}>
                    <div><strong>{t('files.fileName')}:</strong> {uploadForm.file.name}</div>
                    <div><strong>{t('files.fileSize')}:</strong> {formatFileSize(uploadForm.file.size)}</div>
                    <div><strong>{t('files.fileType')}:</strong> {uploadForm.file.type || 'Unknown'}</div>
                  </div>
                )}
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  {t('files.maxFileSize')} 16MB
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                  disabled={uploading}
                >
                  <FiX style={{ marginRight: '5px' }} />
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner" style={{ width: '14px', height: '14px', marginRight: '5px' }}></span>
                      {t('files.uploading')}
                    </>
                  ) : (
                    <>
                      <FiUpload style={{ marginRight: '5px' }} />
                      {t('files.upload')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Files;
