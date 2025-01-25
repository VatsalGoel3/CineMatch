import React, { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import "./SwipePage.css";
import TinderCard from "react-tinder-card";

export default function SwipePage() {
  const { token } = useContext(AuthContext);
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1); // Top card index
  const [lastDirection, setLastDirection] = useState("");

  useEffect(() => {
    fetchMovies();
  }, [token]);

  // Fetch trending movies
  async function fetchMovies() {
    try {
      const res = await api.get("/movies/trending"); // Adjust endpoint
      const movieArray = res.data?.data || [];
      setMovies(movieArray);
      setCurrentIndex(movieArray.length - 1); // Set the top card index
    } catch (err) {
      console.error("Fetch Movies Error:", err.response?.data || err.message);
    }
  }

  // Record swipe action
  async function recordSwipeAction(movieId, action) {
    try {
      await api.post("/swipe/action", { movieId, action });
      console.log(`Recorded ${action} for movieId=${movieId}`);
    } catch (err) {
      console.error("Swipe Action Error:", err.response?.data || err.message);
    }
  }

  // Record watched action
  async function recordWatched(movieId) {
    const rating = prompt("You watched this movie! Please rate it out of 5 stars:", "5");
    if (rating !== null) {
      try {
        await api.post("/swipe/watched", { movieId, rating: Number(rating) });
        console.log(`Recorded watched with rating ${rating} for movieId=${movieId}`);
      } catch (err) {
        console.error("Record Watched Error:", err.response?.data || err.message);
      }
    }
  }

  // Swiped logic
  const swiped = (direction, movieId) => {
    setLastDirection(direction);

    if (direction === "right") {
      recordSwipeAction(movieId, "like");
    } else if (direction === "left") {
      recordSwipeAction(movieId, "dislike");
    } else if (direction === "up") {
      recordWatched(movieId);
    }

    // Update current index
    setCurrentIndex((prevIndex) => prevIndex - 1);
  };

  const outOfFrame = (title) => {
    console.log(`${title} left the screen.`);
  };

  // Handle button actions
  const handleButtonClick = (action) => {
    if (currentIndex < 0) return; // No more cards

    const movie = movies[currentIndex];

    if (!movie) return;

    if (action === "like") {
      swiped("right", movie.id);
    } else if (action === "dislike") {
      swiped("left", movie.id);
    } else if (action === "watched") {
      swiped("up", movie.id);
    }
  };

  return (
    <div className="swipe-page">
      <h1>Swipe Movies</h1>

      <div className="card-container">
        {movies.map((movie, index) => (
          <TinderCard
            className="swipe"
            key={movie.id}
            onSwipe={(dir) => swiped(dir, movie.id)}
            onCardLeftScreen={() => outOfFrame(movie.title)}
            preventSwipe={["down"]}
          >
            {index === currentIndex && (
              <div
                className="card"
                style={{ backgroundImage: `url(${movie.poster || ""})` }}
              >
                <h3>{movie.title}</h3>
              </div>
            )}
          </TinderCard>
        ))}
      </div>

      {lastDirection && (
        <h2 className="infoText">You swiped {lastDirection}</h2>
      )}

      <div className="buttons-container">
        <button
          className="action-btn dislike"
          onClick={() => handleButtonClick("dislike")}
        >
          Dislike
        </button>
        <button
          className="action-btn watched"
          onClick={() => handleButtonClick("watched")}
        >
          Watched
        </button>
        <button
          className="action-btn like"
          onClick={() => handleButtonClick("like")}
        >
          Like
        </button>
      </div>
    </div>
  );
}
