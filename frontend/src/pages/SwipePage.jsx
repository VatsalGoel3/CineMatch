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

  // For rating modal
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [pendingWatchedMovieId, setPendingWatchedMovieId] = useState(null);
  const [pendingUpIndex, setPendingUpIndex] = useState(null);

  // Refs to each card (for programmatic removal)
  const childRefs = useRef([]);

  useEffect(() => {
    fetchMovies();
  }, [token]);

  async function fetchMovies() {
    try {
      const res = await api.get("/movies/recommendations");
      const movieArray = res.data?.data || [];
      setMovies(movieArray);
      setCurrentIndex(movieArray.length - 1);

      // Create refs for each movie
      childRefs.current = movieArray.map(() => React.createRef());
    } catch (err) {
      console.error("Fetch Movies Error:", err.response?.data || err.message);
    }
  }

  // Record like/dislike action on the server
  async function recordSwipeAction(movieId, action) {
    try {
      await api.post("/swipe/action", { movieId, action });
      console.log(`Recorded ${action} for movieId=${movieId}`);
    } catch (err) {
      console.error("Swipe Action Error:", err.response?.data || err.message);
    }
  }

  // Record watched rating on the server
  async function recordWatched(movieId, rating) {
    try {
      await api.post("/swipe/watched", { movieId, rating });
      console.log(`Recorded watched rating=${rating} for movieId=${movieId}`);
    } catch (err) {
      console.error("Record Watched Error:", err.response?.data || err.message);
    }
  }
  const onSwipe = (dir, movieId, index) => {
    setLastDirection(dir);
  };

  const onCardLeftScreen = (title, idx) => {
    // If an actual swipe occurs, in theory the card leaves screen,
    // but we won't rely on that for our main logic.
  };

  async function buttonSwipe(dir) {
    if (currentIndex < 0) return;
    const movie = movies[currentIndex];
    if (!movie) return;

    if (dir === "left") {
      // Dislike
      await recordSwipeAction(movie.id, "dislike");
      removeCard(currentIndex, dir);
    } else if (dir === "right") {
      // Like
      await recordSwipeAction(movie.id, "like");
      removeCard(currentIndex, dir);
    } else if (dir === "up") {
      // Watched => open rating modal
      setPendingWatchedMovieId(movie.id);
      setPendingUpIndex(currentIndex);
      setRatingValue(5);
      setShowRating(true);
    }
  }

  // Actually remove the card from the deck programmatically
  function removeCard(cardIndex, direction) {
    if (childRefs.current[cardIndex]?.current) {
      childRefs.current[cardIndex].current.swipe(direction);
      setCurrentIndex(cardIndex - 1);
      setLastDirection(direction);
    }
  }

  async function handleRatingSubmit() {
    if (pendingWatchedMovieId == null || pendingUpIndex == null) return;

    await recordWatched(pendingWatchedMovieId, ratingValue);

    removeCard(pendingUpIndex, "up");

    setShowRating(false);
    setPendingWatchedMovieId(null);
    setPendingUpIndex(null);
  }

  // Called when user cancels rating => do NOT remove the card
  function handleRatingCancel() {
    setShowRating(false);
    setPendingWatchedMovieId(null);
    setPendingUpIndex(null);
  }

  function renderStars() {
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
  }

  return (
    <div className="swipe-page">
      <h1>Swipe Movies</h1>

      <div className="card-container">
        {movies.map((movie, index) => (
          <TinderCard
            key={movie.id}
            ref={childRefs.current[index]}
            className="swipe"
            onSwipe={(dir) => onSwipe(dir, movie.id, index)}
            onCardLeftScreen={() => onCardLeftScreen(movie.title, index)}
            preventSwipe={["left", "right", "down", "up"]} 
          >
            <div
              className="card"
              style={{ backgroundImage: `url(${movie.poster || ""})` }}
            >
              <h3>{movie.title}</h3>
            </div>
          </TinderCard>
        ))}
      </div>

      <div className="buttons-container">
        <button 
          className="action-btn dislike"
          onClick={() => buttonSwipe("left")}
        >
          <i className="fa-solid fa-thumbs-down"></i>
        </button>
        <button 
          className="action-btn watched"
          onClick={() => buttonSwipe("up")}
        >
          <i className="fa-solid fa-eye"></i>
        </button>
        <button 
          className="action-btn like"
          onClick={() => buttonSwipe("right")}
        >
          <i className="fa-solid fa-thumbs-up"></i>
        </button>
      </div>

      {showRating && (
        <div className="rating-modal-overlay">
          <div className="rating-modal-content">
            <h2>Rate this movie</h2>
            <div className="stars-container">{renderStars()}</div>
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
