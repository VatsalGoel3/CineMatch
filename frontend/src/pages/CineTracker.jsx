import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import './CineTracker.css';

export default function CineTracker() {
    const { user } = useContext(AuthContext);
    const [collections, setCollections] = useState({
        liked: [],
        watched: [],
        notInterested: []
    });
    const [stats, setStats] = useState({
        totalRated: 0,
        averageRating: 0,
        topGenres: [],
        totalSwipes: 0
    });
    const [activeTab, setActiveTab] = useState('liked');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserCollections();
        fetchUserStats();
    }, [user]);

    const fetchUserCollections = async () => {
        try {
            const response = await api.get('/user/collections');
            setCollections(response.data);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching collections:', err);
        }
    };

    const fetchUserStats = async () => {
        try {
            const response = await api.get('/user/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const handleRemoveMovie = async (movieId, collection) => {
        try {
            await api.delete(`/user/collections/${collection}/${movieId}`);
            fetchUserCollections(); // Refresh collections
        } catch (err) {
            console.error('Error removing movie:', err);
        }
    };

    const handleUpdateRating = async (movieId, newRating) => {
        try {
            await api.put(`/user/collections/watched/${movieId}`, { rating: newRating });
            fetchUserCollections(); // Refresh collections
        } catch (err) {
            console.error('Error updating rating:', err);
        }
    };

    return (
        <div className="cinetracker-container">
            <h1 className="cinetracker-title">CineTracker</h1>
            
            {/* Stats Section */}
            <section className="stats-section">
                <h2>Your Movie Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <i className="fas fa-film"></i>
                        <h3>Total Rated</h3>
                        <p>{stats.totalRated}</p>
                    </div>
                    <div className="stat-card">
                        <i className="fas fa-star"></i>
                        <h3>Average Rating</h3>
                        <p>{stats.averageRating.toFixed(1)}</p>
                    </div>
                    <div className="stat-card">
                        <i className="fas fa-swipe"></i>
                        <h3>Total Swipes</h3>
                        <p>{stats.totalSwipes}</p>
                    </div>
                </div>
            </section>

            {/* Collections Tabs */}
            <div className="collections-tabs">
                <button 
                    className={`tab ${activeTab === 'liked' ? 'active' : ''}`}
                    onClick={() => setActiveTab('liked')}
                >
                    Liked Movies
                </button>
                <button 
                    className={`tab ${activeTab === 'watched' ? 'active' : ''}`}
                    onClick={() => setActiveTab('watched')}
                >
                    Watched Movies
                </button>
                <button 
                    className={`tab ${activeTab === 'notInterested' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notInterested')}
                >
                    Not Interested
                </button>
            </div>

            {/* Movies Grid */}
            {isLoading ? (
                <div className="loading-spinner">Loading...</div>
            ) : (
                <div className="movies-grid">
                    {collections[activeTab].map((movie) => (
                        <div key={movie.id} className="movie-card">
                            <img 
                                src={movie.poster} 
                                alt={movie.title} 
                                className="movie-poster"
                            />
                            <div className="movie-card-overlay">
                                <h3>{movie.title}</h3>
                                {activeTab === 'watched' && (
                                    <div className="rating-stars">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <i
                                                key={star}
                                                className={`fas fa-star ${
                                                    star <= movie.rating ? 'filled' : ''
                                                }`}
                                                onClick={() => handleUpdateRating(movie.id, star)}
                                            ></i>
                                        ))}
                                    </div>
                                )}
                                <button 
                                    className="remove-btn"
                                    onClick={() => handleRemoveMovie(movie.id, activeTab)}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 