import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const StudentProfile = () => {
    const { user, login } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        headline: '',
        bio: '',
        skills: '',
        github: '',
        linkedin: '',
        twitter: '',
        portfolioWebsite: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/auth/profile');
                setProfile(data);
                setForm({
                    headline: data.headline || '',
                    bio: data.bio || '',
                    skills: (data.skills || []).join(', '),
                    github: data.github || '',
                    linkedin: data.linkedin || '',
                    twitter: data.twitter || '',
                    portfolioWebsite: data.portfolioWebsite || ''
                });
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.put('/auth/profile', {
                ...form,
                skills: form.skills.split(',').map(s => s.trim()).filter(Boolean)
            });
            setProfile(data);
            alert('Profile updated!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="loader"></div>
            <p>Loading profile...</p>
        </div>
    );

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="dashboard-header student-header">
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {user?.organization?.name} • Profile Settings
                            </p>
                            <h1 style={{ color: 'white', fontSize: '2.25rem', margin: 0 }}>
                                Edit Your Profile
                            </h1>
                        </div>
                        <Link to="/dashboard/student" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="dashboard-body">
                <div className="container" style={{ maxWidth: '800px' }}>
                    <form onSubmit={handleSubmit}>

                        {/* Basic Info */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem' }}>📝 Academic Info</h3>
                            <div className="input-group">
                                <label className="label">Headline</label>
                                <input className="input" value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Computer Science Sophomore | React Developer" />
                            </div>
                            <div className="input-group">
                                <label className="label">Bio</label>
                                <textarea className="input textarea" rows="3" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about your academic interests..." />
                            </div>
                            <div className="input-group">
                                <label className="label">Skills (comma separated)</label>
                                <input className="input" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Python, Design..." />
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem' }}>🔗 Social & Portfolio Links</h3>
                            <div className="input-group">
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                    GitHub
                                </label>
                                <input className="input" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} placeholder="https://github.com/username" />
                            </div>
                            <div className="input-group">
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                    LinkedIn
                                </label>
                                <input className="input" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/profile" />
                            </div>
                            <div className="input-group">
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                    Twitter / X
                                </label>
                                <input className="input" value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="https://x.com/username" />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                                    Portfolio Website
                                </label>
                                <input className="input" value={form.portfolioWebsite} onChange={e => setForm({ ...form, portfolioWebsite: e.target.value })} placeholder="https://your-portfolio.com" />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={saving} style={{ padding: '0.85rem' }}>
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
