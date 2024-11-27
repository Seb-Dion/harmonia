import api from './api';  // Update this import to match your file structure

// Function to search albums
export const searchAlbums = async (query) => {
    try {
        console.log('Searching with query:', query);
        
        const response = await api.get(`/api/spotify/search/?q=${encodeURIComponent(query)}`);
        console.log('Raw search response:', response.data);

        // Transform Spotify tracks into the format we need
        if (response.data && response.data.tracks && response.data.tracks.items) {
            // Use a Map to deduplicate albums by ID
            const albumMap = new Map();
            
            response.data.tracks.items.forEach(track => {
                if (!albumMap.has(track.album.id)) {
                    albumMap.set(track.album.id, {
                        id: track.album.id,
                        name: track.album.name,
                        artists: track.album.artists,
                        images: track.album.images,
                        release_date: track.album.release_date,
                        external_urls: track.album.external_urls,
                        genres: track.album.genres || []
                    });
                }
            });
            
            const albums = Array.from(albumMap.values());
            console.log('Transformed albums:', albums);
            return { albums: { items: albums } };
        }
        
        console.error('Unexpected response structure:', response.data);
        throw new Error('Invalid response from search');
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
};

// Function to log an album
export const logAlbum = async (albumData) => {
    try {
        console.log("Received album data:", albumData);
        
        // Format the release date
        let releaseDate = albumData.release_date;
        if (releaseDate.length === 4) { // YYYY
            releaseDate = `${releaseDate}-01-01`;
        } else if (releaseDate.length === 7) { // YYYY-MM
            releaseDate = `${releaseDate}-01`;
        }

        // First, ensure the album exists in the database
        const albumPayload = {
            spotify_id: albumData.spotify_id,
            name: albumData.name,
            artist: albumData.artist,
            image_url: albumData.image_url || '',
            release_date: releaseDate,
            external_url: albumData.external_url || '',
            genres: albumData.genres || ''
        };

        console.log("Creating/updating album with exact payload:", JSON.stringify(albumPayload, null, 2));
        
        // Create or get the album
        const albumResponse = await api.post('/api/albums/create/', albumPayload);
        const album = albumResponse.data;

        console.log("Album created/retrieved:", album);

        // Now create the log
        const logPayload = {
            album_id: album.id,
            rating: parseInt(albumData.rating),
            review: albumData.review || '',
            favorite_tracks: albumData.favorite_tracks || '',
            relisten: Boolean(albumData.relisten),
            listen_date: new Date().toISOString().split('T')[0]
        };

        console.log("Creating log with payload:", logPayload);
        
        const response = await api.post('/api/logs/', logPayload);
        return response.data;
    } catch (error) {
        console.error("Error details:", error.response?.data);
        console.error("Full error object:", error);
        throw error;
    }
};

// Function to add album to favorites
export const addToFavorites = async (albumData) => {
    try {
        console.log('Raw album data received:', albumData);
        
        // Format the release date from Spotify's format
        let releaseDate = albumData.release_date;
        if (!releaseDate) {
            throw new Error('Release date is required');
        }
        
        // Handle different Spotify date formats
        if (releaseDate.length === 4) { // YYYY
            releaseDate = `${releaseDate}-01-01`;
        } else if (releaseDate.length === 7) { // YYYY-MM
            releaseDate = `${releaseDate}-01`;
        }
        
        const payload = {
            spotify_id: albumData.id,
            name: albumData.name,
            artist: albumData.artists[0].name,
            image_url: albumData.images?.[0]?.url || '',
            release_date: releaseDate,
            external_url: albumData.external_urls?.spotify || '',
            genres: albumData.genres?.join(',') || ''
        };

        console.log('Sending payload to server:', payload);
        
        const response = await api.post('/api/favorites/add/', payload);
        console.log('Server response:', response.data);
        
        if (response.status === 201) {
            return response.data;
        } else {
            throw new Error(response.data.error || 'Failed to add favorite');
        }
    } catch (error) {
        console.error('Error in addToFavorites:', error.response?.data || error);
        throw new Error(error.response?.data?.error || error.message);
    }
};

// Function to remove album from favorites
export const removeFavorite = async (albumId) => {
    try {
        await api.delete(`/api/favorites/${albumId}/`);
    } catch (error) {
        throw error;
    }
};

// Function to get user's favorite albums
export const getFavorites = async () => {
    try {
        const response = await api.get('/api/favorites/');
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Function to get recent logs
export const getRecentLogs = async () => {
    try {
        const response = await api.get('/api/logs/');
        console.log('Raw logs response:', response.data); // Debug log
        
        // Filter out any invalid logs
        const validLogs = response.data.filter(log => 
            log && 
            log.album && 
            typeof log.album === 'object' && 
            log.album.name
        );
        
        console.log('Filtered valid logs:', validLogs); // Debug log
        return validLogs;
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
};

// Function to get a specific log
export const getLog = async (logId) => {
    try {
        const response = await api.get(`/api/logs/${logId}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Function to update a log
export const updateLog = async (logId, updateData) => {
    try {
        const response = await api.put(`/api/logs/${logId}/`, updateData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Function to delete a log
export const deleteLog = async (logId) => {
    try {
        await api.delete(`/api/logs/${logId}/`);
    } catch (error) {
        throw error;
    }
};

// Function to get user's lists
export const getUserLists = async () => {
    try {
        const response = await api.get('/api/lists/');
        return response.data;
    } catch (error) {
        console.error('Error fetching lists:', error);
        throw error;
    }
};

// Function to create a new list
export const createList = async (listData) => {
    try {
        console.log('Creating list with data:', listData);
        const response = await api.post('/api/lists/', listData);
        return response.data;
    } catch (error) {
        console.error('Error creating list:', error.response?.data || error);
        throw error;
    }
};

// Function to update a list
export const updateList = async (listId, updateData) => {
    try {
        console.log(`Updating list ${listId} with data:`, updateData);
        const response = await api.patch(`/api/lists/${listId}/`, updateData);
        return response.data;
    } catch (error) {
        console.error('Error updating list:', error.response?.data || error);
        throw error;
    }
};

// Function to delete a list
export const deleteList = async (listId) => {
    try {
        await api.delete(`/api/lists/${listId}/`);
    } catch (error) {
        console.error('Error deleting list:', error.response?.data || error);
        throw error;
    }
};

// Function to add album to a list
export const addAlbumToList = async (listId, albumData) => {
    try {
        console.log('Adding album to list:', { listId, albumData }); // Debug log
        const response = await api.post(`/api/lists/${listId}/albums/`, albumData);
        console.log('Response:', response.data); // Debug log
        return response.data;
    } catch (error) {
        console.error('Error adding album to list:', error.response?.data || error);
        throw error;
    }
};

// Function to remove album from a list
export const removeAlbumFromList = async (listId, albumId) => {
    try {
        await api.delete(`/api/lists/${listId}/albums/${albumId}/`);
    } catch (error) {
        console.error('Error removing album from list:', error.response?.data || error);
        throw error;
    }
};

// Function to get albums in a list
export const getListAlbums = async (listId) => {
    try {
        const response = await api.get(`/api/lists/${listId}/albums/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching list albums:', error.response?.data || error);
        throw error;
    }
};
