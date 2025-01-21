import { useState, useEffect } from "react";
import Carousel from "../components/Carousel";
import api from "../services/api";
import AdBanner from "../components/AdBanner"

export default function Home() {
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        // Fetch trending movies from backend
        api.get('/movies/trending')
            .then((res) => {
                if (res.data && res.data.data) {
                    setMovies(res.data.data);
                }
            })
            .catch((err) => console.error('Home fetch error:', err));
    }, []);

    return (
        <div className="home-caontainer">
            <h2 className="home-title">Trending Movies</h2>
            {movies.length > 0 ? (
                <Carousel movies={movies} />
            ) : (
                <p>Loading movies...</p>
            )}

            <AdBanner />

            <section className="home-section">
                <h3>Welcome to Cinematch</h3>
                <p>
                    Swipe through personalized recommendations, track your watched list,
                    and find your next favorite movie!
                </p>
            </section>
        </div>
    );
}