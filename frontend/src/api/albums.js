import api from './api';  // Update this import to match your file structure

// Function to search albums
export const searchAlbums = async (query) => {
    try {
        const response = await api.get(`/api/spotify/search/?q=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Function to log an album
export const logAlbum = async (albumData) => {
    try {
        const response = await api.post('/api/logs/', albumData);
        return response.data;
    } catch (error) {
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
