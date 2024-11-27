import React, { useState, useEffect } from "react";
import { User, Edit, Music, Save, X, Plus, Search, Loader, Heart, Logs, Pencil } from "lucide-react";
import api from "../api/api";
import "../styles/Profile.css";
import { motion, AnimatePresence } from "framer-motion";
import { searchAlbums, getFavorites, addToFavorites, removeFavorite, getRecentLogs } from '../api/albums';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [showAlbumSearch, setShowAlbumSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favoriteAlbums, setFavoriteAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState({
    totalLogs: 0,
    thisYear: 0,
    followers: 0
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching profile data...");
        const [profileRes, favoritesRes] = await Promise.all([
          api.get("/api/user/profile/"),
          getFavorites()
        ]);
        
        console.log("Profile response:", profileRes.data);
        console.log("Favorites response:", favoritesRes);
        
        setProfile(profileRes.data);
        setFavoriteAlbums(favoritesRes || []);
        setStats({
          totalLogs: profileRes.data.total_logs || 0,
          thisYear: profileRes.data.logs_this_year || 0,
          followers: profileRes.data.followers || 0
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load profile data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsData = await getRecentLogs();
        setLogs(logsData);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };
    
    fetchLogs();
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("avatar", file);
      
      try {
        await api.patch("/api/user/profile/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        const profileResponse = await api.get("/api/user/profile/");
        setProfile(profileResponse.data);
      } catch (error) {
        console.error("Failed to update avatar:", error);
        setError("Failed to update avatar");
      }
    }
  };

  const handleUpdateProfile = async () => {
    const formData = new FormData();
    formData.append("bio", bio);

    try {
      await api.patch("/api/user/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      const profileResponse = await api.get("/api/user/profile/");
      setProfile(profileResponse.data);
      setEditing(false);
    } catch (error) {
      console.error("Failed to update bio:", error);
      setError("Failed to update bio");
    }
  };

  const Favorite = async (album) => {
    try {
      console.log("Adding album to favorites:", album);
      
      if (profile?.favorite_albums?.length >= 4) {
        setError('Maximum number of favorites (4) reached');
        return;
      }
      
      await addToFavorites(album);
      
      const [profileResponse, favoritesResponse] = await Promise.all([
        api.get("/api/user/profile/"),
        getFavorites()
      ]);
      
      setProfile(profileResponse.data);
      setFavoriteAlbums(favoritesResponse || []);
      
      setShowAlbumSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      setError(null);
      
    } catch (error) {
      console.error('Failed to add favorite:', error);
      setError(error.message || 'Failed to add album to favorites');
    }
  };

  const handleRemoveFavorite = async (albumId) => {
    try {
      if (!albumId) {
        console.error('Invalid album ID:', albumId);
        setError('Cannot remove album: Invalid ID');
        return;
      }
      await removeFavorite(albumId);
      const response = await api.get("/api/user/profile/");
      setProfile(response.data);
      const favoritesResponse = await getFavorites();
      setFavoriteAlbums(favoritesResponse || []);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      setError('Failed to remove album from favorites');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setError('');
    
    try {
      const data = await searchAlbums(searchQuery);
      console.log("Search results:", data); // Debug log
      if (data.albums?.items) {
        console.log("Valid albums:", data.albums.items.filter(album => album && album.id)); // Debug log
        setSearchResults(data.albums.items);
      } else {
        setError('No albums found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.error || 'Failed to search albums');
    } finally {
      setSearchLoading(false);
    }
  };

  // Helper function to safely get album image URL
  const getAlbumImageUrl = (albumData) => {
    console.log('Getting image URL for:', albumData); // Debug log
    
    // If no album data, return default
    if (!albumData) return '/default-album-cover.png';
    
    // For search results (Spotify format)
    if (albumData.images && albumData.images.length > 0) {
      return albumData.images[0].url;
    }
    
    // For favorite albums (your backend format)
    if (albumData.image_url) {
      return albumData.image_url;
    }
    
    // Default fallback
    return '/default-album-cover.png';
  };

  // Helper function to safely get album name
  const getAlbumName = (albumData) => {
    if (!albumData) return 'Unknown Album';
    return albumData.name || 'Unknown Album';
  };

  // Helper function to safely get artist name
  const getArtistName = (albumData) => {
    if (!albumData) return 'Unknown Artist';
    
    // For search results (Spotify format)
    if (albumData.artists && albumData.artists.length > 0) {
      return albumData.artists[0].name;
    }
    
    // For favorite albums (your backend format)
    return albumData.artist || 'Unknown Artist';
  };

  const handleRecentReviews = async () => {
    const response = await api.get("/api/user/recent-reviews/");
    setRecentReviews(response.data);
  };

  if (loading) return <div>Loading...</div>;

  console.log("Current profile state:", profile);
  console.log("Current favoriteAlbums state:", favoriteAlbums);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            <img src={profile?.avatar_url || defaultAvatar} alt="Profile" />
          </div>
          <button className="avatar-edit-button" onClick={() => document.getElementById('avatar-upload').click()}>
            <Pencil size={16} />
          </button>
          <input
            type="file"
            id="avatar-upload"
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
        
        <div className="profile-info">
          <div className="username-container">
            <h1 className="profile-username">{profile?.username}</h1>
          </div>
          <div className="bio-container">
            {editing ? (
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={() => {
                  handleUpdateProfile();
                  setEditing(false);
                }}
                autoFocus
              />
            ) : (
              <>
                <p className="bio-text">{profile?.bio || "No bio yet"}</p>
                <button className="bio-edit-button" onClick={() => setEditing(true)}>
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-value">{stats.followers}</div>
            <div className="stat-label">Followers</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalLogs}</div>
            <div className="stat-label">Albums</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.thisYear}</div>
            <div className="stat-label">This Year</div>
          </div>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="profile-content">
          <div className="profile-section">
            <div className="recent-reviews">
              <h2 className="section-title">
                <Logs size={24} />
                Recent Reviews
              </h2>
              {logs
                .filter(log => log.review)
                .slice(0, 3)
                .map(log => (
                  <div key={log.id} className="review-item">
                    <img src={log.album.image_url || '/default-album-cover.png'} alt={log.album.name} className="review-album-review" />
                    <div>
                      <h3>{log.album.name}</h3>
                      <p>{log.rating}★</p>
                    </div>
                    <div className="review-content">
                      {log.review && <p className="review-text">{log.review}</p>}
                      <p className="review-date">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="profile-section">
            <h2 className="section-title">
              <Music size={24} />
              Favorite Albums
              <span className="album-count">
                ({favoriteAlbums?.length || 0}/4)
              </span>
            </h2>
            <motion.div className="favorite-albums" layout>
              <AnimatePresence mode="popLayout">
                {console.log("Current favorites:", favoriteAlbums)}
                {Array.isArray(favoriteAlbums) && favoriteAlbums.length > 0 ? (
                  favoriteAlbums.map((favorite) => (
                    <motion.div
                      key={favorite.album.spotify_id}
                      className="album-card"
                      layout
                    >
                      <img
                        src={favorite.album.image_url || '/default-album-cover.png'}
                        alt={`${favorite.album.name} by ${favorite.album.artist}`}
                        className="album-cover"
                      />
                      <div className="album-info">
                        <h3>{favorite.album.name}</h3>
                        <p>{favorite.album.artist}</p>
                      </div>
                      <motion.button
                        className="remove-favorite"
                        onClick={() => handleRemoveFavorite(favorite.album.spotify_id)}
                      >
                        <X size={16} />
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <div className="no-favorites">
                    No favorite albums yet
                  </div>
                )}
                
                {favoriteAlbums.length < 4 && (
                  <motion.button
                    key="add-favorite-button"
                    className="add-favorite-button"
                    onClick={() => setShowAlbumSearch(true)}
                  >
                    <Plus size={24} />
                    Add Favorite
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {showAlbumSearch && (
                <motion.div
                  key="search-modal"
                  className="album-search-modal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="modal-content"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", damping: 25 }}
                  >
                    <div className="modal-header">
                      <h3>Search Albums</h3>
                      <button
                        className="close-button"
                        onClick={() => {
                          setShowAlbumSearch(false);
                          setSearchResults([]);
                          setSearchQuery("");
                        }}
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <form onSubmit={handleSearch} className="search-form">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for albums..."
                      />
                      <button type="submit">
                        <Search size={20} />
                      </button>
                    </form>

                    <div className="search-results">
                      {searchLoading ? (
                        <div className="loading">Searching...</div>
                      ) : Array.isArray(searchResults) && searchResults.length > 0 ? (
                        searchResults
                          .filter(album => album && album.id)
                          .map((album) => (
                            <div
                              key={`search-${album.id}-${Date.now()}`}
                              className="search-result-item"
                            >
                              <img
                                src={getAlbumImageUrl(album)}
                                alt={getAlbumName(album)}
                                onError={(e) => {
                                  e.target.src = "/default-album-cover.png";
                                }}
                              />
                              <div className="result-info">
                                <h4>{getAlbumName(album)}</h4>
                                <p>{getArtistName(album)}</p>
                              </div>
                              <button
                                className="add-button"
                                onClick={() => handleAddFavorite(album)}
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                          ))
                      ) : (
                        <div className="no-results">
                          {searchQuery.trim()
                            ? "No albums found"
                            : "Search for albums to add to your favorites"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="activity-section">
          <div className="activity-grid">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map(log => (
                <div key={log.id} className="album-card">
                  <img 
                    src={log.album?.image_url || '/default-album-cover.png'} 
                    alt={log.album?.name || 'Album cover'} 
                    className="album-cover"
                  />
                  <div className="album-info">
                    <h3>{log.album?.name || 'Unknown Album'}</h3>
                    <p>{log.album?.artist || 'Unknown Artist'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                No listening activity yet
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'favorites' && (
        <div className="favorites-section">
          <div className="activity-grid">
            {favoriteAlbums && favoriteAlbums.length > 0 ? (
              favoriteAlbums.map(favorite => (
                <div key={favorite.album.spotify_id} className="album-card">
                  <img 
                    src={favorite.album.image_url || '/default-album-cover.png'} 
                    alt={favorite.album.name} 
                    className="album-cover"
                  />
                  <div className="album-info">
                    <h3>{favorite.album.name}</h3>
                    <p>{favorite.album.artist}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-favorites">
                No favorite albums yet
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default Profile;
