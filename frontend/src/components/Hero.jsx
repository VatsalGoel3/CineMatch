import "./Hero.css"
import { Link } from "react-router-dom";

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero-overlay">
                <div className="hero-content">
                    <h1 className="hero-title">
                        <span className="cine">Cine</span>
                        <span className="match">Match</span>
                    </h1>
                    <h2 className="hero-subtitle">Movie Recommendations</h2>
                    <p className="hero-tagline">
                        Discover movies tailored to your taste and plan your perfect movie night!
                    </p>
                    <div className="hero-buttons">
                        <Link to="/login" className="hero-btn login">Login</Link>
                        <Link to="/register" className="hero-btn register">Register</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}