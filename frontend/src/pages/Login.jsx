import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Loader, Music2 } from "lucide-react";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Login.css";

import dark from '../assets/albums/dark.jpeg';
import thriller from '../assets/albums/thriller.jpeg';
import abbey from '../assets/albums/abbey.jpeg';
import channel from '../assets/albums/channe.png';
import discovery from '../assets/albums/discover.jpeg';
import sour from "../assets/albums/sour.jpeg";
import mis from "../assets/albums/mis.jpeg";
import black from "../assets/albums/black.jpeg";
import ziggy from "../assets/albums/ziggy.jpeg";

// Array of popular album covers
const ALBUM_COVERS = [
    dark,
    thriller,
    abbey,
    channel,
    discovery,
    sour,
    mis,
    black,
    ziggy,
    // Add more album covers as needed
];

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post("/api/token/", { username, password });
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="background">
                {ALBUM_COVERS.map((album, index) => (
                    <div 
                        key={index} 
                        className="album-float"
                        style={{
                            backgroundImage: `url(${album})`,
                            animationDelay: `${index * 2}s`
                        }}
                    />
                ))}
            </div>

            <div className="login-card">
                <div className="card-glass">
                    <div className="brand">
                        <Music2 size={40} className="brand-icon" />
                        <h1>Harmonia</h1>
                    </div>

                    <div className="login-content">
                        <h2>Welcome Back</h2>
                        <p>Sign in to continue your musical journey</p>

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="login-button" disabled={loading}>
                                {loading ? (
                                    <Loader className="spin-icon" size={20} />
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        <span>Sign In</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-footer">
                            <p>Don't have an account? <a href="/register">Create one</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;