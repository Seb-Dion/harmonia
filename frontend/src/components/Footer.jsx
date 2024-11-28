import React from 'react';
import { Github, Mail, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

function Footer() {
  console.log('Footer component rendering');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Harmonia</h3>
          <p className="footer-description">
            Track your music collection, discover new music, and connect with other music lovers.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <nav className="footer-links">
            <Link to="/explore">Explore</Link>
            <Link to="/collections">Collections</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>

        <div className="footer-section">
          <h4>Connect</h4>
          <div className="social-links">
            <a href="https://github.com/Seb-Dion" target="_blank" rel="noopener noreferrer">
              <Github size={20} />
            </a>
            <a href="mailto:your@email.com">
              <Mail size={20} />
            </a>
            <a href="https://twitter.com/yourusername" target="_blank" rel="noopener noreferrer">
              <Twitter size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;