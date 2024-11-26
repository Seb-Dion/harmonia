import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
import api from '../api/api';
import '../styles/LogAlbum.css';

function LogAlbum() {
  const navigate = useNavigate();
  const location = useLocation();
  const album = location.state?.album;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [listenDate, setListenDate] = useState(new Date().toISOString().split('T')[0]);
  const [favoriteTracks, setFavoriteTracks] = useState('');
  const [relisten, setRelisten] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!album) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First, ensure the album exists in the database
      const albumData = {
        spotify_id: album.spotify_id,
        name: album.name,
        artist: album.artist,
        image_url: album.image_url,
        release_date: album.release_date,
        external_url: album.external_url,
        genres: album.genres
      };

      const albumResponse = await api.post('/api/albums/create/', albumData);
      
      // Then create the log with a reference to the album
      const logData = {
        album_id: albumResponse.data.id,
        rating,
        review,
        listen_date: listenDate,
        favorite_tracks: favoriteTracks,
        relisten
      };

      await api.post('/api/logs/', logData);
      navigate('/');
    } catch (error) {
      console.error('Error logging album:', error.response?.data);
      setError('Failed to log album. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="log-album-page">
      <div className="log-album-container">
        <h1>Log Album</h1>
        
        {/* Album Search/Selection Section */}
        <div className="album-search-section">
          {/* Album search component will go here */}
        </div>

        {album && (
          <form onSubmit={handleSubmit} className="log-form">
            {/* Album Info Display */}
            <div className="selected-album">
              <img src={album.image_url} alt={album.name} />
              <div className="album-details">
                <h2>{album.name}</h2>
                <p>{album.artist}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="form-group">
              <label>Rating</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-button ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    <Star size={24} className={rating >= star ? 'filled' : ''} />
                  </button>
                ))}
              </div>
            </div>

            {/* Review */}
            <div className="form-group">
              <label htmlFor="review">Review</label>
              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                placeholder="Write your thoughts about this album..."
              />
            </div>

            {/* Listen Date */}
            <div className="form-group">
              <label htmlFor="listenDate">Listen Date</label>
              <input
                type="date"
                id="listenDate"
                value={listenDate}
                onChange={(e) => setListenDate(e.target.value)}
              />
            </div>

            {/* Favorite Tracks */}
            <div className="form-group">
              <label htmlFor="favoriteTracks">Favorite Tracks</label>
              <textarea
                id="favoriteTracks"
                value={favoriteTracks}
                onChange={(e) => setFavoriteTracks(e.target.value)}
                rows={2}
                placeholder="List your favorite tracks (optional)"
              />
            </div>

            {/* Relisten */}
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={relisten}
                  onChange={(e) => setRelisten(e.target.checked)}
                />
                Relisten
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading || !album || !rating}
                className="submit-button"
              >
                {loading ? 'Logging...' : 'Log Album'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LogAlbum;