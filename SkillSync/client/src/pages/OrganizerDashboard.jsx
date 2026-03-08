import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const OrganizerDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('opportunities');
    const [myOpportunities, setMyOpportunities] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [expandedGig, setExpandedGig] = useState(null);
    const [gigApplications, setGigApplications] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gigsRes, eventsRes] = await Promise.all([
                    api.get('/gigs'),
                    api.get('/events')
                ]);
                // Filter gigs created by this organizer
                setMyOpportunities(gigsRes.data.filter(g => g.organizer?._id === user._id));
                setMyEvents(eventsRes.data.filter(e => e.organizer?._id === user._id || e.organizer === user._id));
            } catch (error) {
                console.error('Organizer dashboard fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user._id]);

    const toggleApplications = async (gigId) => {
        if (expandedGig === gigId) {
            setExpandedGig(null);
            return;
        }
        setExpandedGig(gigId);
        if (!gigApplications[gigId]) {
            try {
                const { data } = await api.get(`/gigs/${gigId}/applications`);
                setGigApplications(prev => ({ ...prev, [gigId]: data }));
            } catch (error) {
                console.error('Failed to fetch applications:', error);
            }
        }
    };

    const handleApprove = async (gigId, bidId) => {
        try {
            await api.put(`/gigs/${gigId}/approve-app/${bidId}`);
            // Refresh applications
            const { data } = await api.get(`/gigs/${gigId}/applications`);
            setGigApplications(prev => ({ ...prev, [gigId]: data }));
            // Refresh gigs
            const gigsRes = await api.get('/gigs');
            setMyOpportunities(gigsRes.data.filter(g => g.organizer?._id === user._id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async (gigId, bidId) => {
        try {
            await api.put(`/gigs/${gigId}/reject-app/${bidId}`);
            const { data } = await api.get(`/gigs/${gigId}/applications`);
            setGigApplications(prev => ({ ...prev, [gigId]: data }));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to reject');
        }
    };

    const handleDeleteGig = async (gigId) => {
        if (!window.confirm('Delete this opportunity? This cannot be undone.')) return;
        try {
            await api.delete(`/gigs/${gigId}`);
            setMyOpportunities(myOpportunities.filter(g => g._id !== gigId));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete');
        }
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="loader"></div>
            <p>Loading management console...</p>
        </div>
    );

    const statusColor = (status) => {
        switch (status) {
            case 'open': return 'success';
            case 'assigned': return 'blue';
            case 'submitted': return 'warning';
            case 'completed': return 'purple';
            default: return 'status';
        }
    };

    const totalApplicants = myOpportunities.reduce((acc, g) => acc + (gigApplications[g._id]?.length || 0), 0);

    const tabs = [
        { id: 'opportunities', label: '📋 Opportunities', count: myOpportunities.length },
        { id: 'events', label: '📅 Events', count: myEvents.length },
    ];

    return (
        <div className="organizer-dashboard animate-fade-in">
            {/* Header */}
            <div className="dashboard-header organizer-header">
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {user?.organization?.name} • Organizer Console
                            </p>
                            <h1 style={{ color: 'white', fontSize: '2.25rem', margin: 0 }}>
                                Management Dashboard
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                                Create opportunities, manage applications, and track student participation
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Link to="/gigs/create" className="btn" style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: 'white', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
                                + New Opportunity
                            </Link>
                            <Link to="/volunteering/create" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                                + New Event
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
                            <div className="stat-value" style={{ color: '#7C3AED' }}>{myOpportunities.length}</div>
                            <div className="stat-label">Total Opportunities</div>
                        </div>
                        <div className="card stat-card animate-slide-up stagger-2">
                            <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{totalApplicants}</div>
                            <div className="stat-label">Applications Received</div>
                        </div>
                        <div className="card stat-card animate-slide-up stagger-3">
                            <div className="stat-value" style={{ color: 'var(--color-success)' }}>{myEvents.length}</div>
                            <div className="stat-label">Events Created</div>
                        </div>
                    </div>

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
                                    background: activeTab === tab.id ? '#EDE9FE' : '#F1F5F9',
                                    color: activeTab === tab.id ? '#5B21B6' : '#64748B',
                                    padding: '0.1rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700
                                }}>{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="animate-fade-in" key={activeTab}>

                        {/* OPPORTUNITIES TAB */}
                        {activeTab === 'opportunities' && (
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table className="table-modern">
                                    <thead>
                                        <tr>
                                            <th>Opportunity</th>
                                            <th>Status</th>
                                            <th>Deadline</th>
                                            <th>Assigned To</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myOpportunities.map(gig => (
                                            <>
                                                <tr key={gig._id}>
                                                    <td>
                                                        <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{gig.title}</strong>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                            {gig.skillsRequired?.slice(0, 3).join(', ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-${statusColor(gig.status)}`}>{gig.status}</span>
                                                    </td>
                                                    <td style={{ fontSize: '0.875rem' }}>
                                                        {new Date(gig.deadline).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ fontSize: '0.875rem' }}>
                                                        {gig.assignedTo?.name || '—'}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                            <button
                                                                className="btn btn-outline btn-sm"
                                                                onClick={() => toggleApplications(gig._id)}
                                                            >
                                                                {expandedGig === gig._id ? '▲ Hide' : '▼ Applications'}
                                                            </button>
                                                            <Link to={`/gigs/${gig._id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                                                                View
                                                            </Link>
                                                            <button
                                                                className="btn btn-danger btn-sm btn-icon"
                                                                onClick={() => handleDeleteGig(gig._id)}
                                                            >🗑</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Expanded Applications Panel */}
                                                {expandedGig === gig._id && (
                                                    <tr key={`${gig._id}-apps`}>
                                                        <td colSpan="5" style={{ background: '#FAFBFC', padding: '1.25rem' }}>
                                                            <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
                                                                📩 Student Applications for "{gig.title}"
                                                            </h4>
                                                            {gigApplications[gig._id]?.length > 0 ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                                    {gigApplications[gig._id].map(app => (
                                                                        <div key={app._id} className="applicant-card">
                                                                            <div className="applicant-avatar">
                                                                                {app.freelancer?.name?.charAt(0) || '?'}
                                                                            </div>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                                    <div>
                                                                                        <strong>{app.freelancer?.name || 'Student'}</strong>
                                                                                        <span style={{ marginLeft: '0.5rem' }} className={`badge badge-${app.status === 'pending' ? 'warning' : app.status === 'accepted' ? 'success' : 'error'}`}>
                                                                                            {app.status}
                                                                                        </span>
                                                                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.2rem 0' }}>
                                                                                            {app.freelancer?.email}
                                                                                        </p>
                                                                                    </div>
                                                                                    {app.status === 'pending' && (
                                                                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                                                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(gig._id, app._id)}>
                                                                                                ✓ Approve
                                                                                            </button>
                                                                                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(gig._id, app._id)}>
                                                                                                ✕ Reject
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0', padding: '0.75rem', background: 'white', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                                                                    {app.proposal}
                                                                                </p>
                                                                                {app.freelancer?.skills?.length > 0 && (
                                                                                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                                                        {app.freelancer.skills.map((s, i) => (
                                                                                            <span key={i} style={{ background: '#EFF6FF', color: '#1E40AF', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>{s}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                                                                    No applications yet for this opportunity.
                                                                </p>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                        {myOpportunities.length === 0 && (
                                            <tr>
                                                <td colSpan="5">
                                                    <div className="empty-state">
                                                        <div className="empty-state-icon">📋</div>
                                                        <p>No opportunities created yet. Create your first one!</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* EVENTS TAB */}
                        {activeTab === 'events' && (
                            <div>
                                {myEvents.length > 0 ? (
                                    <div className="grid-layout">
                                        {myEvents.map(event => (
                                            <div key={event._id} className="card card-interactive">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{event.title}</h3>
                                                    <span className={`badge badge-${event.status === 'upcoming' ? 'blue' : event.status === 'completed' ? 'success' : 'status'}`}>
                                                        {event.status}
                                                    </span>
                                                </div>
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {event.description}
                                                </p>
                                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                    <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                                                    <span>📍 {event.location}</span>
                                                </div>
                                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#FAFBFC', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                                                    <strong>Volunteers:</strong> {event.volunteers?.length || 0}
                                                    {event.roles?.length > 0 && (
                                                        <span style={{ marginLeft: '1rem' }}>
                                                            <strong>Roles:</strong> {event.roles.map(r => r.name).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📅</div>
                                        <p>No events created yet. Create a volunteering event!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Volunteer Management Section */}
                    <div className="card" style={{ marginTop: '1.5rem', borderLeft: '4px solid #7C3AED' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem' }}>👥 Volunteer Management</h3>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                    View applications, approve volunteers, export lists, and send duty leave emails
                                </p>
                            </div>
                            <Link
                                to="/dashboard/organizer/applications"
                                className="btn"
                                style={{
                                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                                    color: 'white',
                                    boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                                    textDecoration: 'none'
                                }}
                            >
                                Manage Volunteers →
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrganizerDashboard;
