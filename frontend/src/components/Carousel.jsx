import { useEffect, useState } from 'react';
import './Carousel.css';

export default function Carousel({ movies }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? movies.length - 1 : prevIndex - 1
    );
  };

 return (
        <div className="carousel">
            <button className="carousel-btn prev" onClick={handlePrev}>
                &#8592;
            </button>
            <div className="carousel-content">
                {movies.map((movie, index) => (
                    <div
                        key={movie.id}
                        className={`carousel-card ${
                            index === currentIndex ? "active" : "inactive"
                        }`}
                    >
                        <img src={movie.poster} alt={movie.title} />
                        <div className="card-info">
                            <h3>{movie.title}</h3>
                            <p>{new Date(movie.release_date).getFullYear()}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="carousel-btn next" onClick={handleNext}>
                &#8594;
            </button>
        </div>
    );
}
