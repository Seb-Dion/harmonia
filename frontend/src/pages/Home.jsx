import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, History, Star } from 'lucide-react';
import api from '../api/api';
import '../styles/Home.css';
import { ACCESS_TOKEN } from '../constants';
import { AnimatePresence, motion } from 'framer-motion';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentLogs, setRecentLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRecentLogs();
  }, [navigate]);

  const fetchRecentLogs = async () => {
    try {
      const response = await api.get('api/logs/');
      setRecentLogs(response.data);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    console.log('Search initiated with query:', searchQuery);
    
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`api/spotify/search/?q=${encodeURIComponent(searchQuery)}&limit=50`);
      console.log('Raw API response:', response.data);
      
      if (response.data.tracks && response.data.tracks.items) {
        // Format the tracks data to get album information
        const formattedResults = response.data.tracks.items.map(track => ({
          spotify_id: track.album.id,
          name: track.album.name,
          artist: track.artists[0].name,
          image_url: track.album.images[0]?.url || '',
          release_date: track.album.release_date
        }));

        // Remove duplicates based on spotify_id
        const uniqueAlbums = Array.from(
          new Map(formattedResults.map(album => [album.spotify_id, album])).values()
        );

        console.log('Formatted albums:', uniqueAlbums);
        setSearchResults(uniqueAlbums);
      } else {
        console.log('No results found');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search albums. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <section className="search-section">
        <h2>Search Albums</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for albums..."
              className="search-input"
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div className="loading-container">
              {/* ... loading content ... */}
            </motion.div>
          ) : searchResults.length > 0 ? (
            <motion.section className="search-results">
              <h2>Search Results</h2>
              <div className="album-grid">
                {searchResults
                  .filter(album => album !== null)
                  .map((album) => (
                    <motion.div
                      key={album.spotify_id}
                      className="album-card"
                    >
                      <img
                        src={album.image_url}
                        alt={`${album.name} by ${album.artist}`}
                        className="album-cover"
                      />
                      <div className="album-info">
                        <h3>{album.name}</h3>
                        <p>{album.artist}</p>
                      </div>
                      <button
                        onClick={() => navigate('/log-album', { state: { album } })}
                        className="log-button"
                      >
                        <Plus size={20} />
                        Log
                      </button>
                    </motion.div>
                  ))}
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </section>

      <section className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-grid">
          {Array.isArray(recentLogs) && recentLogs.map((log) => (
            <div key={log.id} className="activity-card">
              <img
                src={log.album.image_url}
                alt={`${log.album.name} by ${log.album.artist}`}
                className="album-cover"
              />
              <div className="activity-info">
                <div className="album-details">
                  <h3>{log.album.name}</h3>
                  <p>{log.album.artist}</p>
                </div>
                <div className="log-details">
                  <div className="rating">
                    <Star size={16} className="star-icon" />
                    {log.rating}/5
                  </div>
                  <div className="date">
                    {new Date(log.listen_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
