import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
    const { user, login, logout } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Accordion state
    const [accordionSections, setAccordionSections] = useState({
        profilePicture: true,
        accountInfo: true,
        security: false,
        preferences: false,
        dangerZone: false
    });

    // Form states
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        theme: 'light'
    });

    // Profile picture state
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Toggle accordion sections
    const toggleSection = (section) => {
        setAccordionSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Handle profile picture upload first if there is one
            if (profilePicture) {
                const pictureFormData = new FormData();
                pictureFormData.append('profilePicture', profilePicture);
                await api.post('/user/profile/picture', pictureFormData);
            }

            // Handle profile data update
            const updateData = {
                username: formData.username,
                email: formData.email,
                theme: formData.theme
            };

            // Only include password fields if they're being updated
            if (formData.currentPassword && formData.newPassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            const response = await api.put('/user/profile/update', updateData);
            
            login(response.data.user, response.data.token);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
            
            // Reset password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            console.error('Update Error:', error);
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.msg || 'Error updating profile'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                await api.delete('/user/profile/delete');
                logout();
            } catch (error) {
                setMessage({ 
                    type: 'error', 
                    text: 'Error deleting account'
                });
            }
        }
    };

    return (
        <main className="profile-container">
          <h1>Profile Settings</h1>
          {message.text && (
            <div className={`message ${message.type}`} role="alert">
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="profile-form">
            {/* Profile Picture Section */}
            <section className="profile-section">
              <button
                type="button"
                id="profilePicture-header"
                onClick={() => toggleSection('profilePicture')}
                aria-expanded={accordionSections.profilePicture}
                aria-controls="profilePicture-content"
                className="accordion-toggle"
              >
                Profile Picture
              </button>
              {accordionSections.profilePicture && (
                <div id="profilePicture-content" role="region" aria-labelledby="profilePicture-header">
                  <div className="profile-picture-container">
                    <img
                      src={previewUrl || user?.profilePicture || '/default-avatar.png'}
                      alt="User Profile"
                      className="profile-picture"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      id="profile-picture-input"
                      className="hidden"
                      aria-label="Upload new profile picture"
                    />
                    <label htmlFor="profile-picture-input" className="upload-button">
                      Change Picture
                    </label>
                  </div>
                </div>
              )}
            </section>
    
            {/* Account Information Section */}
            <section className="profile-section">
              <button
                type="button"
                id="accountInfo-header"
                onClick={() => toggleSection('accountInfo')}
                aria-expanded={accordionSections.accountInfo}
                aria-controls="accountInfo-content"
                className="accordion-toggle"
              >
                Account Information
              </button>
              {accordionSections.accountInfo && (
                <div id="accountInfo-content" role="region" aria-labelledby="accountInfo-header">
                  <div className="form-group">
                    <label htmlFor="username-input">Username</label>
                    <input
                      id="username-input"
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      aria-label="Username"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email-input">Email</label>
                    <input
                      id="email-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      aria-label="Email address"
                    />
                  </div>
                </div>
              )}
            </section>
    
            {/* Security Section */}
            <section className="profile-section">
              <button
                type="button"
                id="security-header"
                onClick={() => toggleSection('security')}
                aria-expanded={accordionSections.security}
                aria-controls="security-content"
                className="accordion-toggle"
              >
                Security
              </button>
              {accordionSections.security && (
                <div id="security-content" role="region" aria-labelledby="security-header">
                  {isEditing ? (
                    <>
                      <div className="form-group">
                        <label htmlFor="currentPassword-input">Current Password</label>
                        <input
                          id="currentPassword-input"
                          type="password"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          aria-label="Current Password"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="newPassword-input">New Password</label>
                        <input
                          id="newPassword-input"
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          aria-label="New Password"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmPassword-input">Confirm New Password</label>
                        <input
                          id="confirmPassword-input"
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          aria-label="Confirm New Password"
                        />
                      </div>
                    </>
                  ) : (
                    <p className="info-text">Enable edit mode to change your password.</p>
                  )}
                </div>
              )}
            </section>
    
            {/* Preferences Section */}
            <section className="profile-section">
              <button
                type="button"
                id="preferences-header"
                onClick={() => toggleSection('preferences')}
                aria-expanded={accordionSections.preferences}
                aria-controls="preferences-content"
                className="accordion-toggle"
              >
                Preferences
              </button>
              {accordionSections.preferences && (
                <div id="preferences-content" role="region" aria-labelledby="preferences-header">
                  <div className="form-group">
                    <label htmlFor="theme-select">Theme</label>
                    <select
                      id="theme-select"
                      name="theme"
                      value={formData.theme}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      aria-label="Theme preference"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                </div>
              )}
            </section>
    
            {/* Action Buttons */}
            <div className="profile-actions">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="edit-button"
                  aria-label="Edit profile"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="save-button"
                    aria-label="Save changes"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Optionally collapse security and preferences sections when canceling edit
                      setAccordionSections(prev => ({ ...prev, security: false, preferences: false }));
                    }}
                    className="cancel-button"
                    aria-label="Cancel editing"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
    
            {/* Danger Zone Section */}
            <section className="profile-section">
              <button
                type="button"
                id="dangerZone-header"
                onClick={() => toggleSection('dangerZone')}
                aria-expanded={accordionSections.dangerZone}
                aria-controls="dangerZone-content"
                className="accordion-toggle danger"
              >
                Danger Zone
              </button>
              {accordionSections.dangerZone && (
                <div id="dangerZone-content" role="region" aria-labelledby="dangerZone-header">
                  <p className="warning-text">Deleting your account is irreversible.</p>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="delete-button"
                    aria-label="Delete account"
                  >
                    Delete Account
                  </button>
                </div>
              )}
            </section>
          </form>
        </main>
      );
    }