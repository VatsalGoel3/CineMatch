import { useEffect, useState } from 'react';
import './Carousel.css';

export default function Carousel({ movies }) {
  // 'movies' could be an array of movie objects (title, posterPath, etc.)
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 3000); // rotate every 3s
    return () => clearInterval(intervalId);
  }, [movies]);

  if (!movies || movies.length === 0) {
    return <div className="carousel-container">No movies to show</div>;
  }

  const currentMovie = movies[currentIndex];

  return (
    <div className="carousel-container">
      <img
        className="carousel-image"
        src={currentMovie.posterPath || '/placeholder_poster.jpg'}
        alt={currentMovie.title}
      />
      <div className="carousel-info">
        <h3>{currentMovie.title}</h3>
        <p>{currentMovie.overview?.substring(0, 100)}...</p>
      </div>
    </div>
  );
}
