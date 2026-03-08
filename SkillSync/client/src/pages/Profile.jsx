import { useEffect, useState } from 'react';
import api from '../api/axios';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [portfolio, setPortfolio] = useState([]);
    const [achievements, setAchievements] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userRes = await api.get('/auth/profile');
                setUser(userRes.data);

                const [portRes, achRes] = await Promise.all([
                    api.get('/portfolios'),
                    api.get('/achievements')
                ]);
                setPortfolio(portRes.data);
                setAchievements(achRes.data);
            } catch (error) { console.error(error); }
        };
        fetchProfile();
    }, []);

    if (!user) return <div className="container" style={{ padding: '4rem' }}>Loading Institutional Profile...</div>;

    return (
        <div className="container" style={{ padding: '4rem 0', maxWidth: '900px' }}>
            <div className="card" style={{ marginBottom: '2rem', borderTop: `8px solid var(--color-primary)` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <div style={{
                            width: 100, height: 100, borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-primary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', color: '#fff', fontWeight: 'bold'
                        }}>
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '2.25rem' }}>{user.name}</h1>
                            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{user.headline || user.role.toUpperCase()}</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span className="badge badge-success">Verified Student Member</span>
                                <span className="badge badge-status">{user.organization?.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div>
                        <h3>Academic Bio</h3>
                        <p style={{ lineHeight: 1.6, color: '#334155' }}>
                            {user.bio || 'No academic bio provided.'}
                        </p>
                    </div>
                    <div>
                        <h3>Key Skills</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {user.skills && user.skills.length > 0 ? user.skills.map((skill, i) => (
                                <span key={i} className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{skill}</span>
                            )) : <p style={{ color: '#999' }}>No skills listed.</p>}
                        </div>
                    </div>
                </div>
            </div>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>Academic Portfolio</h2>
                <div className="grid-layout">
                    {portfolio.length > 0 ? portfolio.map((item, i) => (
                        <div key={i} className="card">
                            <h4>{item.title}</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{item.description}</p>
                            {item.link && <a href={item.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem' }}>Full Project →</a>}
                        </div>
                    )) : (
                        <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: '#999' }}>No portfolio projects showcased yet.</p>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>Achievements</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {achievements.length > 0 ? achievements.map((ach, i) => (
                        <div key={i} className="card" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>{ach.title}</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{ach.description}</p>
                            </div>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                {new Date(ach.date).getFullYear()}
                            </div>
                        </div>
                    )) : (
                        <p style={{ textAlign: 'center', color: '#999' }}>No achievements recorded.</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Profile;
