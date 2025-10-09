import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FiPlus, 
  FiEdit2, 
  FiX, 
  FiSave, 
  FiFilter, 
  FiFileText, 
  FiGlobe, 
  FiType,
  FiEye
} from 'react-icons/fi';

function Templates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    event_type: 'meeting',
    language: 'en',
    template_text: '',
    is_default: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await window.api.db.getMessageTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      alert('Failed to load templates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }
    if (!formData.template_text.trim()) {
      alert('Please enter template text');
      return;
    }

    try {
      // Extract variables from template text
      const variableMatches = formData.template_text.match(/\{\{(\w+)\}\}/g);
      const variables = variableMatches 
        ? [...new Set(variableMatches.map(v => v.replace(/[{}]/g, '')))]
        : [];
      
      const templateData = {
        ...formData,
        variables: variables
      };
      
      await window.api.db.saveMessageTemplate(templateData);
      setShowModal(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template: ' + error.message);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      id: template.id,
      name: template.name,
      event_type: template.event_type,
      language: template.language,
      template_text: template.template_text,
      is_default: template.is_default
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      event_type: 'meeting',
      language: 'en',
      template_text: '',
      is_default: false
    });
  };

  const getFilteredTemplates = () => {
    let filtered = [...templates];
    
    if (filterLanguage) {
      filtered = filtered.filter(t => t.language === filterLanguage);
    }
    
    if (filterEventType) {
      filtered = filtered.filter(t => t.event_type === filterEventType);
    }
    
    return filtered;
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-text');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.template_text;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newText = before + `{{${variable}}}` + after;
    
    setFormData({ ...formData, template_text: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
    }, 0);
  };

  const previewTemplate = () => {
    const preview = formData.template_text
      .replace(/\{\{name\}\}/g, 'John Doe')
      .replace(/\{\{title\}\}/g, 'Project Meeting')
      .replace(/\{\{date\}\}/g, 'Dec 15, 2025 at 2:00 PM')
      .replace(/\{\{location\}\}/g, 'Office Building, Room 301');
    
    return preview;
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

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const filteredTemplates = getFilteredTemplates();

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('templates.title')}</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <FiPlus style={{ marginRight: '5px' }} />
            {t('templates.addTemplate')}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">
              <FiGlobe style={{ marginRight: '5px' }} />
              {t('common.filter')} by {t('templates.language')}
            </label>
            <select
              className="form-select"
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
            >
              <option value="">{t('templates.allLanguages')}</option>
              <option value="en">{t('templates.languages.en')}</option>
              <option value="ar">{t('templates.languages.ar')}</option>
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label">
              <FiType style={{ marginRight: '5px' }} />
              {t('common.filter')} by {t('events.eventType')}
            </label>
            <select
              className="form-select"
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
            >
              <option value="">{t('templates.allTypes')}</option>
              <option value="meeting">{getEventTypeLabel('meeting')}</option>
              <option value="embassy">{getEventTypeLabel('embassy')}</option>
              <option value="flight">{getEventTypeLabel('flight')}</option>
              <option value="birthday">{getEventTypeLabel('birthday')}</option>
              <option value="custom">{getEventTypeLabel('custom')}</option>
            </select>
          </div>

          {(filterLanguage || filterEventType) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => { setFilterLanguage(''); setFilterEventType(''); }}
              >
                <FiX style={{ marginRight: '5px' }} />
                {t('templates.clearFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px' 
          }}>
            {filteredTemplates.map((template) => (
              <div 
                key={template.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'var(--bg-tertiary)',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                      {template.name}
                    </h3>
                    {template.is_default && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        fontWeight: '500'
                      }}>
                        {t('templates.defaultBadge')}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: getEventTypeColor(template.event_type) + '20',
                      color: getEventTypeColor(template.event_type)
                    }}>
                      {getEventTypeLabel(template.event_type)}
                    </span>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: 'var(--accent)' + '20',
                      color: 'var(--accent)'
                    }}>
                      <FiGlobe style={{ marginRight: '4px', fontSize: '10px' }} />
                      {template.language === 'ar' ? t('templates.languages.ar') : t('templates.languages.en')}
                    </span>
                  </div>
                </div>

                {/* Template Text */}
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  minHeight: '80px',
                  maxHeight: '120px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {template.template_text}
                </div>

                {/* Variables */}
                {template.variables && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      {t('templates.variables')}:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {(typeof template.variables === 'string' 
                        ? JSON.parse(template.variables) 
                        : template.variables
                      ).map((variable, idx) => (
                        <span 
                          key={idx}
                          style={{
                            padding: '2px 6px',
                            backgroundColor: 'var(--bg-primary)',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: 'var(--accent)'
                          }}
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '8px', fontSize: '13px' }}
                    onClick={() => handleEdit(template)}
                  >
                    <FiEdit2 style={{ marginRight: '5px' }} />
                    {t('common.edit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>
              <FiFileText style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>{t('templates.noTemplatesFound')}</div>
            <div style={{ fontSize: '14px' }}>{t('templates.createFirstTemplate')}</div>
          </div>
        )}
      </div>

      {/* Add/Edit Template Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTemplate ? (
                  <>
                    <FiEdit2 style={{ marginRight: '8px' }} />
                    {t('templates.editTemplate')}
                  </>
                ) : (
                  <>
                    <FiPlus style={{ marginRight: '8px' }} />
                    {t('templates.addTemplate')}
                  </>
                )}
              </h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* Template Name */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('templates.templateName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Professional Meeting Reminder"
                    required
                  />
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

                {/* Language */}
                <div className="form-group">
                  <label className="form-label">{t('templates.language')} *</label>
                  <select
                    className="form-select"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    required
                  >
                    <option value="en">{t('templates.languages.en')}</option>
                    <option value="ar">{t('templates.languages.ar')}</option>
                  </select>
                </div>

                {/* Template Text */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{t('templates.templateText')} *</label>
                  <textarea
                    id="template-text"
                    className="form-textarea"
                    value={formData.template_text}
                    onChange={(e) => setFormData({ ...formData, template_text: e.target.value })}
                    placeholder="Enter your message template here..."
                    rows="6"
                    required
                  />
                  
                  {/* Variable Buttons */}
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {t('templates.availableVariables')}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['name', 'title', 'date', 'location'].map(variable => (
                        <button
                          key={variable}
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => insertVariable(variable)}
                        >
                          <FiPlus style={{ marginRight: '4px', fontSize: '10px' }} />
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    <FiEye style={{ marginRight: '5px' }} />
                    {t('templates.preview')}
                  </label>
                  <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '15px',
                    borderRadius: '8px',
                    minHeight: '80px',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--border-color)'
                  }}>
                    {previewTemplate() || t('templates.previewPlaceholder')}
                  </div>
                </div>

                {/* Is Default */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span className="form-label" style={{ marginBottom: 0 }}>
                      {t('templates.isDefault')}
                    </span>
                  </label>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '5px', marginLeft: '28px' }}>
                    {t('templates.isDefaultHelp')}
                  </div>
                </div>
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
                  {editingTemplate ? (
                    <>
                      <FiSave style={{ marginRight: '5px' }} />
                      {t('templates.updateTemplate')}
                    </>
                  ) : (
                    <>
                      <FiPlus style={{ marginRight: '5px' }} />
                      {t('templates.createTemplate')}
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

export default Templates;
