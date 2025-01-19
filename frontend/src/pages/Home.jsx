import { useEffect, useState } from "react";
import api from '../services/api';
import AdBanner from '../components/AdBanner';
import './Home.css';
import Carousel from "../components/Carousel";

export default function Home() {
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        api.get('./movies?limit=5')
            .then((res) => {
                if (res.data && res.data.data) {
                    setMovies(res.data.data);
                }
            })
            .catch((err) => console.error('Home fetch error:', err));
    }, []);


    return (
        <div className="home-container">
            <h2 className="home-title">Trending Movies</h2>
            <Carousel movies={movies} />
            
            <AdBanner />

            <section className="home-section">
                <h3>Welcome to CineMatch</h3>
                <p>
                    Swipe through personalized recommendations, track your watched list,
                    and find your next favorite movie!
                </p>
            </section>
        </div>
    );
}