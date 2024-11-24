import React,{ useState, useEffect } from 'react';
import { Search, Music, Calendar, ExternalLink, Loader, User } from 'lucide-react';
import api from '../api';
import '../styles/Home.css';

function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/api/user/profile/');
                setProfile(response.data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        };

        fetchProfile();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        try {
            const response = await api.get(`/api/spotify/albums/`, {
                params: { query: searchQuery.trim() }
            });
            setAlbums(response.data.albums);
        } catch (error) {
            console.error('Album search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-container">
            <header className="header">
                <h1>Welcome, {profile?.username || 'User'}!</h1>
            </header>

            <div className="search-container">
                <form className="search-form" onSubmit={handleSearch}>
                    <div className="search-input-wrapper">
                        {!searchQuery && <Search size={16} className="search-icon" />}
                        <input
                            type="text"
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="     Search for albums..."
                        />
                    </div>
                    <button type="submit" className="search-button" disabled={loading}>
                        {loading ? (
                            <Loader className="spin-icon" size={20} />
                        ) : (
                            <>
                                <Search size={20} />
                                <span>Search</span>
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="album-grid">
                {albums.map((album) => (
                    <div key={album.id} className="album-card">
                        <img src={album.image_url} alt={album.name} className="album-cover" />
                        <div className="album-info">
                            <h3 className="album-name">
                                <Music size={16} className="info-icon" />
                                {album.name}
                            </h3>
                            <p className="album-artist">
                                <User size={16} className="info-icon" />
                                {album.artist}
                            </p>
                            <p className="album-release">
                                <Calendar size={16} className="info-icon" />
                                Released: {album.release_date}
                            </p>
                            {album.external_url && (
                                <a 
                                    href={album.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="spotify-link"
                                >
                                    <ExternalLink size={16} />
                                    <span>Open in Spotify</span>
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;