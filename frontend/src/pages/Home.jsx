import "./Home.css"
import { useState, useEffect } from "react";
import Carousel from "../components/Carousel";
import api from "../services/api";
import AdBanner from "../components/AdBanner"
import Hero from "../components/Hero";

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
        <div className="home-container">
            <Hero />
            <h2 className="home-title">Trending Movies</h2>
            {movies.length > 0 ? (
                <Carousel movies={movies} />
            ) : (
                <p>Loading movies...</p>
            )}
        </div>
    );
}