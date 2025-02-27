import React, { useEffect, useState, useContext, useRef } from "react";
import TinderCard from "react-tinder-card";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import "./SwipePage.css";

const SWIPE_COOLDOWN = 10; // 2 minutes in seconds
const SWIPES_BEFORE_COOLDOWN = 20;
const SWIPE_COUNT_KEY = 'swipeCount';

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

  const [swipeCount, setSwipeCount] = useState(() => {
    const savedCount = localStorage.getItem(SWIPE_COUNT_KEY);
    return savedCount ? parseInt(savedCount) : 0;
  });

  useEffect(() => {
    localStorage.setItem(SWIPE_COUNT_KEY, swipeCount.toString());
  }, [swipeCount]);

  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(SWIPE_COOLDOWN);
  const timerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);

  const [noMoreRecommendations, setNoMoreRecommendations] = useState(false);

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
      setIsLoading(true);
      const res = await api.get("/movies/recommendations");
      const movieArray = res.data?.data || [];
      
      if (movieArray.length === 0) {
        setNoMoreRecommendations(true);
        return;
      }
      
      // Preload all images before showing the cards
      await Promise.all(
        movieArray.map(movie => {
          return new Promise((resolve) => {
            if (!movie.poster) {
              resolve();
              return;
            }
            const img = new Image();
            img.src = movie.poster;
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      setMovies(movieArray);
      setCurrentIndex(movieArray.length - 1);
      childRefs.current = movieArray.map(() => React.createRef());
      setNoMoreRecommendations(false);
    } catch (err) {
      console.error("Fetch Movies Error:", err.response?.data || err.message);
      if (err.response?.status === 404) {
        setNoMoreRecommendations(true);
      }
    } finally {
      setIsLoading(false);
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

  // Add the missing onCardLeftScreen function
  const onCardLeftScreen = (title, index) => {
    if (index !== currentIndex) return; // Only handle current card
    console.log(`${title} left the screen`);
  };

  // Add the missing handleRatingCancel function
  const handleRatingCancel = () => {
    setShowRating(false);
    setPendingWatchedMovieId(null);
    setPendingUpIndex(null);
  };

  // Update the TinderCard component to properly handle swipes
  const onSwipe = (dir, movieId, index) => {
    if (index !== currentIndex) return; // Only handle current card
    setLastDirection(dir);
  };

  useEffect(() => {
    if (currentIndex < 0 && movies.length > 0 && !cooldownActive) {
      setAllSwiped(true);
    } else {
      setAllSwiped(false);
    }
  }, [currentIndex, movies.length, cooldownActive]);

  const startCooldownTimer = () => {
    setCooldownActive(true);
    setAllSwiped(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    localStorage.setItem(SWIPE_COUNT_KEY, '0');
    setSwipeCount(0);
    
    timerRef.current = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCooldownActive(false);
          localStorage.removeItem('swipeCooldownEnd');
          fetchMovies();
          return SWIPE_COOLDOWN;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSwipeAction = async (dir, movieId) => {
    if (cooldownActive) return;

    try {
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

        // Remove single card
        if (childRefs.current[currentIndex]?.current) {
            childRefs.current[currentIndex].current.swipe(dir);
            setCurrentIndex(prev => prev - 1);
        }

    } catch (err) {
        console.error("Swipe Action Error:", err.response?.data || err.message);
    }
  };

  // New function to handle training
  const handleTraining = async () => {
    try {
        // Get user's interactions for training
        const userInteractions = await api.get("/swipe/interactions");
        const movieFeatures = await api.get("/movies/features");

        // Train the model
        await api.post("/train", {
            userInteractions: userInteractions.data,
            itemFeatures: movieFeatures.data
        });
        
        // Set cooldown
        const endTime = Date.now() + (SWIPE_COOLDOWN * 1000);
        localStorage.setItem('swipeCooldownEnd', endTime.toString());
        startCooldownTimer();
    } catch (err) {
        if (err.response?.status === 429) {
            // Cooldown in effect, get remaining time
            const remainingSeconds = err.response.data.remaining_seconds;
            setCooldownTimer(remainingSeconds);
            startCooldownTimer();
        } else {
            console.error("Training Error:", err);
        }
    }
  };

  // Update handleRatingSubmit to use handleTraining
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

        // Update swipe count and check for training
        setSwipeCount(prev => {
            const newCount = prev + 1;
            if (newCount >= SWIPES_BEFORE_COOLDOWN) {
                handleTraining();
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

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading movies...</p>
        </div>
      ) : cooldownActive ? (
        <div className="cooldown-container">
          <div className="cooldown-timer">
            <i className="fas fa-hourglass-half fa-spin"></i>
            <span>{formatTime(cooldownTimer)}</span>
          </div>
          <p>Taking a break! Come back in a moment.</p>
          <p>This helps us find better movies for you.</p>
        </div>
      ) : noMoreRecommendations ? (
        <div className="out-of-cards">
          <h2>No More Movies to Recommend</h2>
          <p>You've gone through all our current recommendations!</p>
          <p>We're training our system to find new movies for you.</p>
          <p>Please check back tomorrow for fresh recommendations.</p>
        </div>
      ) : allSwiped ? (
        <div className="out-of-cards">
          <h2>Taking a Short Break</h2>
          <p>We're finding more movies for you.</p>
          <p>Please wait a moment...</p>
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
                preventSwipe={["up", "down"]}
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

          <div className="swipe-progress">
            <span>{SWIPES_BEFORE_COOLDOWN - swipeCount} swipes until break</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${(swipeCount / SWIPES_BEFORE_COOLDOWN) * 100}%`}}
              ></div>
            </div>
          </div>
        </>
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
    </div>
  );
}