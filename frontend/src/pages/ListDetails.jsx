import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import '../styles/ListDetails.css';

function ListDetails() {
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const { listId } = useParams();
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchListDetails = async () => {
            console.log('Fetching list details for ID:', listId);
            try {
                const response = await api.get(`/api/lists/${listId}/`);
                console.log('List details response:', response.data);
                setList(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching list details:', error.response?.data || error);
                setError(error.response?.data?.error || 'Failed to fetch list details');
                setLoading(false);
            }
        };

        fetchListDetails();
    }, [listId]);

    if (loading) return <div className="loading">Loading... (List ID: {listId})</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!list) return <div className="error">No list data found</div>;

    return (
        <div className="list-details-container">
            <h2 className="list-title">{list.title}</h2>
            <p>{list.description}</p>
            <div className="album-grid">
                {list.albums && list.albums.length > 0 ? (
                    list.albums.map(album => (
                        <div key={album.id} className="album-card">
                            <img 
                                src={album.image_url || '/default-album.png'} 
                                alt={album.name}
                                onError={(e) => {
                                    e.target.src = '/default-album.png';
                                    console.log('Image failed to load:', album.image_url);
                                }}
                            />
                            <div className="album-info">
                                <h3>{album.name}</h3>
                                <p>{album.artist}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No albums in this list yet</p>
                )}
            </div>
        </div>
    );
}

export default ListDetails;