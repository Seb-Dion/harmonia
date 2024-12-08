import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Loader, Music2 } from "lucide-react";
import api from "../api/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Login.css";
import { motion, AnimatePresence } from "framer-motion";

import dark from "../assets/albums/dark.jpeg";
import thriller from "../assets/albums/thriller.jpeg";
import abbey from "../assets/albums/abbey.jpeg";
import channel from "../assets/albums/channe.png";
import discovery from "../assets/albums/discover.jpeg";
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
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/token/", { username, password });
      localStorage.setItem(ACCESS_TOKEN, response.data.access);
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
      navigate("/", { replace: true });
    } catch (error) {
      setError("Invalid username or password");
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add animation variants
  const albumVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (index) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
      },
    }),
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const formGroupVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="background">
        {ALBUM_COVERS.map((album, index) => (
          <motion.div
            key={index}
            className="album-float"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
            }}
            style={{ backgroundImage: `url(${album})` }}
          />
        ))}
      </div>

      <motion.div
        className="login-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="card-glass">
          <motion.div
            className="brand"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Music2 size={40} className="brand-icon" />
            <h1>Harmonia</h1>
          </motion.div>

          <div className="login-content">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Welcome Back
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Sign in to continue your musical journey
            </motion.p>

            <form onSubmit={handleLogin} className="login-form">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                <motion.div
                  key="username-input"
                  className="login-content"
                  variants={formGroupVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                >
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      required
                      className="form-control"
                    />
                  </div>
                </motion.div>

                <motion.div
                  key="password-input"
                  className="login-content"
                  variants={formGroupVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.6 }}
                >
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="form-control"
                    />
                  </div>
                </motion.div>

                <motion.button
                  key="submit-button"
                  type="submit"
                  className="login-button"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {loading ? (
                    <Loader className="spin-icon" size={20} />
                  ) : (
                    <>
                      <LogIn size={20} />
                      <span>Sign In</span>
                    </>
                  )}
                </motion.button>
              </AnimatePresence>
            </form>

            <motion.div
              className="login-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p>
                Don't have an account? <a href="/register">Create one</a>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Login;
