import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer = () => {
    const { user } = useAuth(); // If no user is logged in, this will be null

    return (
        <footer className="footer-modern">
            <div className="container">
                <div className="footer-grid">
                    
                    {/* Brand & Mission Column */}
                    <div className="footer-brand">
                        <h2 className="footer-logo">SkillSync</h2>
                        <p className="footer-tagline">
                            Where Ambition Meets Opportunity. Building the academic portfolios of tomorrow through verified volunteering and freelance gigs.
                        </p>
                    </div>

                    {/* Quick Links Column */}
                    <div className="footer-links">
                        <h3 className="footer-heading">Platform</h3>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/gigs">Opportunities</Link></li>
                            <li><Link to="/volunteering">Volunteering</Link></li>
                        </ul>
                    </div>

                    {/* Support & Legal Column */}
                    <div className="footer-links">
                        <h3 className="footer-heading">Support</h3>
                        <ul>
                            <li><Link to="/faq">FAQ</Link></li>
                            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                            <li><Link to="/terms-of-service">Terms of Service</Link></li>
                            {user && <li><Link to="/messages">Contact Admin</Link></li>}
                        </ul>
                    </div>

                    {/* Contact Us Column (Dynamic based on Auth) */}
                    <div className="footer-contact">
                        <h3 className="footer-heading">Contact Us</h3>
                        
                        {!user ? (
                            <div className="footer-admin-contact">
                                <p>For inquiries, support, or help navigating the platform, please reach out directly to our administration team.</p>
                                <a 
                                    href="mailto:skillsyncplatformservice@gmail.com" 
                                    className="btn btn-outline footer-mailto-btn"
                                >
                                    Email Admin
                                </a>
                            </div>
                        ) : (
                            <div className="footer-user-contact">
                                <p>Need assistance? Contact support through the application inbox or reach your institution organizer directly.</p>
                            </div>
                        )}
                        
                    </div>

                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} SkillSync. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
