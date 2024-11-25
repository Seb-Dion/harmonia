import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Loader, Music2 } from "lucide-react";
import api from "../api/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Login.css";

const albumImages = import.meta.glob("../assets/albums/*.{png,jpg,jpeg}", {
  eager: true,
});
const ALBUM_COVERS = Object.values(albumImages).map((module) => module.default);

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
        password,
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
              Let's get you started
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Create an account to start your musical journey
            </motion.p>

            <form onSubmit={handleRegister} className="login-form">
              <AnimatePresence>
                <motion.div
                  className="form-group"
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
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="form-group"
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
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="form-group"
                  variants={formGroupVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.7 }}
                >
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
                </motion.div>

                <motion.button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {loading ? (
                    <Loader className="spin-icon" size={20} />
                  ) : (
                    <>
                      <LogIn size={20} />
                      <span>Register</span>
                    </>
                  )}
                </motion.button>
              </AnimatePresence>
            </form>

            <motion.div
              className="login-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p>
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Register;
