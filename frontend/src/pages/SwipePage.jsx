// In SwipePage.jsx:
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
      childRefs.current = movieArray.map(() => React.createRef());
    } catch (err) {
      console.error("Fetch Movies Error:", err.response?.data || err.message);
    }
  }

  async function recordSwipeAction(movieId, action) {
    try {
      await api.post("/swipe/action", { movieId, action });
    } catch (err) {
      console.error("Swipe Action Error:", err.response?.data || err.message);
    }
  }

  async function recordWatched(movieId) {
    const rating = prompt("You watched this movie! Please rate it out of 5 stars:", "5");
    if (rating !== null) {
      try {
        await api.post("/swipe/watched", { movieId, rating: Number(rating) });
      } catch (err) {
        console.error("Record Watched Error:", err.response?.data || err.message);
      }
    }
  }

  const swiped = (direction, movieId, index) => {
    setLastDirection(direction);
    if (direction === "right") {
      recordSwipeAction(movieId, "like");
    } else if (direction === "left") {
      recordSwipeAction(movieId, "dislike");
    } else if (direction === "up") {
      recordWatched(movieId);
    }
    setCurrentIndex(index - 1);
  };

  const outOfFrame = (title, idx) => {
    // console.log(`${title} (${idx}) left the screen.`);
  };

  // Programmatically trigger a swipe
  const swipe = async (dir) => {
    if (currentIndex < 0) return;
    const movieId = movies[currentIndex].id;

    if (dir === "up") {
      await recordWatched(movieId);
    } else if (dir === "right") {
      await recordSwipeAction(movieId, "like");
    } else if (dir === "left") {
      await recordSwipeAction(movieId, "dislike");
    }

    // Programmatic swipe using childRefs
    childRefs.current[currentIndex].current.swipe(dir);
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
        <button className="action-btn dislike" onClick={() => swipe("left")}>
          Dislike
        </button>
        <button className="action-btn watched" onClick={() => swipe("up")}>
          Watched
        </button>
        <button className="action-btn like" onClick={() => swipe("right")}>
          Like
        </button>
      </div>
    </div>
  );
}
