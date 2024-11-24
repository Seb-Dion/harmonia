import { useNavigate } from 'react-router-dom';
import { Search, User, LogOut } from 'lucide-react';
import '../styles/Navbar.css';

function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <h1>Harmonia</h1>
            </div>
            
            <div className="navbar-links">
                <a href="/" className="navbar-link">
                    <Search size={20} />
                    <span>Search</span>
                </a>
                
                <a href="/profile" className="navbar-link">
                    <User size={20} />
                    <span>Profile</span>
                </a>
                
                <button onClick={handleLogout} className="navbar-link logout-button">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;