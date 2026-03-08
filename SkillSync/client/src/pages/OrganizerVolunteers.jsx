import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const OrganizerVolunteers = () => {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState([]);
    const [selectedOpp, setSelectedOpp] = useState('');
    const [applications, setApplications] = useState([]);
    const [oppTitle, setOppTitle] = useState('');
    const [volunteersRequired, setVolunteersRequired] = useState(0);
    const [certificateTemplate, setCertificateTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingOpps, setLoadingOpps] = useState(true);
    const [emailSending, setEmailSending] = useState({});

    // Fetch organizer's opportunities for the dropdown
    useEffect(() => {
        const fetchOpps = async () => {
            try {
                const { data } = await api.get('/gigs');
                setOpportunities(data.filter(g => g.organizer?._id === user._id));
            } catch (error) {
                console.error('Failed to fetch opportunities:', error);
            } finally {
                setLoadingOpps(false);
            }
        };
        fetchOpps();
    }, [user._id]);

    // Fetch applications when an opportunity is selected
    const fetchApplications = async (oppId) => {
        if (!oppId) {
            setApplications([]);
            setOppTitle('');
            setVolunteersRequired(0);
            setCertificateTemplate(null);
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get(`/volunteers/opportunity/${oppId}`);
            setApplications(data.applications);
            setOppTitle(data.opportunityTitle);
            setVolunteersRequired(data.volunteersRequired);
            setCertificateTemplate(data.certificateTemplate);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOppChange = (e) => {
        setSelectedOpp(e.target.value);
        fetchApplications(e.target.value);
    };

    // Approve/Reject
    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/volunteers/${id}/status`, { status });
            fetchApplications(selectedOpp);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    // Export to Excel
    const handleExport = async () => {
        try {
            const response = await api.get(`/volunteers/opportunity/${selectedOpp}/export`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `volunteers_${oppTitle.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to export: ' + (error.response?.data?.message || error.message));
        }
    };

    // Send Duty Leave Email
    const handleSendEmail = async (id) => {
        setEmailSending(prev => ({ ...prev, [id]: true }));
        try {
            const { data } = await api.post(`/volunteers/${id}/duty-leave-email`);
            alert(data.message);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send email');
        } finally {
            setEmailSending(prev => ({ ...prev, [id]: false }));
        }
    };

    // Upload Certificate Template
    const handleTemplateUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('template', file);

        try {
            const { data } = await api.post(
                `/volunteers/opportunity/${selectedOpp}/certificate-template`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setCertificateTemplate(data.certificateTemplate);
            alert('Certificate template uploaded!');
        } catch (error) {
            alert(error.response?.data?.message || 'Upload failed');
        }
    };

    const approved = applications.filter(a => a.status === 'approved').length;
    const statusBadge = (status) => {
        if (status === 'approved') return 'badge-success';
        if (status === 'rejected') return 'badge-error';
        return 'badge-warning';
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="dashboard-header organizer-header">
                <div className="container">
                    <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {user?.organization?.name} • Volunteer Management
                    </p>
                    <h1 style={{ color: 'white', fontSize: '2.25rem', margin: 0 }}>
                        Volunteer Applications
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                        Manage volunteer applications, export data, and send duty leave requests
                    </p>
                </div>
            </div>

            <div className="dashboard-body">
                <div className="container">

                    {/* Opportunity Selector */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <label className="label">Select Opportunity</label>
                                <select
                                    className="input"
                                    value={selectedOpp}
                                    onChange={handleOppChange}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <option value="">— Choose an opportunity —</option>
                                    {opportunities.map(opp => (
                                        <option key={opp._id} value={opp._id}>{opp.title}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedOpp && (
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', paddingTop: '1.3rem' }}>
                                    <button className="btn btn-accent" onClick={handleExport}>
                                        📊 Export Volunteer List
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {!selectedOpp && !loadingOpps && (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <p>Select an opportunity above to view volunteer applications</p>
                        </div>
                    )}

                    {loadingOpps && (
                        <div className="loading-screen" style={{ height: '30vh' }}>
                            <div className="loader"></div>
                        </div>
                    )}

                    {selectedOpp && (
                        <>
                            {/* Stats + Certificate Template */}
                            <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                                <div className="card stat-card animate-slide-up stagger-1">
                                    <div className="stat-value" style={{ color: 'var(--color-success)' }}>{approved}</div>
                                    <div className="stat-label">Approved Volunteers</div>
                                </div>
                                <div className="card stat-card animate-slide-up stagger-2">
                                    <div className="stat-value" style={{ color: '#7C3AED' }}>{volunteersRequired || '∞'}</div>
                                    <div className="stat-label">Required Volunteers</div>
                                </div>
                                <div className="card stat-card animate-slide-up stagger-3">
                                    <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{applications.length}</div>
                                    <div className="stat-label">Total Applications</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {volunteersRequired > 0 && (
                                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                        <span>Volunteer Capacity</span>
                                        <span>{approved} / {volunteersRequired}</span>
                                    </div>
                                    <div style={{ height: '8px', borderRadius: '4px', background: '#E2E8F0', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min((approved / volunteersRequired) * 100, 100)}%`,
                                            background: approved >= volunteersRequired
                                                ? 'linear-gradient(90deg, #059669, #047857)'
                                                : 'linear-gradient(90deg, #3B82F6, #2563EB)',
                                            borderRadius: '4px',
                                            transition: 'width 0.5s ease'
                                        }}></div>
                                    </div>
                                </div>
                            )}

                            {/* Certificate Template Section */}
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem' }}>📜 Certificate Template</h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            {certificateTemplate
                                                ? 'Template uploaded'
                                                : 'Upload a PDF or image template for certificates'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {certificateTemplate && (
                                            <a
                                                href={`${api.defaults.baseURL?.replace('/api', '')}${certificateTemplate}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-outline btn-sm"
                                                style={{ textDecoration: 'none' }}
                                            >
                                                View Template
                                            </a>
                                        )}
                                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                                            {certificateTemplate ? 'Replace' : 'Upload'}
                                            <input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={handleTemplateUpload}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Applications Table */}
                            {loading ? (
                                <div className="loading-screen" style={{ height: '30vh' }}>
                                    <div className="loader"></div>
                                </div>
                            ) : applications.length > 0 ? (
                                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="table-modern">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Phone</th>
                                                    <th>Email</th>
                                                    <th>Class</th>
                                                    <th>Teacher Name</th>
                                                    <th>Teacher Email</th>
                                                    <th>Status</th>
                                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {applications.map(app => (
                                                    <tr key={app._id}>
                                                        <td style={{ fontWeight: 600 }}>{app.name}</td>
                                                        <td>{app.phoneNumber}</td>
                                                        <td style={{ fontSize: '0.85rem' }}>{app.email}</td>
                                                        <td>{app.class}</td>
                                                        <td>{app.teacherName}</td>
                                                        <td style={{ fontSize: '0.85rem' }}>{app.teacherEmail}</td>
                                                        <td>
                                                            <span className={`badge ${statusBadge(app.status)}`}>
                                                                {app.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                                {app.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            className="btn btn-success btn-sm"
                                                                            onClick={() => handleStatusUpdate(app._id, 'approved')}
                                                                        >✓ Approve</button>
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => handleStatusUpdate(app._id, 'rejected')}
                                                                        >✕ Reject</button>
                                                                    </>
                                                                )}
                                                                <button
                                                                    className="btn btn-outline btn-sm"
                                                                    onClick={() => handleSendEmail(app._id)}
                                                                    disabled={emailSending[app._id]}
                                                                    style={{ opacity: emailSending[app._id] ? 0.6 : 1 }}
                                                                >
                                                                    {emailSending[app._id] ? '⏳ Sending...' : '✉ Duty Leave'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-state-icon">📋</div>
                                    <p>No volunteer applications yet for "{oppTitle}"</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerVolunteers;
