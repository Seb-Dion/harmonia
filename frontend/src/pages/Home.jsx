import { useState } from 'react';
import api from '../api';
import '../styles/Home.css';

function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);

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
        <div className="min-h-screen bg-gray-100">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-8">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Harmonia</h1>
                    <p className="text-lg opacity-90">Discover and track your favorite albums</p>
                </div>
            </div>

            {/* Search Section */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for albums..."
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                            />
                            <button 
                                type="submit"
                                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Searching...
                                    </span>
                                ) : 'Search'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {albums.map((album) => (
                        <div 
                            key={album.id} 
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                        >
                            {album.image_url && (
                                <img 
                                    src={album.image_url} 
                                    alt={album.name}
                                    className="albumCover"
                                />
                            )}
                            <div className="p-4">
                                <h3 className="font-semibold text-lg mb-1 truncate" title={album.name}>
                                    {album.name}
                                </h3>
                                <p className="text-gray-600 mb-2">{album.artist}</p>
                                <div className="text-sm text-gray-500 space-y-1">
                                    <p>Released: {album.release_date}</p>
                                    <p>Tracks: {album.total_tracks}</p>
                                </div>
                                {album.external_url && (
                                    <a 
                                        href={album.external_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-block text-green-500 hover:text-green-600 transition-colors duration-200"
                                    >
                                        Open in Spotify →
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {albums.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12">
                        <p className="text-lg">Search for albums to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;