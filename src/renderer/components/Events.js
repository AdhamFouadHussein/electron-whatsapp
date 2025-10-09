import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function Events() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    event_type: 'meeting',
    title: '',
    description: '',
    event_date: '',
    location: '',
    reminder_enabled: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, usersData] = await Promise.all([
        window.api.db.getEvents(),
        window.api.db.getUsers()
      ]);
      setEvents(eventsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.user_id) {
      alert('Please select a user');
      return;
    }
    if (!formData.title.trim()) {
      alert('Please enter an event title');
      return;
    }
    if (!formData.event_date) {
      alert('Please select an event date and time');
      return;
    }

    try {
      if (editingEvent) {
        await window.api.db.updateEvent(editingEvent.id, formData);
      } else {
        await window.api.db.createEvent(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event: ' + error.message);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    
    // Format datetime-local input value
    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toISOString().slice(0, 16);
    
    setFormData({
      user_id: event.user_id,
      event_type: event.event_type,
      title: event.title,
      description: event.description || '',
      event_date: formattedDate,
      location: event.location || '',
      reminder_enabled: event.reminder_enabled
    });
    setShowModal(true);
  };

  const handleDelete = async (event) => {
    if (confirm(`${t('events.deleteEvent')}: "${event.title}"?`)) {
      try {
        await window.api.db.deleteEvent(event.id);
        loadData();
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Failed to delete event: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setEditingEvent(null);
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0); // Default to next hour
    const defaultDate = now.toISOString().slice(0, 16);
    
    setFormData({
      user_id: '',
      event_type: 'meeting',
      title: '',
      description: '',
      event_date: defaultDate,
      location: '',
      reminder_enabled: true
    });
  };

  const getFilteredEvents = () => {
    let filtered = [...events];
    
    if (filterUserId) {
      filtered = filtered.filter(e => e.user_id === parseInt(filterUserId));
    }
    
    if (filterEventType) {
      filtered = filtered.filter(e => e.event_type === filterEventType);
    }
    
    return filtered;
  };

  const getEventTypeLabel = (type) => {
    return t(`events.types.${type}`);
  };

  const getEventTypeColor = (type) => {
    const colors = {
      meeting: '#2196F3',
      embassy: '#9C27B0',
      flight: '#FF9800',
      birthday: '#E91E63',
      custom: '#607D8B'
    };
    return colors[type] || '#757575';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    const diff = eventDate - now;
    
    if (diff < 0) {
      return { text: 'Past', color: '#757575' };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 7) {
      return { text: `${days} days`, color: '#4CAF50' };
    } else if (days > 1) {
      return { text: `${days} days`, color: '#FF9800' };
    } else if (days === 1) {
      return { text: 'Tomorrow', color: '#FF9800' };
    } else if (hours > 2) {
      return { text: `${hours} hours`, color: '#F44336' };
    } else {
      return { text: 'Soon!', color: '#F44336' };
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const filteredEvents = getFilteredEvents();
  const upcomingEvents = filteredEvents.filter(e => new Date(e.event_date) > new Date());
  const pastEvents = filteredEvents.filter(e => new Date(e.event_date) <= new Date());

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('events.title')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            ➕ {t('events.addEvent')}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">{t('common.filter')} by User</label>
            <select
              className="form-select"
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">{t('common.filter')} by Type</label>
            <select
              className="form-select"
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="meeting">{getEventTypeLabel('meeting')}</option>
              <option value="embassy">{getEventTypeLabel('embassy')}</option>
              <option value="flight">{getEventTypeLabel('flight')}</option>
              <option value="birthday">{getEventTypeLabel('birthday')}</option>
              <option value="custom">{getEventTypeLabel('custom')}</option>
            </select>
          </div>

          {(filterUserId || filterEventType) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => { setFilterUserId(''); setFilterEventType(''); }}
              >
                Clear Filters
              </button>
            </div>
          )}
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
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Events</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--accent)' }}>
              {filteredEvents.length}
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Upcoming</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#4CAF50' }}>
              {upcomingEvents.length}
            </div>
          </div>
          <div style={{ 
            padding: '15px', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Past</div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#757575' }}>
              {pastEvents.length}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <>
            <h3 style={{ marginTop: '20px', marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
              📅 Upcoming Events
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>{t('events.eventTitle')}</th>
                    <th>{t('events.user')}</th>
                    <th>{t('events.eventDate')}</th>
                    <th>Time Until</th>
                    <th>{t('events.location')}</th>
                    <th>Reminder</th>
                    <th>{t('users.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingEvents
                    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
                    .map((event) => {
                      const timeUntil = getTimeUntil(event.event_date);
                      return (
                        <tr key={event.id}>
                          <td>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: getEventTypeColor(event.event_type) + '20',
                              color: getEventTypeColor(event.event_type)
                            }}>
                              {getEventTypeLabel(event.event_type)}
                            </span>
                          </td>
                          <td style={{ fontWeight: '500' }}>{event.title}</td>
                          <td>{event.user_name}</td>
                          <td>{formatDateTime(event.event_date)}</td>
                          <td>
                            <span style={{ 
                              color: timeUntil.color,
                              fontWeight: '500'
                            }}>
                              {timeUntil.text}
                            </span>
                          </td>
                          <td>{event.location || '-'}</td>
                          <td>
                            <span style={{ 
                              fontSize: '18px',
                              cursor: 'help',
                              title: event.reminder_enabled ? 'Reminder enabled' : 'No reminder'
                            }}>
                              {event.reminder_enabled ? '✅' : '❌'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary" 
                              style={{ marginRight: '5px', padding: '6px 12px', fontSize: '13px' }} 
                              onClick={() => handleEdit(event)}
                              title={t('common.edit')}
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                              onClick={() => handleDelete(event)}
                              title={t('common.delete')}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <>
            <h3 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              📋 Past Events
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>{t('events.eventTitle')}</th>
                    <th>{t('events.user')}</th>
                    <th>{t('events.eventDate')}</th>
                    <th>{t('events.location')}</th>
                    <th>{t('users.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pastEvents
                    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
                    .slice(0, 10) // Show only last 10 past events
                    .map((event) => (
                      <tr key={event.id} style={{ opacity: 0.7 }}>
                        <td>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}>
                            {getEventTypeLabel(event.event_type)}
                          </span>
                        </td>
                        <td>{event.title}</td>
                        <td>{event.user_name}</td>
                        <td>{formatDateTime(event.event_date)}</td>
                        <td>{event.location || '-'}</td>
                        <td>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => handleDelete(event)}
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
          </>
        )}

        {filteredEvents.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📅</div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>No events found</div>
            <div style={{ fontSize: '14px' }}>Create your first event to get started!</div>
          </div>
        )}
      </div>

      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingEvent ? `✏️ ${t('events.editEvent')}` : `➕ ${t('events.addEvent')}`}
              </h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* User Selection */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('events.user')} *</label>
                  <select
                    className="form-select"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                  >
                    <option value="">{t('common.select')} user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Type */}
                <div className="form-group">
                  <label className="form-label">{t('events.eventType')} *</label>
                  <select
                    className="form-select"
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    required
                  >
                    <option value="meeting">{getEventTypeLabel('meeting')}</option>
                    <option value="embassy">{getEventTypeLabel('embassy')}</option>
                    <option value="flight">{getEventTypeLabel('flight')}</option>
                    <option value="birthday">{getEventTypeLabel('birthday')}</option>
                    <option value="custom">{getEventTypeLabel('custom')}</option>
                  </select>
                </div>

                {/* Event Date */}
                <div className="form-group">
                  <label className="form-label">{t('events.eventDate')} *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>

                {/* Title */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('events.eventTitle')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Project Review Meeting"
                    required
                  />
                </div>

                {/* Location */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('events.location')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Office Building, Room 301"
                  />
                </div>

                {/* Description */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('events.description')}</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details about the event..."
                    rows="3"
                  />
                </div>

                {/* Reminder Enabled */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.reminder_enabled}
                      onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                      style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span className="form-label" style={{ marginBottom: 0 }}>
                      {t('events.reminderEnabled')}
                    </span>
                  </label>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px', marginLeft: '28px' }}>
                    Enable this to allow creating reminders for this event
                  </div>
                </div>
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
                  {editingEvent ? '💾 Update Event' : '➕ Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;
