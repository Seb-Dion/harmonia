import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, History, Star, Disc, TrendingUp, Clock, Award, X, Scroll } from 'lucide-react';
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
  const [userStats, setUserStats] = useState(null);
  const [activeSection, setActiveSection] = useState('discover');
  const [activeSearch, setActiveSearch] = useState([]);
  const [trendingAlbums, setTrendingAlbums] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInitialData();
  }, [navigate]);

  const fetchInitialData = async () => {
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        api.get('api/logs/'),
        api.get('api/stats/')
      ]);
      setRecentLogs(logsResponse.data);
      setUserStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.get(`api/spotify/search/?q=${encodeURIComponent(searchQuery)}&limit=50`);
      if (response.data.tracks?.items) {
        const formattedResults = response.data.tracks.items.map(track => ({
          spotify_id: track.album.id,
          name: track.album.name,
          artist: track.artists[0].name,
          image_url: track.album.images[0]?.url || '',
          release_date: track.album.release_date
        }));

        const uniqueAlbums = Array.from(
          new Map(formattedResults.map(album => [album.spotify_id, album])).values()
        );
        setSearchResults(uniqueAlbums);
      }
    } catch (error) {
      setError('Failed to search albums. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value === '') {
      setActiveSearch([]);
      return;
    }

    try {
      const response = await api.get(`api/spotify/search/?q=${encodeURIComponent(value)}&limit=8`);
      if (response.data.tracks?.items) {
        const suggestions = response.data.tracks.items.map(track => ({
          id: track.album.id,
          name: track.album.name,
          artist: track.artists[0].name
        }));
        setActiveSearch(suggestions);
      }
    } catch (error) {
      console.error('Search error:', error);
      setActiveSearch([]);
    }
  };

  const fetchTrendingAlbums = async () => {
    try {
      console.log('Fetching trending albums...');
      const response = await api.get('api/trending-albums/');
      console.log('Response:', response.data);
      setTrendingAlbums(response.data);
    } catch (error) {
      console.error('Error fetching trending albums:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  useEffect(() => {
    if (activeSection === 'trending') {
      fetchTrendingAlbums();
    }
  }, [activeSection]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="home-container"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Stats Overview */}
      <motion.section className="stats-overview" variants={itemVariants}>
        <div className="stat-card">
          <Disc className="stat-icon" />
          <div className="stat-content">
            <h3>Total Albums</h3>
            <p>{userStats?.total_albums || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <Star className="stat-icon" />
          <div className="stat-content">
            <h3>Average Rating</h3>
            <p>{userStats?.average_rating?.toFixed(1) || 0}/5</p>
          </div>
        </div>
        <div className="stat-card">
          <Clock className="stat-icon" />
          <div className="stat-content">
            <h3>Recent Logs</h3>
            <p>{recentLogs.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <Award className="stat-icon" />
          <div className="stat-content">
            <h3>Top Genre</h3>
            <p>{userStats?.top_genre || 'N/A'}</p>
          </div>
        </div>
      </motion.section>

      {/* Navigation Tabs */}
      <motion.nav className="section-tabs" variants={itemVariants}>
        <button 
          className={activeSection === 'discover' ? 'active' : ''}
          onClick={() => setActiveSection('discover')}
        >
          Discover
        </button>
        <button 
          className={activeSection === 'recent' ? 'active' : ''}
          onClick={() => setActiveSection('recent')}
        >
          Recent Activity
        </button>
        <button 
          className={activeSection === 'trending' ? 'active' : ''}
          onClick={() => setActiveSection('trending')}
        >
          Trending
        </button>
      </motion.nav>

      <AnimatePresence mode="wait">
        {activeSection === 'discover' && (
          <motion.section 
            className="discover-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="hero-section">
              <motion.h1 
                className="app-title"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                harmonia
              </motion.h1>
              <motion.p 
                className="app-subtitle"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Your personal music journey starts here
              </motion.p>
            </div>

            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-container">
                <input 
                  type="search" 
                  placeholder="Search for albums..." 
                  className="search-input"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
                <button 
                  type="submit"
                  className="search-icon-button"
                  disabled={loading}
                >
                  {loading ? (
                    <motion.div 
                      className="loading-spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <Search size={20} />
                  )}
                </button>
              </div>
            </form>

            <div className="search-results-section">
              {searchResults.length > 0 && (
                <h2 className="section-title">Search Results</h2>
              )}
              <motion.div className="album-grid">
                {searchResults.map((album) => (
                  <motion.div
                    key={album.spotify_id}
                    className="album-card"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -5 }}
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
                    <motion.button
                      onClick={() => navigate('/log-album', { state: { album } })}
                      className="log-button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Plus size={20} />
                      Log
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>
        )}

        {activeSection === 'recent' && (
          <motion.section 
            className="recent-activity"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="activity-grid">
              {recentLogs.map((log) => (
                <motion.div 
                  key={log.id} 
                  className="activity-card"
                  whileHover={{ scale: 1.02 }}
                >
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
                      <span className="date">
                        {new Date(log.listen_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {activeSection === 'trending' && (
          <motion.section 
            className="trending-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="album-grid">
              {trendingAlbums.map((album) => (
                <motion.div
                  key={album.spotify_id}
                  className="album-card"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
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
                  <motion.button
                    onClick={() => navigate('/log-album', { state: { album } })}
                    className="log-button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus size={20} />
                    Log
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Home;
