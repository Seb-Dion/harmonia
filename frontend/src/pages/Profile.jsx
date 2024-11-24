import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/Profile.css';

function Profile() {
    const [user, setUser] = useState('User');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const response = await api.get('/api/user/profile/');
            setUser(response.data.username);
        };
    }, []);


}

export default Profile;