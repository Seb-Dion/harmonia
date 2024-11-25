import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Heart } from "lucide-react";
import api from "../api/api";
import "../styles/AlbumLogger.css";
import { logAlbum, addToFavorites, removeFavorite } from "../api/albums";

function AlbumLogger({ album, onSuccess, onClose }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [favoriteTracksList, setFavoriteTracksList] = useState("");
  const [isRelisten, setIsRelisten] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const logData = {
        spotify_id: album.id,
        name: album.name,
        artist: album.artists[0].name,
        image_url: album.images[0]?.url,
        release_date: album.release_date,
        external_url: album.external_urls?.spotify,
        genres: album.genres?.join(","),
        rating,
        review,
        favorite_tracks: favoriteTracksList,
        relisten: isRelisten,
        listen_date: new Date().toISOString().split("T")[0],
      };

      await logAlbum(logData);
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Failed to log album:", error);
      setError(error.response?.data?.error || "Failed to log album");
    } finally {
      setLoading(false);
    }
  };

  // Click outside to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await removeFavorite(album.id);
        setIsFavorite(false);
      } else {
        await addToFavorites(album);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <motion.div
      className="album-logger-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleOverlayClick}
    >
      <motion.div
        className="album-logger"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <div className="logger-header">
          <h2>Log Album</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="album-info">
          <img
            src={album.images[0]?.url}
            alt={album.name}
            className="album-cover"
          />
          <div className="album-details">
            <h3>{album.name}</h3>
            <p>{album.artists[0].name}</p>
          </div>
        </div>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="rating-section">
            <label>Rating</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  className={`star-button ${star <= rating ? "active" : ""}`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                >
                  <Star
                    size={24}
                    fill={star <= rating ? "var(--color-primary)" : "none"}
                    stroke={
                      star <= rating ? "var(--color-primary)" : "currentColor"
                    }
                  />
                </motion.button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="review">Review (Optional)</label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Write your thoughts about this album..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="favoriteTracks">Favorite Tracks (Optional)</label>
            <input
              type="text"
              id="favoriteTracks"
              value={favoriteTracksList}
              onChange={(e) => setFavoriteTracksList(e.target.value)}
              placeholder="Separate track names with commas"
              className="favorite-tracks-input"
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isRelisten}
                onChange={(e) => setIsRelisten(e.target.checked)}
              />
              This is a relisten
            </label>
          </div>

          <div className="logger-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={!rating || loading}
            >
              {loading ? "Logging..." : "Log Album"}
            </button>
          </div>
        </form>

        <button
          className={`favorite-button ${isFavorite ? "active" : ""}`}
          onClick={handleToggleFavorite}
          disabled={favoriteLoading}
        >
          <Heart
            size={24}
            fill={isFavorite ? "var(--color-primary)" : "none"}
            stroke={isFavorite ? "var(--color-primary)" : "currentColor"}
          />
        </button>
      </motion.div>
    </motion.div>
  );
}

export default AlbumLogger;
