import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
import api from '../api/api';
import '../styles/LogAlbum.css';
import { motion } from 'framer-motion';

function LogAlbum() {
  const navigate = useNavigate();
  const location = useLocation();
  const album = location.state?.album;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [listenDate, setListenDate] = useState(new Date().toISOString().split('T')[0]);
  const [favoriteTracks, setFavoriteTracks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracks, setTracks] = useState([]);
  const [favoriteSong, setFavoriteSong] = useState('');

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await api.get(`/api/spotify/tracks/${album.spotify_id}/`);
        setTracks(response.data.tracks);
      } catch (error) {
        console.error('Error fetching tracks:', error);
        setError('Failed to load album tracks');
      }
    };

    if (album?.spotify_id) {
      fetchTracks();
    }
  }, [album]);

  if (!album) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Log the album data being sent
      const albumData = {
        spotify_id: album.spotify_id,
        name: album.name,
        artist: album.artist,
        image_url: album.image_url,
        release_date: album.release_date,
        external_url: album.external_url,
        genres: album.genres
      };
      console.log('Sending album data:', albumData);

      await api.post('/api/albums/create/', albumData);
      
      // Log the log data being sent
      const logData = {
        album_id: album.spotify_id,
        rating,
        review,
        listen_date: listenDate,
        favorite_song: favoriteSong,
      };
      console.log('Sending log data:', logData);

      const response = await api.post('/api/logs/', logData);
      console.log('Response:', response.data);
      navigate('/profile');
    } catch (error) {
      console.error('Error logging album:', error.response?.data || error);
      setError(error.response?.data?.detail || 'Failed to log album');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="log-album-page">
      <div className="log-album-container">
        <h1>Log Album</h1>
        
        {album && (
          <motion.form 
            onSubmit={handleSubmit} 
            className="log-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Album Info Display */}
            <motion.div 
              className="selected-album"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <img src={album.image_url} alt={album.name} />
              <div className="album-details">
                <h2>{album.name}</h2>
                <p>{album.artist}</p>
                <span className="release-date">{album.release_date}</span>
              </div>
            </motion.div>

            {/* Rating */}
            <div className="form-group rating-group">
              <label>Rating</label>
              <div className="rating">
                {[5, 4, 3, 2, 1].map((star) => (
                  <React.Fragment key={star}>
                    <input
                      type="radio"
                      id={`star${star}`}
                      name="rating"
                      value={star}
                      checked={rating === star}
                      onChange={() => setRating(star)}
                    />
                    <label htmlFor={`star${star}`}>
                      <Star size={32} />
                    </label>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Review */}
            <motion.div 
              className="form-group"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <label htmlFor="review">Review</label>
              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                placeholder="Share your thoughts about this album..."
              />
            </motion.div>

            {/* Listen Date */}
            <motion.div 
              className="form-group"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <label htmlFor="listenDate">Listen Date</label>
              <input
                type="date"
                id="listenDate"
                value={listenDate}
                onChange={(e) => setListenDate(e.target.value)}
              />
            </motion.div>

            {/* Favorite Song */}
            <motion.div 
              className="form-group"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <label htmlFor="favoriteSong">Favorite Song</label>
              <select
                id="favoriteSong"
                value={favoriteSong}
                onChange={(e) => setFavoriteSong(e.target.value)}
                required
              >
                <option value="">Select a song...</option>
                {tracks.map((track) => (
                  <option key={track.id} value={track.name}>
                    {track.track_number}. {track.name}
                  </option>
                ))}
              </select>
            </motion.div>

            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div className="form-actions">
              <motion.button 
                type="button" 
                onClick={() => navigate(-1)}
                className="cancel-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button 
                type="submit" 
                disabled={loading || !album || !rating}
                className="submit-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Logging...' : 'Log Album'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}

export default LogAlbum;