import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
    setFormData({ ...formData, event_id: eventId });
    
    if (eventId) {
      const selectedEvent = events.find(e => e.id === parseInt(eventId));
      if (selectedEvent) {
        await loadUserFiles(selectedEvent.user_id);
        
        // Set default reminder time to 1 hour before event
        const eventDate = new Date(selectedEvent.event_date);
        eventDate.setHours(eventDate.getHours() - 1);
        const defaultReminderTime = eventDate.toISOString().slice(0, 16);
        setFormData(prev => ({ ...prev, reminder_time: defaultReminderTime }));
      }
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

  const handleEdit = (reminder) => {
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
            ➕ {t('reminders.addReminder')}
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
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Pending</div>
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
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sent</div>
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
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Failed</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#F44336' }}>
              {failedReminders.length}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">{t('common.filter')} by Status</label>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ maxWidth: '300px' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="sent">✅ Sent</option>
            <option value="failed">❌ Failed</option>
            <option value="cancelled">🚫 Cancelled</option>
          </select>
        </div>

        {/* Reminders Table */}
        {filteredReminders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>Reminder Time</th>
                  <th>Message Preview</th>
                  <th>Attachment</th>
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
                          {reminder.custom_message || 'Using template'}
                        </div>
                      </td>
                      <td>
                        {reminder.file_id ? '📎' : '-'}
                      </td>
                      <td>
                        {reminder.status === 'pending' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ marginRight: '5px', padding: '6px 12px', fontSize: '13px' }} 
                            onClick={() => handleEdit(reminder)}
                            title={t('common.edit')}
                          >
                            ✏️
                          </button>
                        )}
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => handleDelete(reminder)}
                          title={t('common.delete')}
                        >
                          🗑️
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
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏰</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>No reminders found</div>
            <div style={{ fontSize: '14px' }}>Create a reminder to automate notifications!</div>
          </div>
        )}
      </div>

      {/* Add/Edit Reminder Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingReminder ? `✏️ ${t('reminders.editReminder')}` : `➕ ${t('reminders.addReminder')}`}
              </h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Event Selection */}
              <div className="form-group">
                <label className="form-label">Event *</label>
                <select
                  className="form-select"
                  value={formData.event_id}
                  onChange={(e) => handleEventChange(e.target.value)}
                  required
                >
                  <option value="">{t('common.select')} event...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {event.user_name} ({formatDateTime(event.event_date)})
                    </option>
                  ))}
                </select>
                {events.length === 0 && (
                  <div style={{ fontSize: '13px', color: '#F44336', marginTop: '5px' }}>
                    No upcoming events available. Please create an event first.
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
                  When to send the reminder (usually before the event)
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
                  <option value="">Use default template for event type</option>
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
                  placeholder="Leave empty to use template. Use {{name}}, {{title}}, {{date}}, {{location}} for variables."
                  rows="4"
                />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                  Optional: Override template with custom message
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
                  <option value="">No file attachment</option>
                  {files.map(file => (
                    <option key={file.id} value={file.id}>
                      📎 {file.original_name} ({(file.file_size / 1024).toFixed(1)} KB)
                    </option>
                  ))}
                </select>
                {formData.event_id && files.length === 0 && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                    No files uploaded for this user yet.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReminder ? '💾 Update' : '➕ Create Reminder'}
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
