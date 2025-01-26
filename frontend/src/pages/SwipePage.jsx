import React, { useEffect, useState, useContext, useRef } from "react";
import TinderCard from "react-tinder-card";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import "./SwipePage.css";

export default function SwipePage() {
  const { token } = useContext(AuthContext);
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [lastDirection, setLastDirection] = useState("");

  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [pendingWatchedMovieId, setPendingWatchedMovieId] = useState(null);
  
  // Array of refs, one per movie
  const childRefs = useRef([]);

  useEffect(() => {
    fetchMovies();

  }, [token]);

  async function fetchMovies() {
    try {
      const res = await api.get("/movies/trending");
      const movieArray = res.data?.data || [];
      setMovies(movieArray);
      setCurrentIndex(movieArray.length - 1);

      // Create refs for each movie
      childRefs.current = movieArray.map((_, i) => childRefs.current[i] || React.createRef());
    } catch (err) {
      console.error("Fetch Movies Error:", err.response?.data || err.message);
    }
  }
  
  // Programmatically trigger a swipe
  async function swipe(dir) {
    if (currentIndex < 0) return;
    const movie = movies[currentIndex];
    if (!movie) return;

    if (dir === "up") {
        setPendingWatchedMovieId(movie.id);
        setRatingValue(5);
        setShowRating(true);
    } else if (dir === "right") {
        // like
        await recordSwipeAction(movie.id, "like");
    } else if (dir === "left") {
        // dislike
         await recordSwipeAction(movie.id, "dislike");
    }

    childRefs.current[currentIndex].current.swipe(dir);
  }

  async function recordSwipeAction(movieId, action) {
    try {
      await api.post("/swipe/action", { movieId, action });
      console.log(`Recorded ${action} for movieId=${movieId}`);
    } catch (err) {
      console.error("Swipe Action Error:", err.response?.data || err.message);
    }
  }

  async function recordWatched(movieId, rating) {
    try {
        await api.post("/swipe/watched", { movieId, rating });
        console.log(`Recorded watched rating=${rating} for movieId=${movieId}`);
    } catch (err) {
        console.error("Record Watched Error:", err.response?.data || err.message);
    }
  }

  const swiped = (direction, movieId, index) => {
    setLastDirection(direction);

    if (direction === "right") {
      recordSwipeAction(movieId, "like");
    } else if (direction === "left") {
      recordSwipeAction(movieId, "dislike");
    } else if (direction === "up") {
      setPendingWatchedMovieId(movieId);
      setRatingValue(5);
      setShowRating(true);
    }

    setCurrentIndex(index - 1);
  };

  const outOfFrame = (title, idx) => {
    // console.log(`${title} (${idx}) left the screen.`);
  };

  const handleButtonClick = (dir) => {
    swipe(dir);
  };

  const handleRatingSubmit = async () => {
    if (pendingWatchedMovieId) {
        await recordWatched(pendingWatchedMovieId, ratingValue);
    }
    setShowRating(false);
    setPendingWatchedMovieId(null);
  };

  const handleRatingCancel = () => {
    setShowRating(false);
    setPendingWatchedMovieId(null);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <i
                key={i}
                className={`fa-solid fa-star star-icon ${i <= ratingValue ? "filled" : ""}`}
                onClick={() => setRatingValue(i)}
            />
        );
    }
    return stars;
  };

  return (
    <div className="swipe-page">
      <h1>Swipe Movies</h1>

      <div className="card-container">
        {movies.map((movie, index) => (
          <TinderCard
            ref={childRefs.current[index]}
            className="swipe"
            key={movie.id}
            onSwipe={(dir) => swiped(dir, movie.id, index)}
            onCardLeftScreen={() => outOfFrame(movie.title, index)}
            preventSwipe={["down"]}
          >
            <div className="card" style={{ backgroundImage: `url(${movie.poster})` }}>
              <h3>{movie.title}</h3>
            </div>
          </TinderCard>
        ))}
      </div>

      {lastDirection && <h2 className="infoText">You swiped {lastDirection}</h2>}

      <div className="buttons-container">
        <button 
            className="action-btn dislike" 
            onClick={() => swipe("left")}
        >
          <i className="fa-solid fa-thumbs-down"></i>
        </button>
        <button 
            className="action-btn watched" 
            onClick={() => swipe("up")}
        >
          <i className="fa-solid fa-eye"></i>
        </button>
        <button 
            className="action-btn like" 
            onClick={() => swipe("right")}
        >
          <i className="fa-solid fa-thumbs-up"></i>
        </button>
      </div>

      {showRating && (
        <div className="rating-modal-overlay">
          <div className="rating-modal-content">
            <h2>Rate this movie</h2>
            <div className="stars-container">
              {renderStars()}
            </div>
            <div className="rating-buttons">
              <button onClick={handleRatingSubmit}>Submit</button>
              <button onClick={handleRatingCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
