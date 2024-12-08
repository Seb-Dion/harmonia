import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Home, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles/Navbar.css';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Navbar animation variants
    const navbarVariants = {
        hidden: { y: -100 },
        visible: { 
            y: 0,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 20,
                staggerChildren: 0.1
            }
        }
    };

    // Link animation variants
    const linkVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        }
    };

    // Hover animation for links
    const hoverVariants = {
        hover: { 
            scale: 1.1,
            color: "var(--color-primary)",
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.95 }
    };

    // Logo animation
    const logoVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 20
            }
        },
        hover: {
            scale: 1.1,
            color: "var(--color-primary)",
            transition: { duration: 0.2 }
        }
    };

    return (
        <motion.nav 
            className="navbar"
            initial="hidden"
            animate="visible"
            variants={navbarVariants}
        >
            <motion.div 
                className="navbar-brand"
                variants={logoVariants}
                whileHover="hover"
            >
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    Harmonia
                </motion.h1>
            </motion.div>
            
            <div className="navbar-links">
                <motion.div variants={linkVariants}>
                    <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={hoverVariants}
                    >
                        <Link 
                            to="/" 
                            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            <Home size={20} />
                            <span>Home</span>
                        </Link>
                    </motion.div>
                </motion.div>
                
                <motion.div variants={linkVariants}>
                    <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={hoverVariants}
                    >
                        <Link 
                            to="/profile" 
                            className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}
                        >
                            <User size={20} />
                            <span>Profile</span>
                        </Link>
                    </motion.div>
                </motion.div>
                
                <motion.div variants={linkVariants}>
                    <motion.button
                        onClick={handleLogout}
                        className="navbar-link logout-button"
                        whileHover="hover"
                        whileTap="tap"
                        variants={hoverVariants}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </motion.button>
                </motion.div>
            </div>

            {/* Active page indicator */}
            <motion.div
                className="active-indicator"
                layoutId="activeIndicator"
                initial={false}
                animate={{
                    x: location.pathname === '/' ? '0%' : 
                       location.pathname === '/profile' ? '100%' : '200%'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
        </motion.nav>
    );
}

export default Navbar;