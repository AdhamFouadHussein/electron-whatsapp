import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    preferred_language: 'en',
    notes: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await window.api.db.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await window.api.db.updateUser(editingUser.id, formData);
      } else {
        await window.api.db.createUser(formData);
      }
      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user: ' + error.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      date_of_birth: user.date_of_birth || '',
      preferred_language: user.preferred_language || 'en',
      notes: user.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (confirm(t('users.confirmDelete'))) {
      try {
        await window.api.db.deleteUser(user.id);
        loadUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      date_of_birth: '',
      preferred_language: 'en',
      notes: ''
    });
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('users.title')}</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus style={{ marginRight: '5px' }} /> {t('users.addUser')}
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>{t('users.name')}</th>
              <th>{t('users.phone')}</th>
              <th>{t('users.email')}</th>
              <th>{t('users.dateOfBirth')}</th>
              <th>{t('users.preferredLanguage')}</th>
              <th>{t('users.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.phone}</td>
                <td>{user.email}</td>
                <td>{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : '-'}</td>
                <td>{user.preferred_language}</td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '5px' }} onClick={() => handleEdit(user)}>
                    <FiEdit2 style={{ marginRight: '5px' }} /> {t('common.edit')}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(user)}>
                    <FiTrash2 style={{ marginRight: '5px' }} /> {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUser ? t('users.editUser') : t('users.addUser')}
              </h3>
              <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('users.name')} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('users.phone')} *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('users.email')}</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('users.dateOfBirth')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('users.preferredLanguage')}</label>
                <select
                  className="form-select"
                  value={formData.preferred_language}
                  onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('users.notes')}</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
