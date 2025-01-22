import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import './GenreSelection.css';

export default function GenreSelection() {
    const [genres, setGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const { user } = useContext(AuthContext);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get('/genres')
            .then((res) => {
                if (res.data && res.data.data) {
                    setGenres(res.data.data);
                }
            })
            .catch((err) => {
                console.error('Error fetching genres:', err);
                setErrorMsg('Failed to load genres. Please try again later.');
            });
    }, []);

    const toggleGenreSelection = (genreId) => {
        setSelectedGenres((prev) => {
            if (prev.includes(genreId)) {
                return prev.filter((id) => id !== genreId);
            } else {
                return [...prev, genreId];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (selectedGenres.length < 5 || selectedGenres.length > 10) {
            setErrorMsg('Please select between 5 and 10 genres.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/user/genres', { genreIds: selectedGenres });
            alert('Genres saved successfully!');
            // Redirect or update UI as needed
        } catch (err) {
            console.error('Error saving genres:', err);
            setErrorMsg(err.response?.data?.msg || 'Failed to save genres.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="genre-selection-container">
            <h2>Select Your Favorite Genres</h2>
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
            <div className="genres-grid">
                {genres.map((genre) => (
                    <div 
                        key={genre._id}
                        className={`genre-card ${selectedGenres.includes(genre._id) ? 'selected' : ''}`}
                        onClick={() => toggleGenreSelection(genre._id)}
                    >
                        {genre.name}
                    </div>
                ))}
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="submit-btn">
                {submitting ? 'Submitting...' : 'Save Selection'}
            </button>
        </div>
    );
}