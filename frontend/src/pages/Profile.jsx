import React, { useState, useEffect } from 'react';
import { User, Edit, Music, Save, X, Plus, Search } from 'lucide-react';
import api from '../api';
import '../styles/Profile.css';

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [showAlbumSearch, setShowAlbumSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/api/user/profile/');
            console.log('Profile data:', response.data); // Debug log
            setProfile(response.data);
            setBio(response.data.bio || '');
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('bio', bio);
        if (avatar) {
            formData.append('avatar', avatar);
        }

        try {
            const response = await api.put('/api/user/profile/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setProfile(response.data);
            setEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    const handleAlbumSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return; // Don't search if query is empty
        
        setSearchLoading(true);
        try {
            const response = await api.get(`/api/spotify/albums/?query=${searchQuery}`);
            console.log('API Response:', response.data); // Debug log
            
            // Ensure we're getting an array
            let albums = [];
            if (Array.isArray(response.data)) {
                albums = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                albums = response.data.results;
            } else if (response.data.albums && Array.isArray(response.data.albums)) {
                albums = response.data.albums;
            }
            
            setSearchResults(albums);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddFavorite = async (album) => {
        try {
            // Debug log the album data
            console.log('Album data to be sent:', album);

            // Make sure we have all required data
            const favoriteData = {
                spotify_id: album.id || album.spotify_id, // Handle both possible field names
                name: album.name,
                artist: album.artists?.[0]?.name || album.artist, // Handle both possible structures
                image_url: album.images?.[0]?.url || album.image_url // Handle both possible structures
            };

            // Validate data before sending
            const missingFields = Object.entries(favoriteData)
                .filter(([_, value]) => !value)
                .map(([key]) => key);

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            console.log('Sending favorite data:', favoriteData);

            const response = await api.post('/api/user/favorites/', favoriteData);
            console.log('Add favorite response:', response.data);

            // Show success message
            alert('Album added to favorites!');

            // Refresh profile and reset search
            await fetchProfile();
            setShowAlbumSearch(false);
            setSearchQuery('');
            setSearchResults([]);

        } catch (error) {
            console.error('Failed to add favorite:', error);
            console.error('Error response:', error.response?.data);
            
            // Show appropriate error message
            const errorMessage = error.response?.data?.error 
                || error.message 
                || 'Failed to add favorite album';
            
            alert(errorMessage);
        }
    };

    const handleRemoveFavorite = async (albumId) => {
        try {
            await api.delete(`/api/user/favorites/${albumId}/`);
            fetchProfile();
        } catch (error) {
            console.error('Failed to remove favorite:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

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
                                    onChange={(e) => setAvatar(e.target.files[0])}
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
                                        setBio(profile?.bio || '');
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
                                {profile?.bio ? profile.bio : 'No bio yet'}
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
                    <div className="favorite-albums">
                        {profile?.favorite_albums?.map((album) => (
                            <div key={album.spotify_id} className="album-card">
                                <img src={album.image_url} alt={album.name} className="album-cover" />
                                <div className="album-info">
                                    <h3 className="album-title">{album.name}</h3>
                                    <p className="album-artist">{album.artist}</p>
                                </div>
                                <button 
                                    className="remove-favorite"
                                    onClick={() => handleRemoveFavorite(album.spotify_id)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        
                        {(!profile?.favorite_albums || profile.favorite_albums.length < 4) && (
                            <button 
                                className="add-favorite-button"
                                onClick={() => setShowAlbumSearch(true)}
                            >
                                <Plus size={24} />
                                Add Favorite
                            </button>
                        )}
                    </div>

                    {showAlbumSearch && (
                        <div className="album-search-modal">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>Search Albums</h3>
                                    <button 
                                        className="close-button"
                                        onClick={() => {
                                            setShowAlbumSearch(false);
                                            setSearchResults([]);
                                            setSearchQuery('');
                                        }}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                <form onSubmit={handleAlbumSearch} className="search-form">
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
                                        searchResults.map((album) => (
                                            <div key={album.spotify_id || album.id} className="search-result-item">
                                                <img 
                                                    src={album.image_url} 
                                                    alt={album.name} 
                                                    onError={(e) => {
                                                        e.target.src = 'path/to/fallback/image.jpg'; // Add a fallback image
                                                    }}
                                                />
                                                <div className="result-info">
                                                    <h4>{album.name}</h4>
                                                    <p>{album.artist}</p>
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
                                                ? 'No albums found' 
                                                : 'Search for albums to add to your favorites'
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;