import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
    const { user, login, logout } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form states
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        language: 'en',
        showMatureContent: false
    });

    // Profile picture state
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        // Load user preferences
        const fetchPreferences = async () => {
            try {
                const response = await api.get('/user/preferences');
                setFormData(prev => ({
                    ...prev,
                    language: response.data.language || 'en',
                    showMatureContent: response.data.showMatureContent || false
                }));
            } catch (error) {
                console.error('Error fetching preferences:', error);
            }
        };

        fetchPreferences();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
            // Handle profile picture upload if changed
            if (profilePicture) {
                const formData = new FormData();
                formData.append('profilePicture', profilePicture);
                await api.post('/user/profile-picture', formData);
            }

            // Update user information
            const response = await api.put('/user/profile', formData);
            
            login(response.data.user, response.data.token);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error) {
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
                await api.delete('/user/account');
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
        <div className="profile-container">
            <h1>Profile Settings</h1>
            
            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
                <div className="profile-section">
                    <h2>Profile Picture</h2>
                    <div className="profile-picture-container">
                        <img 
                            src={previewUrl || user?.profilePicture || '/default-avatar.png'} 
                            alt="Profile" 
                            className="profile-picture"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            id="profile-picture-input"
                            className="hidden"
                        />
                        <label htmlFor="profile-picture-input" className="upload-button">
                            Change Picture
                        </label>
                    </div>
                </div>

                <div className="profile-section">
                    <h2>Account Information</h2>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                        />
                    </div>

                    {isEditing && (
                        <>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="profile-section">
                    <h2>Preferences</h2>
                    <div className="form-group">
                        <label>Language</label>
                        <select
                            name="language"
                            value={formData.language}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                        </select>
                    </div>

                    <div className="form-group checkbox">
                        <label>
                            <input
                                type="checkbox"
                                name="showMatureContent"
                                checked={formData.showMatureContent}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                            />
                            Show Mature Content
                        </label>
                    </div>
                </div>

                <div className="profile-actions">
                    {!isEditing ? (
                        <button 
                            type="button" 
                            onClick={() => setIsEditing(true)}
                            className="edit-button"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="save-button"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsEditing(false)}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>

                <div className="danger-zone">
                    <h2>Danger Zone</h2>
                    <button 
                        type="button" 
                        onClick={handleDeleteAccount}
                        className="delete-button"
                    >
                        Delete Account
                    </button>
                </div>
            </form>
        </div>
    );
} 