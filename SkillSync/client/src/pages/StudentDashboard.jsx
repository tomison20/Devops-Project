import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('opportunities');
    const [opportunities, setOpportunities] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [stats, setStats] = useState({ totalHours: 0, completedActivities: 0, contributionScore: 0 });
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const [editingPortfolio, setEditingPortfolio] = useState(null);
    const [editingAchievement, setEditingAchievement] = useState(null);

    // Form states
    const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', link: '', projectLink: '', image: '' });
    const [achievementForm, setAchievementForm] = useState({ title: '', description: '', date: '', certificateLink: '' });
    const [pdfFile, setPdfFile] = useState(null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [oppsRes, appsRes, portRes, achRes, statsRes, profileRes] = await Promise.all([
                    api.get('/gigs'),
                    api.get('/gigs/my-applications'),
                    api.get('/portfolios'),
                    api.get('/achievements'),
                    api.get('/participation/stats'),
                    api.get('/auth/profile')
                ]);
                setOpportunities(oppsRes.data.filter(g => g.status === 'open'));
                setMyApplications(appsRes.data);
                setPortfolio(portRes.data);
                setAchievements(achRes.data);
                setStats(statsRes.data);
                setUserProfile(profileRes.data);
            } catch (error) {
                console.error('Student dashboard fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Portfolio CRUD
    const openPortfolioModal = (item = null) => {
        if (item) {
            setEditingPortfolio(item);
            setPortfolioForm({ title: item.title, description: item.description || '', link: item.link || '', projectLink: item.projectLink || '', image: item.image || '' });
        } else {
            setEditingPortfolio(null);
            setPortfolioForm({ title: '', description: '', link: '', projectLink: '', image: '' });
            setPdfFile(null);
        }
        setShowPortfolioModal(true);
    };

    const handlePortfolioSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', portfolioForm.title);
            formData.append('description', portfolioForm.description);
            formData.append('link', portfolioForm.link);
            formData.append('projectLink', portfolioForm.projectLink);
            formData.append('image', portfolioForm.image);
            if (pdfFile) formData.append('portfolioPDF', pdfFile);

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            if (editingPortfolio) {
                const { data } = await api.put(`/portfolios/${editingPortfolio._id}`, formData, config);
                setPortfolio(portfolio.map(p => p._id === editingPortfolio._id ? data : p));
            } else {
                const { data } = await api.post('/portfolios', formData, config);
                setPortfolio([data, ...portfolio]);
            }
            setShowPortfolioModal(false);
            setPdfFile(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save project');
        }
    };

    const handleDeletePortfolio = async (id) => {
        if (!window.confirm('Delete this project?')) return;
        try {
            await api.delete(`/portfolios/${id}`);
            setPortfolio(portfolio.filter(p => p._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete');
        }
    };

    // Achievement CRUD
    const openAchievementModal = (item = null) => {
        if (item) {
            setEditingAchievement(item);
            setAchievementForm({ title: item.title, description: item.description || '', date: item.date ? item.date.split('T')[0] : '', certificateLink: item.certificateLink || '' });
        } else {
            setEditingAchievement(null);
            setAchievementForm({ title: '', description: '', date: '', certificateLink: '' });
        }
        setShowAchievementModal(true);
    };

    const handleAchievementSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAchievement) {
                const { data } = await api.put(`/achievements/${editingAchievement._id}`, achievementForm);
                setAchievements(achievements.map(a => a._id === editingAchievement._id ? data : a));
            } else {
                const { data } = await api.post('/achievements', achievementForm);
                setAchievements([data, ...achievements]);
            }
            setShowAchievementModal(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save achievement');
        }
    };

    const handleDeleteAchievement = async (id) => {
        if (!window.confirm('Delete this achievement?')) return;
        try {
            await api.delete(`/achievements/${id}`);
            setAchievements(achievements.filter(a => a._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete');
        }
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="loader"></div>
            <p>Loading your dashboard...</p>
        </div>
    );

    const tabs = [
        { id: 'opportunities', label: '🎯 Opportunities', count: opportunities.length },
        { id: 'applications', label: '📋 My Applications', count: myApplications.length },
        { id: 'portfolio', label: '💼 Portfolio', count: portfolio.length },
        { id: 'achievements', label: '🏆 Achievements', count: achievements.length },
    ];

    return (
        <div className="student-dashboard animate-fade-in">
            {/* Header */}
            <div className="dashboard-header student-header">
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {user?.organization?.name} • Student Portal
                            </p>
                            <h1 style={{ color: 'white', fontSize: '2.25rem', margin: 0 }}>
                                Welcome back, {user?.name?.split(' ')[0]}
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                                {user?.headline || 'Build your academic portfolio and grow your skills'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Link to="/gigs" className="btn btn-accent" style={{ color: 'white' }}>
                                Browse All Opportunities
                            </Link>
                            <Link to="/dashboard/student/profile" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>
                                Edit Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="dashboard-body">
                <div className="container">
                    {/* Stats Row */}
                    <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                        <div className="card stat-card animate-slide-up stagger-1">
                            <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{stats.totalHours}h</div>
                            <div className="stat-label">Contribution Hours</div>
                        </div>
                        <div className="card stat-card animate-slide-up stagger-2">
                            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.completedActivities}</div>
                            <div className="stat-label">Activities Completed</div>
                        </div>
                        <div className="card stat-card animate-slide-up stagger-3">
                            <div className="stat-value" style={{ color: '#7C3AED' }}>{stats.contributionScore}</div>
                            <div className="stat-label">SkillSync Score</div>
                        </div>
                    </div>

                    {/* Profile Card with Social Icons */}
                    {userProfile && (
                        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3B82F6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 }}>
                                    {userProfile.name?.charAt(0)}
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{userProfile.name}</h3>
                                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ Verified Student</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                        {userProfile.headline || userProfile.role?.toUpperCase()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                    {userProfile.github && (
                                        <a href={userProfile.github} target="_blank" rel="noreferrer" title="GitHub" style={{ color: '#1E293B', transition: 'color 0.2s' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                        </a>
                                    )}
                                    {userProfile.linkedin && (
                                        <a href={userProfile.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" style={{ color: '#0A66C2', transition: 'color 0.2s' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                        </a>
                                    )}
                                    {userProfile.twitter && (
                                        <a href={userProfile.twitter} target="_blank" rel="noreferrer" title="Twitter/X" style={{ color: '#1E293B', transition: 'color 0.2s' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                        </a>
                                    )}
                                    {userProfile.portfolioWebsite && (
                                        <a href={userProfile.portfolioWebsite} target="_blank" rel="noreferrer" title="Portfolio Website" style={{ color: '#059669', transition: 'color 0.2s' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Tabs */}
                    <div className="tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                                <span style={{
                                    marginLeft: '0.4rem',
                                    background: activeTab === tab.id ? '#DBEAFE' : '#F1F5F9',
                                    color: activeTab === tab.id ? '#1E40AF' : '#64748B',
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                }}>{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fade-in" key={activeTab}>

                        {/* OPPORTUNITIES TAB */}
                        {activeTab === 'opportunities' && (
                            <div>
                                {opportunities.length > 0 ? (
                                    <div className="grid-layout">
                                        {opportunities.map(gig => (
                                            <div key={gig._id} className="card opp-card card-interactive">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{gig.title}</h3>
                                                    <span className="badge badge-success">Open</span>
                                                </div>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {gig.description}
                                                </p>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                                    <span>📅 {new Date(gig.deadline).toLocaleDateString()}</span>
                                                    <span>By {gig.organizer?.name}</span>
                                                </div>
                                                {gig.skillsRequired?.length > 0 && (
                                                    <div className="opp-skills">
                                                        {gig.skillsRequired.slice(0, 4).map((skill, i) => (
                                                            <span key={i} className="skill-tag">{skill}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                <Link to={`/gigs/${gig._id}`} className="btn btn-outline btn-block" style={{ marginTop: '1rem', textDecoration: 'none' }}>
                                                    View & Apply →
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🎯</div>
                                        <p>No open opportunities right now. Check back soon!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* APPLICATIONS TAB */}
                        {activeTab === 'applications' && (
                            <div>
                                {myApplications.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {myApplications.map(app => (
                                            <div key={app._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 0.3rem' }}>{app.gig?.title || 'Untitled Opportunity'}</h4>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                                        By {app.gig?.organizer?.name || 'Unknown'} • Applied {new Date(app.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span className={`badge badge-${app.status === 'pending' ? 'warning' : app.status === 'accepted' ? 'success' : 'error'}`}>
                                                        <span className={`status-dot ${app.status}`}></span>
                                                        {app.status}
                                                    </span>
                                                    {app.gig && (
                                                        <Link to={`/gigs/${app.gig._id}`} className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                                                            View
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📋</div>
                                        <p>You haven't applied to any opportunities yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PORTFOLIO TAB */}
                        {activeTab === 'portfolio' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📁 Academic Portfolio</h3>
                                    <button className="btn btn-accent" onClick={() => openPortfolioModal()}>
                                        + Add Project
                                    </button>
                                </div>
                                {portfolio.length > 0 ? (
                                    <div className="grid-layout">
                                        {portfolio.map(item => (
                                            <div key={item._id} className="card portfolio-card" style={{ padding: 0 }}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.title} className="portfolio-img" />
                                                ) : (
                                                    <div style={{ height: '160px', background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                                        💼
                                                    </div>
                                                )}
                                                <div className="portfolio-body">
                                                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem' }}>{item.title}</h4>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {item.description || 'No description'}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        {(item.link || item.projectLink) && (
                                                            <a href={item.projectLink || item.link} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ textDecoration: 'none', flex: 1 }}>
                                                                🔗 View
                                                            </a>
                                                        )}
                                                        {item.portfolioPDF && (
                                                            <a href={`${api.defaults.baseURL?.replace('/api', '')}${item.portfolioPDF}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ textDecoration: 'none', flex: 1, color: '#DC2626', borderColor: '#FECACA' }}>
                                                                📄 PDF
                                                            </a>
                                                        )}
                                                        <button className="btn btn-secondary btn-sm" onClick={() => openPortfolioModal(item)} style={{ flex: 1 }}>Edit</button>
                                                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeletePortfolio(item._id)}>🗑</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">💼</div>
                                        <p>No projects yet. Add your first project to build your portfolio!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ACHIEVEMENTS TAB */}
                        {activeTab === 'achievements' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                    <button className="btn btn-accent" onClick={() => openAchievementModal()}>
                                        + Add Achievement
                                    </button>
                                </div>
                                {achievements.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {achievements.map(ach => (
                                            <div key={ach._id} className="achievement-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 0.3rem' }}>{ach.title}</h4>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 0.3rem' }}>{ach.description}</p>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <small style={{ color: 'var(--color-text-muted)' }}>📅 {new Date(ach.date).toLocaleDateString()}</small>
                                                        {ach.certificateLink && (
                                                            <a href={ach.certificateLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem' }}>
                                                                🔗 View Certificate
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, marginLeft: '1rem' }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => openAchievementModal(ach)}>Edit</button>
                                                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteAchievement(ach._id)}>🗑</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🏆</div>
                                        <p>No achievements yet. Add your awards and certifications!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Portfolio Modal */}
            {showPortfolioModal && (
                <div className="modal-overlay" onClick={() => setShowPortfolioModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>{editingPortfolio ? 'Edit Project' : 'Add New Project'}</h3>
                            <button className="modal-close" onClick={() => setShowPortfolioModal(false)}>×</button>
                        </div>
                        <form onSubmit={handlePortfolioSubmit}>
                            <div className="input-group">
                                <label className="label">Project Title *</label>
                                <input className="input" value={portfolioForm.title} onChange={e => setPortfolioForm({ ...portfolioForm, title: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="label">Description</label>
                                <textarea className="input textarea" rows="3" value={portfolioForm.description} onChange={e => setPortfolioForm({ ...portfolioForm, description: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="label">Project Link</label>
                                <input className="input" value={portfolioForm.projectLink} onChange={e => setPortfolioForm({ ...portfolioForm, projectLink: e.target.value })} placeholder="https://github.com/..." />
                            </div>
                            <div className="input-group">
                                <label className="label">Image URL</label>
                                <input className="input" value={portfolioForm.image} onChange={e => setPortfolioForm({ ...portfolioForm, image: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="input-group">
                                <label className="label">📄 Upload PDF (Resume, Report, etc.)</label>
                                <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0])} className="input" style={{ padding: '0.5rem' }} />
                                {editingPortfolio?.portfolioPDF && !pdfFile && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.3rem 0 0' }}>Current PDF attached. Upload a new one to replace.</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingPortfolio ? 'Save Changes' : 'Add Project'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPortfolioModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Achievement Modal */}
            {showAchievementModal && (
                <div className="modal-overlay" onClick={() => setShowAchievementModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0 }}>{editingAchievement ? 'Edit Achievement' : 'Add Achievement'}</h3>
                            <button className="modal-close" onClick={() => setShowAchievementModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAchievementSubmit}>
                            <div className="input-group">
                                <label className="label">Title *</label>
                                <input className="input" value={achievementForm.title} onChange={e => setAchievementForm({ ...achievementForm, title: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="label">Description</label>
                                <textarea className="input textarea" rows="3" value={achievementForm.description} onChange={e => setAchievementForm({ ...achievementForm, description: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="label">Date</label>
                                <input type="date" className="input" value={achievementForm.date} onChange={e => setAchievementForm({ ...achievementForm, date: e.target.value })} />
                            </div>
                            <div className="input-group">
                                <label className="label">Certificate Link</label>
                                <input className="input" value={achievementForm.certificateLink} onChange={e => setAchievementForm({ ...achievementForm, certificateLink: e.target.value })} placeholder="https://..." />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingAchievement ? 'Save Changes' : 'Add Achievement'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAchievementModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
