import React, { useState, useEffect } from 'react';
import './UpdateNotification.css';

const UpdateNotification = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.api?.updater) return;

    // Listen for update available
    window.api.updater.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setDismissed(false);
      console.log('Update available:', info);
    });

    // Listen for download progress
    window.api.updater.onDownloadProgress((progress) => {
      setDownloadProgress(progress);
    });

    // Listen for update downloaded
    window.api.updater.onUpdateDownloaded((info) => {
      setUpdateReady(true);
      setDownloadProgress(null);
      console.log('Update downloaded:', info);
    });

    // Listen for errors
    window.api.updater.onUpdateError((error) => {
      setError(error);
      console.error('Update error:', error);
    });

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const handleInstallUpdate = () => {
    if (window.api?.updater) {
      window.api.updater.installUpdate();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const handleCheckForUpdates = () => {
    if (window.api?.updater) {
      setError(null);
      setDismissed(false);
      window.api.updater.checkForUpdates();
    }
  };

  if (dismissed) return null;

  if (error) {
    return (
      <div className="update-notification update-error">
        <div className="update-content">
          <div className="update-icon">⚠️</div>
          <div className="update-text">
            <div className="update-title">Update Error</div>
            <div className="update-message">{error}</div>
          </div>
          <button className="update-btn update-btn-dismiss" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (updateReady) {
    return (
      <div className="update-notification update-ready">
        <div className="update-content">
          <div className="update-icon">✅</div>
          <div className="update-text">
            <div className="update-title">Update Ready to Install</div>
            <div className="update-message">
              A new version has been downloaded. Restart to apply the update.
            </div>
          </div>
          <div className="update-actions">
            <button className="update-btn update-btn-install" onClick={handleInstallUpdate}>
              Restart Now
            </button>
            <button className="update-btn update-btn-dismiss" onClick={handleDismiss}>
              Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (downloadProgress) {
    return (
      <div className="update-notification update-downloading">
        <div className="update-content">
          <div className="update-icon">⬇️</div>
          <div className="update-text">
            <div className="update-title">Downloading Update</div>
            <div className="update-message">
              {Math.round(downloadProgress.percent)}% complete
            </div>
            <div className="update-progress-bar">
              <div 
                className="update-progress-fill" 
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (updateInfo) {
    return (
      <div className="update-notification update-available">
        <div className="update-content">
          <div className="update-icon">🔔</div>
          <div className="update-text">
            <div className="update-title">Update Available</div>
            <div className="update-message">
              Version {updateInfo.version} is available. Downloading in the background...
            </div>
          </div>
          <button className="update-btn update-btn-dismiss" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default UpdateNotification;
