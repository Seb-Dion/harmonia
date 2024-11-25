import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader, Star } from "lucide-react";
import AlbumLogger from "../components/AlbumLogger";
import { searchAlbums, getRecentLogs } from "../api/albums";
import "../styles/Home.css";

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [error, setError] = useState("");
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchRecentLogs();
  }, []);

  const fetchRecentLogs = async () => {
    try {
      const data = await getRecentLogs();
      console.log('Fetched logs:', data); // Debug log
      setRecentLogs(data || []);
    } catch (error) {
      console.error("Failed to fetch recent logs:", error);
      setRecentLogs([]); // Set empty array on error
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setSearchResults([]);

    try {
      const data = await searchAlbums(searchQuery);
      if (data.albums?.items) {
        setSearchResults(data.albums.items);
      } else {
        setError("No albums found");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setError("Failed to search albums");
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
  };

  const handleLogSuccess = () => {
    fetchRecentLogs();
    setSelectedAlbum(null);
  };

  // Helper function to get album image URL
  const getAlbumImageUrl = (album) => {
    return album?.images?.[0]?.url || "/default-album-cover.png"; // Add a default album cover image
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Track Your Music Journey
        </motion.h1>

        <motion.form
          className="search-bar"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSearch}
        >
          <Search size={20} />
          <input
            type="text"
            placeholder="Search for albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? <Loader className="spin" size={20} /> : "Search"}
          </button>
        </motion.form>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}
      </section>

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            className="loading-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader className="spin" size={40} />
            <p>Searching albums...</p>
          </motion.div>
        ) : searchResults.length > 0 ? (
          <motion.section
            className="search-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <h2>Search Results</h2>
            <div className="album-grid">
              {searchResults
                .filter(album => album !== null)
                .map((album) => {
                  if (!album || !album.id) return null;
                  
                  return (
                    <motion.div
                      key={album.id}
                      className="album-card"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAlbumClick(album)}
                    >
                      <img
                        src={getAlbumImageUrl(album)}
                        alt={album.name || "Album cover"}
                        className="album-cover"
                      />
                      <div className="album-info">
                        <h3>{album.name || "Untitled Album"}</h3>
                        <p>{album.artists?.[0]?.name || "Unknown Artist"}</p>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* Recent Logs Section */}
      {recentLogs?.length > 0 && !searchResults.length && (
        <motion.section
          className="recent-logs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2>Recently Logged</h2>
          <div className="album-grid">
            {recentLogs
              .filter(log => {
                // Add detailed filtering with debug
                const isValid = log && 
                               log.album && 
                               typeof log.album === 'object' && 
                               log.album.name;
                if (!isValid) {
                  console.log('Filtered out invalid log:', log);
                }
                return isValid;
              })
              .map((log) => (
                <motion.div
                  key={log.id}
                  className="album-card logged"
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={log.album.image_url || "/default-album-cover.png"}
                    alt={`${log.album.name} cover`}
                    className="album-cover"
                  />
                  <div className="album-info">
                    <h3>{log.album.name}</h3>
                    <p>{log.album.artist}</p>
                    <div className="rating">
                      {Array.from({ length: log.rating || 0 }).map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill="var(--color-primary)"
                          stroke="none"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.section>
      )}

      {/* Album Logger Modal */}
      <AnimatePresence>
        {selectedAlbum && (
          <AlbumLogger
            album={selectedAlbum}
            onSuccess={handleLogSuccess}
            onClose={() => setSelectedAlbum(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;
