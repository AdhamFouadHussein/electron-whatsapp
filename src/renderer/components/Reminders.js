import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiClock, 
  FiCheck, 
  FiX, 
  FiAlertTriangle, 
  FiSlash,
  FiPaperclip,
  FiSave,
  FiFilter
} from 'react-icons/fi';

function Reminders() {
  const { t } = useTranslation();
  const [reminders, setReminders] = useState([]);
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    event_id: '',
    reminder_time: '',
    message_template_id: '',
    custom_message: '',
    file_id: '',
    status: 'pending'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [remindersData, eventsData, templatesData] = await Promise.all([
        window.api.db.getReminders(),
        window.api.db.getEvents(),
        window.api.db.getMessageTemplates()
      ]);
      setReminders(remindersData);
      setEvents(eventsData.filter(e => new Date(e.event_date) > new Date())); // Only upcoming events
      setTemplates(templatesData);
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

  const handleEventChange = async (eventId) => {
    if (eventId) {
      const selectedEvent = events.find(e => e.id === parseInt(eventId));
      if (selectedEvent) {
        await loadUserFiles(selectedEvent.user_id);
        
        // Set default reminder time to 1 hour before event (only if creating new reminder)
        if (!editingReminder) {
          const eventDate = new Date(selectedEvent.event_date);
          eventDate.setHours(eventDate.getHours() - 1);
          const defaultReminderTime = eventDate.toISOString().slice(0, 16);
          setFormData(prev => ({ ...prev, event_id: eventId, reminder_time: defaultReminderTime, file_id: '' }));
        } else {
          setFormData(prev => ({ ...prev, event_id: eventId, file_id: '' }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, event_id: '', file_id: '' }));
      setFiles([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.event_id) {
      alert('Please select an event');
      return;
    }
    if (!formData.reminder_time) {
      alert('Please select reminder time');
      return;
    }

    try {
      // Clean up formData - convert empty strings to null for optional fields
      const cleanedData = {
        ...formData,
        message_template_id: formData.message_template_id || null,
        custom_message: formData.custom_message || null,
        file_id: formData.file_id || null
      };
      
      if (editingReminder) {
        await window.api.db.updateReminder(editingReminder.id, cleanedData);
      } else {
        await window.api.db.createReminder(cleanedData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save reminder:', error);
      alert('Failed to save reminder: ' + error.message);
    }
  };

  const handleEdit = async (reminder) => {
    setEditingReminder(reminder);
    const reminderTime = new Date(reminder.reminder_time).toISOString().slice(0, 16);
    setFormData({
      event_id: reminder.event_id,
      reminder_time: reminderTime,
      message_template_id: reminder.message_template_id || '',
      custom_message: reminder.custom_message || '',
      file_id: reminder.file_id || '',
      status: reminder.status
    });
    
    // Load files for this event's user
    const selectedEvent = events.find(e => e.id === reminder.event_id);
    if (selectedEvent) {
      await loadUserFiles(selectedEvent.user_id);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (reminder) => {
    if (confirm(`${t('common.delete')} this reminder?`)) {
      try {
        await window.api.db.deleteReminder(reminder.id);
        loadData();
      } catch (error) {
        console.error('Failed to delete reminder:', error);
        alert('Failed to delete reminder: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setEditingReminder(null);
    setFormData({
      event_id: '',
      reminder_time: '',
      message_template_id: '',
      custom_message: '',
      file_id: '',
      status: 'pending'
    });
    setFiles([]);
  };

  const getFilteredReminders = () => {
    if (filterStatus) {
      return reminders.filter(r => r.status === filterStatus);
    }
    return reminders;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FF9800',
      sent: '#4CAF50',
      failed: '#F44336',
      cancelled: '#757575'
    };
    return colors[status] || '#757575';
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

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const filteredReminders = getFilteredReminders();
  const pendingReminders = filteredReminders.filter(r => r.status === 'pending');
  const sentReminders = filteredReminders.filter(r => r.status === 'sent');
  const failedReminders = filteredReminders.filter(r => r.status === 'failed');

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('reminders.title')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <FiPlus style={{ marginRight: '5px' }} />
            {t('reminders.addReminder')}
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
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('reminders.pending')}</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#FF9800' }}>
              {pendingReminders.length}
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('reminders.sent')}</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#4CAF50' }}>
              {sentReminders.length}
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{t('reminders.failed')}</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#F44336' }}>
              {failedReminders.length}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">
            <FiFilter style={{ marginRight: '5px' }} />
            {t('common.filter')} by {t('reminders.status')}
          </label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            <option value="">{t('reminders.allStatuses')}</option>
            <option value="pending">
              {t('reminders.pending')}
            </option>
            <option value="sent">
              {t('reminders.sent')}
            </option>
            <option value="failed">
              {t('reminders.failed')}
            </option>
            <option value="cancelled">
              {t('reminders.cancelled')}
            </option>
          </select>
        </div>

        {/* Reminders Table */}
        {filteredReminders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('reminders.status')}</th>
                  <th>{t('reminders.event')}</th>
                  <th>{t('reminders.user')}</th>
                  <th>{t('reminders.reminderTime')}</th>
                  <th>{t('reminders.messagePreview')}</th>
                  <th>{t('reminders.attachment')}</th>
                  <th>{t('users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders
                  .sort((a, b) => new Date(a.reminder_time) - new Date(b.reminder_time))
                  .map((reminder) => (
                    <tr key={reminder.id}>
                      <td>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: getStatusColor(reminder.status) + '20',
                          color: getStatusColor(reminder.status)
                        }}>
                          {reminder.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{reminder.event_title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {formatDateTime(reminder.event_date)}
                        </div>
                      </td>
                      <td>{reminder.user_name}</td>
                      <td>{formatDateTime(reminder.reminder_time)}</td>
                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontSize: '13px'
                        }}>
                          {reminder.custom_message || t('reminders.usingTemplate')}
                        </div>
                      </td>
                      <td>
                        {reminder.file_id ? <FiPaperclip color="#4CAF50" /> : '-'}
                      </td>
                      <td>
                        {reminder.status === 'pending' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ marginRight: '5px', padding: '6px 12px', fontSize: '13px' }} 
                            onClick={() => handleEdit(reminder)}
                            title={t('common.edit')}
                          >
                            <FiEdit2 />
                          </button>
                        )}
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => handleDelete(reminder)}
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
              <FiClock style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>{t('reminders.noRemindersFound')}</div>
            <div style={{ fontSize: '14px' }}>{t('reminders.createFirstReminder')}</div>
          </div>
        )}
      </div>

      {/* Add/Edit Reminder Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingReminder ? (
                  <>
                    <FiEdit2 style={{ marginRight: '8px' }} />
                    {t('reminders.editReminder')}
                  </>
                ) : (
                  <>
                    <FiPlus style={{ marginRight: '8px' }} />
                    {t('reminders.addReminder')}
                  </>
                )}
              </h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Event Selection */}
              <div className="form-group">
                <label className="form-label">{t('reminders.event')} *</label>
                <select
                  className="form-select"
                  value={formData.event_id}
                  onChange={(e) => handleEventChange(e.target.value)}
                  required
                >
                  <option value="">{t('common.select')} {t('reminders.event').toLowerCase()}...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {event.user_name} ({formatDateTime(event.event_date)})
                    </option>
                  ))}
                </select>
                {events.length === 0 && (
                  <div style={{ fontSize: '13px', color: '#F44336', marginTop: '5px' }}>
                    {t('reminders.noUpcomingEvents')}
                  </div>
                )}
              </div>

              {/* Reminder Time */}
              <div className="form-group">
                <label className="form-label">{t('reminders.reminderTime')} *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                  required
                />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  {t('reminders.reminderTimeHelp')}
                </div>
              </div>

              {/* Message Template */}
              <div className="form-group">
                <label className="form-label">{t('reminders.messageTemplate')}</label>
                <select
                  className="form-select"
                  value={formData.message_template_id}
                  onChange={(e) => setFormData({ ...formData, message_template_id: e.target.value })}
                >
                  <option value="">{t('reminders.useDefaultTemplate')}</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.language})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Message */}
              <div className="form-group">
                <label className="form-label">{t('reminders.customMessage')}</label>
                <textarea
                  className="form-textarea"
                  value={formData.custom_message}
                  onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                  placeholder={t('reminders.customMessagePlaceholder')}
                  rows="4"
                />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  {t('reminders.customMessageHelp')}
                </div>
              </div>

              {/* File Attachment */}
              <div className="form-group">
                <label className="form-label">{t('reminders.attachFile')}</label>
                <select
                  className="form-select"
                  value={formData.file_id}
                  onChange={(e) => setFormData({ ...formData, file_id: e.target.value })}
                  disabled={!formData.event_id}
                >
                  <option value="">{t('reminders.noFileAttachment')}</option>
                  {files.map(file => (
                    <option key={file.id} value={file.id}>
                      <FiPaperclip /> {file.original_name} ({(file.file_size / 1024).toFixed(1)} KB)
                    </option>
                  ))}
                </select>
                {formData.event_id && files.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                    {t('reminders.noFilesUploaded')}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  <FiX style={{ marginRight: '5px' }} />
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReminder ? (
                    <>
                      <FiSave style={{ marginRight: '5px' }} />
                      {t('reminders.updateReminder')}
                    </>
                  ) : (
                    <>
                      <FiPlus style={{ marginRight: '5px' }} />
                      {t('reminders.createReminder')}
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

export default Reminders;
