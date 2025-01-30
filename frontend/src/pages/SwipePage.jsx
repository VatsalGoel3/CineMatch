import React, { useEffect, useState, useContext, useRef } from "react";
import TinderCard from "react-tinder-card";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import "./SwipePage.css";

const SWIPE_COOLDOWN = 120; // 2 minutes in seconds
const SWIPES_BEFORE_COOLDOWN = 20;

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

  const [allSwiped, setAllSwiped] = useState(false);

  // Refs to each card (for programmatic removal)
  const childRefs = useRef([]);

  const [swipeCount, setSwipeCount] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(SWIPE_COOLDOWN);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchMovies();
    // Check localStorage for existing cooldown
    const cooldownEndTime = localStorage.getItem('swipeCooldownEnd');
    if (cooldownEndTime) {
      const remainingTime = Math.ceil((parseInt(cooldownEndTime) - Date.now()) / 1000);
      if (remainingTime > 0) {
        setCooldownActive(true);
        setCooldownTimer(remainingTime);
        startCooldownTimer();
      } else {
        localStorage.removeItem('swipeCooldownEnd');
      }
    }
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

  useEffect(() => {
    if (currentIndex < 0 && movies.length > 0) {
      setAllSwiped(true);
    }
  }, [currentIndex, movies]);

  const startCooldownTimer = () => {
    setCooldownActive(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCooldownActive(false);
          localStorage.removeItem('swipeCooldownEnd');
          fetchMovies(); // Fetch new recommendations
          return SWIPE_COOLDOWN;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSwipeAction = async (dir, movieId) => {
    if (cooldownActive) return;

    try {
        // Map the direction to the expected action type
        let action;
        switch(dir) {
            case "left":
                action = "dislike";
                break;
            case "right":
                action = "like";
                break;
            default:
                return;
        }

        // Record the action
        await recordSwipeAction(movieId, action);
        
        // Update card position
        if (childRefs.current[currentIndex]?.current) {
            childRefs.current[currentIndex].current.swipe(dir);
            setCurrentIndex(currentIndex - 1);
            setLastDirection(dir);
        }
        
        // Update swipe count and check for cooldown
        setSwipeCount(prev => {
            const newCount = prev + 1;
            if (newCount >= SWIPES_BEFORE_COOLDOWN) {
                // Set cooldown
                const endTime = Date.now() + (SWIPE_COOLDOWN * 1000);
                localStorage.setItem('swipeCooldownEnd', endTime.toString());
                startCooldownTimer();
                return 0; // Reset count
            }
            return newCount;
        });
    } catch (err) {
        console.error("Swipe Action Error:", err.response?.data || err.message);
    }
  };

  // Update the rating submission to include swipe count
  const handleRatingSubmit = async () => {
    if (pendingWatchedMovieId == null || pendingUpIndex == null) return;

    try {
        await recordWatched(pendingWatchedMovieId, ratingValue);
        
        // Remove card
        if (childRefs.current[pendingUpIndex]?.current) {
            childRefs.current[pendingUpIndex].current.swipe('up');
            setCurrentIndex(pendingUpIndex - 1);
            setLastDirection('up');
        }

        // Update swipe count
        setSwipeCount(prev => {
            const newCount = prev + 1;
            if (newCount >= SWIPES_BEFORE_COOLDOWN) {
                const endTime = Date.now() + (SWIPE_COOLDOWN * 1000);
                localStorage.setItem('swipeCooldownEnd', endTime.toString());
                startCooldownTimer();
                return 0;
            }
            return newCount;
        });

        setShowRating(false);
        setPendingWatchedMovieId(null);
        setPendingUpIndex(null);
    } catch (err) {
        console.error("Rating Submit Error:", err.response?.data || err.message);
    }
  };

  // Add back the renderStars function that was accidentally removed
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="swipe-page">
      <h1>Swipe Movies</h1>

      {cooldownActive ? (
        <div className="cooldown-container">
          <div className="cooldown-timer">
            <i className="fas fa-hourglass-half fa-spin"></i>
            <span>{formatTime(cooldownTimer)}</span>
          </div>
          <p>Taking a break to train AI with your preferences!</p>
          <p>Come back in a moment for better recommendations.</p>
        </div>
      ) : (
        <>
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
              onClick={() => handleSwipeAction("left", movies[currentIndex].id)}
            >
              <i className="fa-solid fa-thumbs-down"></i>
            </button>
            <button 
              className="action-btn watched"
              onClick={() => {
                setPendingWatchedMovieId(movies[currentIndex].id);
                setPendingUpIndex(currentIndex);
                setRatingValue(5);
                setShowRating(true);
              }}
            >
              <i className="fa-solid fa-eye"></i>
            </button>
            <button 
              className="action-btn like"
              onClick={() => handleSwipeAction("right", movies[currentIndex].id)}
            >
              <i className="fa-solid fa-thumbs-up"></i>
            </button>
          </div>
        </>
      )}

      {allSwiped && (
        <div className="out-of-cards">
          <h2>You've swiped all recommended movies!</h2>
          <p>Come back later for more.</p>
        </div>
      )}

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

      {!cooldownActive && (
        <div className="swipe-progress">
          <span>{SWIPES_BEFORE_COOLDOWN - swipeCount} swipes until AI training</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{width: `${(swipeCount / SWIPES_BEFORE_COOLDOWN) * 100}%`}}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
