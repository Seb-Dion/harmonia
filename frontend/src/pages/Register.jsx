import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Loader, Music2 } from "lucide-react";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Login.css";


const albumImages = import.meta.glob('../assets/albums/*.{png,jpg,jpeg}', { eager: true });

// Array of popular album covers
const ALBUM_COVERS = Object.values(albumImages).map(module => module.default);

function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        setLoading(true);

        try {
            // First, register the user
            await api.post("/api/user/register/", { 
                username, 
                password 
            });

            // Then, login to get the tokens
            alert("User registered successfully!");
            
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Register failed:", error);
            alert("Failed to register. Please try again.");
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
                        <h2>Let's get you started</h2>
                        <p>Create an account to start your musical journey</p>

                        <form onSubmit={handleRegister} className="login-form">
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

                            <div className="form-group">
                                <div className="input-wrapper">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm Password"
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
                                        <span>Register</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="login-footer">
                            <p>Already have an account? <a href="/login">Sign in</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;