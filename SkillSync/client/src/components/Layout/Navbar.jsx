import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout failed', err);
        } finally {
            logout();
            navigate('/login');
        }
    };

    const isActive = (path) => location.pathname.startsWith(path);

    const navLinkStyle = (path) => ({
        textDecoration: 'none',
        color: isActive(path) ? 'var(--color-primary)' : 'var(--color-secondary)',
        fontWeight: isActive(path) ? '600' : '500',
        fontSize: '0.875rem',
        transition: 'color 0.2s',
        padding: '0.3rem 0',
        borderBottom: isActive(path) ? '2px solid var(--color-accent)' : '2px solid transparent',
    });

    const getDashboardPath = () => {
        if (!user) return '/dashboard';
        return `/dashboard/${user.role}`;
    };

    return (
        <nav style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '0.85rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                {/* Brand */}
                <Link to="/" style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    letterSpacing: '-0.025em',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span style={{ fontSize: '1.6rem' }}>❖</span> SkillSync.
                </Link>

                {/* Navigation Links */}
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>

                    {user ? (
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            {/* Common link for all logged-in users */}
                            <Link to="/gigs" style={navLinkStyle('/gigs')}>
                                Opportunities
                            </Link>

                            <Link to="/volunteering" style={navLinkStyle('/volunteering')}>
                                Volunteering
                            </Link>

                            <div style={{ width: '1px', height: '20px', background: '#E2E8F0' }}></div>

                            <Link to={getDashboardPath()} style={navLinkStyle('/dashboard')}>
                                Dashboard
                            </Link>

                            {/* User info + logout */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: '50%',
                                        background: user.role === 'organizer'
                                            ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                                            : user.role === 'admin'
                                                ? 'linear-gradient(135deg, #374151, #1F2937)'
                                                : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                    }}>
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                </Link>

                                <button onClick={handleLogout} style={{
                                    background: 'none',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.35rem 0.75rem',
                                    color: 'var(--color-error)',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.2s',
                                    fontFamily: 'var(--font-sans)'
                                }}>Sign Out</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <Link to="/login" style={{
                                color: 'var(--color-secondary)',
                                fontWeight: '500',
                                textDecoration: 'none',
                                fontSize: '0.875rem'
                            }}>Log In</Link>
                            <Link to="/signup" className="btn btn-primary" style={{
                                padding: '0.45rem 1.1rem',
                                fontSize: '0.85rem',
                            }}>
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
