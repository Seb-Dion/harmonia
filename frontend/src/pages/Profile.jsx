import React, { useState, useEffect } from "react";
import { User, Edit, Music, Save, X, Plus, Search, Loader, Heart } from "lucide-react";
import api from "../api/api";
import "../styles/Profile.css";
import { motion, AnimatePresence } from "framer-motion";
import { searchAlbums, getFavorites, addToFavorites, removeFavorite } from '../api/albums';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching profile and favorites...");
        const profileRes = await api.get("/api/user/profile/");
        console.log("Profile response:", profileRes.data);
        
        setProfile(profileRes.data);
        setFavoriteAlbums(profileRes.data.favorite_albums || []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load profile data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("bio", bio);
    if (avatar) {
      formData.append("avatar", avatar);
    }

    try {
      console.log('Sending form data:', {
        bio: bio,
        avatar: avatar,
        formDataEntries: Array.from(formData.entries())
      });

      const response = await api.patch("/api/user/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log('Profile update response:', response.data);
      
      const [profileResponse, favoritesResponse] = await Promise.all([
        api.get("/api/user/profile/"),
        getFavorites()
      ]);
      
      setProfile(profileResponse.data);
      setFavoriteAlbums(favoritesResponse || []);
      setEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("Failed to update profile");
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected avatar file:', file); // Debug log
      setAvatar(file);
    }
  };

  const handleAlbumSearch = async (query) => {
    try {
      const response = await api.get(`/api/spotify/search/?q=${encodeURIComponent(query)}`);
      if (response.data.albums?.items) {
        setSearchResults(response.data.albums.items);
      } else {
        setError('No albums found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.error || 'Failed to search albums');
    }
  };

  const handleAddFavorite = async (album) => {
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

  const handleAddToFavorites = async (album) => {
    try {
      await addToFavorites(album);
      await fetchFavoriteAlbums(); // Refresh the favorites list
    } catch (error) {
      console.error('Failed to add favorite:', error);
      setError('Failed to add album to favorites');
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

  const getImageUrl = (favorite) => {
    console.log('Favorite album data:', favorite.album); // Add this debug log
    return favorite.album?.image_url || '/default-album-cover.png';
  };

  const handleShowAlbumSearch = () => {
    if (profile?.favorite_albums?.length >= 4) {
      setError('Maximum number of favorites (4) reached');
      return;
    }
    setShowAlbumSearch(true);
    setError(null);
  };

  if (loading) return <div>Loading...</div>;

  console.log("Current profile state:", profile);
  console.log("Current favoriteAlbums state:", favoriteAlbums);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" />
          ) : (
            <User size={64} />
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{profile?.username}</h1>
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">{profile?.followers_count || 0}</div>
              <div className="stat-label">Followers</div>
            </div>
          </div>
          {!editing && (
            <button className="edit-button" onClick={() => setEditing(true)}>
              <Edit size={20} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          {editing ? (
            <form className="edit-form" onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Profile Picture</label>
                <input
                  type="file"
                  onChange={handleAvatarChange}
                  accept="image/*"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  <Save size={20} />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setBio(profile?.bio || "");
                  }}
                  className="cancel-button"
                >
                  <X size={20} />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="section-title">
                <User size={24} />
                Bio
              </h2>
              <p className="bio-text">
                {profile?.bio ? profile.bio : "No bio yet"}
              </p>
            </>
          )}
        </div>

        <div className="profile-section">
          <h2 className="section-title">
            <Music size={24} />
            Favorite Albums
            <span className="album-count">
              ({profile?.favorite_albums?.length || 0}/4)
            </span>
          </h2>
          <motion.div className="favorite-albums" layout>
            <AnimatePresence mode="popLayout">
              {console.log("Current favorites:", favoriteAlbums)}
              {Array.isArray(favoriteAlbums) && favoriteAlbums.length > 0 ? (
                favoriteAlbums.map((favorite) => (
                  <motion.div
                    key={`favorite-${favorite.album.spotify_id}`}
                    className="album-card"
                    layout
                  >
                    <motion.img
                      src={favorite.album.image_url || '/default-album-cover.png'}
                      alt={`${favorite.album.name} by ${favorite.album.artist}`}
                      className="album-cover"
                    />
                    <motion.div className="album-info">
                      <h3>{favorite.album.name}</h3>
                      <p>{favorite.album.artist}</p>
                    </motion.div>
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

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default Profile;
