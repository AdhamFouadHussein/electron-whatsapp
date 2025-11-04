import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Campaigns.css';
import { formatLocal } from '../utils/datetime';

const Campaigns = () => {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    message_text: '',
    min_delay_sec: 5,
    max_delay_sec: 15
  });
  const [activeCampaignStatus, setActiveCampaignStatus] = useState(null);

  useEffect(() => {
    loadCampaigns();
    // Poll for active campaign status every 2 seconds
    const interval = setInterval(checkActiveCampaignStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await window.api.campaign.getAll();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      alert(`Failed to load campaigns: ${error.message}`);
    }
  };

  const checkActiveCampaignStatus = async () => {
    try {
      const status = await window.api.campaign.getStatus();
      setActiveCampaignStatus(status);
      
      // Refresh campaigns if one is running
      if (status.isRunning) {
        loadCampaigns();
      }
    } catch (error) {
      console.error('Error checking campaign status:', error);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert(t('campaigns.csvSelectFile'));
      return;
    }

    setCsvFile(file);

    // Read and preview CSV
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvContent = event.target.result;
        const result = await window.api.campaign.parseCSV(csvContent);
        
        setCsvPreview(result);
        
        if (result.warnings && result.warnings.length > 0) {
          alert(`${t('campaigns.csvPreview')}:\n${result.warnings.slice(0, 5).join('\n')}\n${result.warnings.length > 5 ? '...' : ''}`);
        }
      } catch (error) {
        alert(`${t('campaigns.errors.parseCSV')}: ${error.message}`);
        setCsvFile(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!csvPreview || !csvPreview.recipients || csvPreview.recipients.length === 0) {
      alert(t('campaigns.csvHelp'));
      return;
    }

    try {
      // Create campaign
      const campaign = await window.api.campaign.create({
        name: formData.name,
        message_text: formData.message_text,
        min_delay_sec: parseInt(formData.min_delay_sec),
        max_delay_sec: parseInt(formData.max_delay_sec),
        total_recipients: csvPreview.recipients.length
      });

      // Add recipients
      await window.api.campaign.addRecipients({
        campaignId: campaign.id,
        recipients: csvPreview.recipients
      });

      alert(t('campaigns.campaignCreated'));
      setShowForm(false);
      resetForm();
      loadCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(`${t('campaigns.errors.createCampaign')}: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      message_text: '',
      min_delay_sec: 5,
      max_delay_sec: 15
    });
    setCsvFile(null);
    setCsvPreview(null);
  };

  const startCampaign = async (campaignId) => {
    if (activeCampaignStatus && activeCampaignStatus.isRunning) {
      alert(t('campaigns.anotherRunning'));
      return;
    }

    if (!confirm(t('campaigns.confirmStart'))) {
      return;
    }

    try {
      await window.api.campaign.start(campaignId);
      alert(t('campaigns.campaignStarted'));
      loadCampaigns();
    } catch (error) {
      console.error('Error starting campaign:', error);
      alert(`${t('campaigns.errors.startCampaign')}: ${error.message}`);
    }
  };

  const pauseCampaign = async (campaignId) => {
    if (!confirm(t('campaigns.confirmPause'))) {
      return;
    }

    try {
      await window.api.campaign.pause(campaignId);
      alert(t('campaigns.campaignPaused'));
      loadCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      alert(`${t('campaigns.errors.pauseCampaign')}: ${error.message}`);
    }
  };

  const resumeCampaign = async (campaignId) => {
    if (!confirm(t('campaigns.confirmResume'))) {
      return;
    }

    try {
      await window.api.campaign.resume(campaignId);
      alert(t('campaigns.campaignResumed'));
      loadCampaigns();
    } catch (error) {
      console.error('Error resuming campaign:', error);
      alert(`${t('campaigns.errors.resumeCampaign')}: ${error.message}`);
    }
  };

  const viewRecipients = async (campaign) => {
    try {
      const data = await window.api.campaign.getRecipients(campaign.id);
      setRecipients(data);
      setSelectedCampaign(campaign);
    } catch (error) {
      console.error('Error loading recipients:', error);
      alert(`${t('campaigns.errors.loadRecipients')}: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: t('campaigns.statuses.draft'), className: 'badge-draft' },
      running: { label: t('campaigns.statuses.running'), className: 'badge-running' },
      paused: { label: t('campaigns.statuses.paused'), className: 'badge-paused' },
      completed: { label: t('campaigns.statuses.completed'), className: 'badge-completed' },
      cancelled: { label: t('campaigns.statuses.cancelled'), className: 'badge-cancelled' }
    };
    const badge = badges[status] || badges.draft;
    return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
  };

  const getProgress = (campaign) => {
    if (campaign.total_recipients === 0) return 0;
    return Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100);
  };

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h1>{t('campaigns.title')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('campaigns.cancel') : t('campaigns.newCampaign')}
        </button>
      </div>

      {activeCampaignStatus && activeCampaignStatus.isRunning && (
        <div className="active-campaign-alert">
          <strong>⚡ {t('campaigns.campaignRunningAlert')}</strong> {t('campaigns.campaignRunningText', { id: activeCampaignStatus.campaignId })}
        </div>
      )}

      {showForm && (
        <div className="campaign-form-card">
          <h2>{t('campaigns.createCampaign')}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('campaigns.campaignName')} *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('campaigns.campaignNamePlaceholder')}
              />
            </div>

            <div className="form-group">
              <label>{t('campaigns.messageText')} *</label>
              <textarea
                required
                rows="5"
                value={formData.message_text}
                onChange={(e) => setFormData({ ...formData, message_text: e.target.value })}
                placeholder={t('campaigns.messageTextPlaceholder')}
              />
              <small>{t('campaigns.personalizeTip')}</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('campaigns.minDelay')} *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="300"
                  value={formData.min_delay_sec}
                  onChange={(e) => setFormData({ ...formData, min_delay_sec: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('campaigns.maxDelay')} *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="300"
                  value={formData.max_delay_sec}
                  onChange={(e) => setFormData({ ...formData, max_delay_sec: e.target.value })}
                />
              </div>
            </div>
            <small>{t('campaigns.delayHelp')}</small>

            <div className="form-group">
              <label>{t('campaigns.recipientsCsv')} *</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                required
              />
              <small>{t('campaigns.csvHelp')}</small>
            </div>

            {csvPreview && (
              <div className="csv-preview">
                <h3>{t('campaigns.csvPreview')}</h3>
                <p><strong>{csvPreview.recipients.length}</strong> {t('campaigns.recipientsFound')}</p>
                <div className="preview-list">
                  {csvPreview.recipients.slice(0, 5).map((r, i) => (
                    <div key={i} className="preview-item">
                      <span className="phone">{r.phone}</span>
                      {r.name && <span className="name">({r.name})</span>}
                    </div>
                  ))}
                  {csvPreview.recipients.length > 5 && (
                    <div className="preview-more">{t('campaigns.andMore', { count: csvPreview.recipients.length - 5 })}</div>
                  )}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                {t('campaigns.cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('campaigns.createCampaign')}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="campaigns-list">
            {campaigns.length === 0 ? (
              <div className="empty-state">
                <p>{t('campaigns.noCampaigns')}</p>
              </div>
            ) : (
              campaigns.map(campaign => (
                <div key={campaign.id} className="campaign-card">
                  <div className="campaign-header">
                    <div>
                      <h3>{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="campaign-actions">
                      {campaign.status === 'draft' && (
                        <button className="btn btn-sm btn-success" onClick={() => startCampaign(campaign.id)}>
                          {t('campaigns.start')}
                        </button>
                      )}
                      {campaign.status === 'running' && (
                        <button className="btn btn-sm btn-warning" onClick={() => pauseCampaign(campaign.id)}>
                          {t('campaigns.pause')}
                        </button>
                      )}
                      {campaign.status === 'paused' && (
                        <button className="btn btn-sm btn-success" onClick={() => resumeCampaign(campaign.id)}>
                          {t('campaigns.resume')}
                        </button>
                      )}
                      <button className="btn btn-sm btn-secondary" onClick={() => viewRecipients(campaign)}>
                        {t('campaigns.viewRecipients')}
                      </button>
                    </div>
                  </div>

                  <div className="campaign-stats">
                    <div className="stat">
                      <span className="stat-label">{t('campaigns.total')}</span>
                      <span className="stat-value">{campaign.total_recipients}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">{t('campaigns.sent')}</span>
                      <span className="stat-value success">{campaign.sent_count}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">{t('campaigns.failed')}</span>
                      <span className="stat-value error">{campaign.failed_count}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">{t('campaigns.pending')}</span>
                      <span className="stat-value">{campaign.total_recipients - campaign.sent_count - campaign.failed_count}</span>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${getProgress(campaign)}%` }}></div>
                  </div>
                  <div className="progress-text">{getProgress(campaign)}% {t('campaigns.complete')}</div>

                  <div className="campaign-meta">
                    <div><strong>{t('campaigns.delay')}:</strong> {campaign.min_delay_sec}-{campaign.max_delay_sec} {t('common.seconds')}</div>
                    <div><strong>{t('campaigns.created')}:</strong> {formatLocal(campaign.created_at_epoch_ms)}</div>
                    {campaign.started_at_epoch_ms && (
                      <div><strong>{t('campaigns.started')}:</strong> {formatLocal(campaign.started_at_epoch_ms)}</div>
                    )}
                  </div>

                  <div className="campaign-message">
                    <strong>{t('campaigns.message')}:</strong>
                    <p>{campaign.message_text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedCampaign && (
            <div className="recipients-modal" onClick={() => setSelectedCampaign(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{t('campaigns.recipientsFor', { name: selectedCampaign.name })}</h2>
                  <button className="close-btn" onClick={() => setSelectedCampaign(null)}>×</button>
                </div>
                <div className="modal-body">
                  <table className="recipients-table">
                    <thead>
                      <tr>
                        <th>{t('campaigns.phone')}</th>
                        <th>{t('campaigns.name')}</th>
                        <th>{t('campaigns.status')}</th>
                        <th>{t('campaigns.sentAt')}</th>
                        <th>{t('campaigns.error')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map(recipient => (
                        <tr key={recipient.id}>
                          <td>{recipient.phone}</td>
                          <td>{recipient.name || '-'}</td>
                          <td>
                            <span className={`status-badge badge-${recipient.status}`}>
                              {t(`campaigns.statuses.${recipient.status}`)}
                            </span>
                          </td>
                          <td>{recipient.sent_at_epoch_ms ? formatLocal(recipient.sent_at_epoch_ms) : '-'}</td>
                          <td className="error-cell">{recipient.error_message || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Campaigns;
