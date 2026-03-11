import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FaUsers, FaFileExport, FaCertificate, FaCheck, FaTimes, FaEnvelope, FaClipboardList, FaFilePdf, FaCalendarAlt, FaTrash, FaCog, FaSpinner } from 'react-icons/fa';

const OrganizerVolunteers = () => {
    const { user } = useAuth();
    
    // Global Tab State
    const [activeTab, setActiveTab] = useState('gigs'); // 'gigs' or 'events'

    // --- GIG STATES ---
    const [opportunities, setOpportunities] = useState([]);
    const [selectedOpp, setSelectedOpp] = useState('');
    const [applications, setApplications] = useState([]);
    const [oppTitle, setOppTitle] = useState('');
    const [volunteersRequired, setVolunteersRequired] = useState(0);
    const [certificateTemplate, setCertificateTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingOpps, setLoadingOpps] = useState(true);
    const [emailSending, setEmailSending] = useState({});
    const [generatingCerts, setGeneratingCerts] = useState(false);
    
    // Certificate Customization States
    const [certX, setCertX] = useState('');
    const [certY, setCertY] = useState('');

    // --- EVENT STATES ---
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [eventDetails, setEventDetails] = useState(null);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [loadingEventDetails, setLoadingEventDetails] = useState(false);
    const [eventGeneratingCerts, setEventGeneratingCerts] = useState(false);

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

    // --- EVENT EFFECTS & HANDLERS ---
    useEffect(() => {
        if (activeTab === 'events') {
            const fetchEvents = async () => {
                setLoadingEvents(true);
                try {
                    const { data } = await api.get('/events');
                    // Filter to events where user is organizer or co-organizer
                    const managedEvents = data.filter(e => 
                        (e.organizer?._id || e.organizer) === user._id || 
                        e.coOrganizers?.some(co => (co._id || co) === user._id)
                    );
                    setEvents(managedEvents);
                } catch (error) {
                    console.error('Failed to fetch events:', error);
                } finally {
                    setLoadingEvents(false);
                }
            };
            fetchEvents();
        }
    }, [activeTab, user._id]);

    useEffect(() => {
        if (selectedEventId) {
            const fetchEventDetails = async () => {
                setLoadingEventDetails(true);
                try {
                    const { data } = await api.get(`/events/${selectedEventId}`);
                    setEventDetails(data);
                } catch (error) {
                    console.error('Failed to load event details:', error);
                } finally {
                    setLoadingEventDetails(false);
                }
            };
            fetchEventDetails();
        } else {
            setEventDetails(null);
        }
    }, [selectedEventId]);

    const handleRemoveEventVolunteer = async (volunteerId) => {
        if (!window.confirm('Are you sure you want to remove this volunteer from the event?')) return;
        try {
            await api.delete(`/events/${selectedEventId}/volunteers/${volunteerId}`);
            alert('Volunteer removed.');
            // Refresh event details
            const { data } = await api.get(`/events/${selectedEventId}`);
            setEventDetails(data);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to remove volunteer');
        }
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

    // Export Event volunteers to Excel
    const handleEventExport = async () => {
        try {
            const response = await api.get(`/events/${selectedEventId}/export`, {
                responseType: 'blob'
            });
            const title = eventDetails?.title || 'event';
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `event_registrations_${title.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
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

    // Send Duty Leave Email for Event Volunteer
    const handleEventDutyEmail = async (volunteerId) => {
        setEmailSending(prev => ({ ...prev, [volunteerId]: true }));
        try {
            const { data } = await api.post(`/events/${selectedEventId}/volunteers/${volunteerId}/duty-leave-email`);
            alert(data.message);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send email');
        } finally {
            setEmailSending(prev => ({ ...prev, [volunteerId]: false }));
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

    // Generate Certificates
    const handleGenerateCertificates = async () => {
        setGeneratingCerts(true);
        try {
            const { data } = await api.post(`/volunteers/opportunity/${selectedOpp}/generate-certificates`, {
                textX: certX,
                textY: certY
            });
            alert(data.message);
            fetchApplications(selectedOpp);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to generate certificates');
        } finally {
            setGeneratingCerts(false);
        }
    };

    // Upload Event Certificate Template
    const handleEventTemplateUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('template', file);

        try {
            const { data } = await api.post(
                `/events/${selectedEventId}/certificate-template`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            // Refresh event details to get the template
            const res = await api.get(`/events/${selectedEventId}`);
            setEventDetails(res.data);
            alert('Event certificate template uploaded!');
        } catch (error) {
            alert(error.response?.data?.message || 'Upload failed');
        }
    };

    // Generate Event Certificates
    const handleGenerateEventCertificates = async () => {
        setEventGeneratingCerts(true);
        try {
            const { data } = await api.post(`/events/${selectedEventId}/generate-certificates`, {
                textX: certX,
                textY: certY
            });
            alert(data.message);
            // Refresh event details
            const res = await api.get(`/events/${selectedEventId}`);
            setEventDetails(res.data);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to generate event certificates');
        } finally {
            setEventGeneratingCerts(false);
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

                    {/* Combined Header Card for Tabs & Selectors */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                            <button 
                                style={{ 
                                    padding: '0.6rem 1.5rem', 
                                    background: activeTab === 'gigs' ? 'var(--color-primary)' : 'transparent', 
                                    border: `1px solid ${activeTab === 'gigs' ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                                    color: activeTab === 'gigs' ? 'white' : 'var(--color-text)',
                                    fontWeight: 600,
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '1.05rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => setActiveTab('gigs')}
                            >
                                Opportunities
                            </button>
                            <button 
                                style={{ 
                                    padding: '0.6rem 1.5rem', 
                                    background: activeTab === 'events' ? 'var(--color-primary)' : 'transparent', 
                                    border: `1px solid ${activeTab === 'events' ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                                    color: activeTab === 'events' ? 'white' : 'var(--color-text)',
                                    fontWeight: 600,
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontSize: '1.05rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => setActiveTab('events')}
                            >
                                Volunteering Events
                            </button>
                        </div>

                        {/* Opportunity Selector */}
                        {activeTab === 'gigs' && (
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
                                        <button className="btn btn-accent" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FaFileExport /> Export Volunteer List
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Event Selector */}
                        {activeTab === 'events' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '250px' }}>
                                    <label className="label">Select Event</label>
                                    <select
                                        className="input"
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option value="">— Choose an event —</option>
                                        {events.map(ev => (
                                            <option key={ev._id} value={ev._id}>{ev.title} ({new Date(ev.date).toLocaleDateString()})</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedEventId && (
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', paddingTop: '1.3rem' }}>
                                        <button className="btn btn-accent" onClick={handleEventExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <FaFileExport /> Export Event List
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {activeTab === 'gigs' && (
                        <>

                    {!selectedOpp && !loadingOpps && (
                        <div className="empty-state">
                            <div className="empty-state-icon"><FaUsers size={40} /></div>
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
                                    <div className="stat-value" style={{ color: '#2D5A3D' }}>{volunteersRequired || '∞'}</div>
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
                                    <div style={{ height: '8px', borderRadius: '4px', background: '#D8EAD0', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min((approved / volunteersRequired) * 100, 100)}%`,
                                            background: approved >= volunteersRequired
                                                ? 'linear-gradient(90deg, #059669, #047857)'
                                                : 'linear-gradient(90deg, #4A7C59, #3D6B4A)',
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
                                        <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaCertificate /> Certificate Template</h3>
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
                                            {certificateTemplate ? 'Replace Template' : 'Upload Template'}
                                            <input
                                                type="file"
                                                accept=".png,.jpg,.jpeg"
                                                onChange={handleTemplateUpload}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        {certificateTemplate && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <input 
                                                    type="number" 
                                                    placeholder="X (px)" 
                                                    className="input" 
                                                    style={{ width: '80px', padding: '0.4rem', fontSize: '0.8rem', minHeight: 'unset' }}
                                                    value={certX}
                                                    onChange={e => setCertX(e.target.value)}
                                                />
                                                <input 
                                                    type="number" 
                                                    placeholder="Y (px)" 
                                                    className="input" 
                                                    style={{ width: '80px', padding: '0.4rem', fontSize: '0.8rem', minHeight: 'unset' }}
                                                    value={certY}
                                                    onChange={e => setCertY(e.target.value)}
                                                />
                                                <button 
                                                    className="btn btn-primary btn-sm"
                                                    onClick={handleGenerateCertificates}
                                                    disabled={generatingCerts}
                                                    style={{ opacity: generatingCerts ? 0.7 : 1, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    {generatingCerts ? (
                                                        <><FaSpinner className="spin" /> Generating...</>
                                                    ) : (
                                                        <><FaCog /> Generate Certs</>
                                                    )}
                                                </button>
                                            </div>
                                        )}
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
                                                    <th>Resume</th>
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
                                                        <td>
                                                            {app.studentId?.resume ? (
                                                                <a href={`http://localhost:5000${app.studentId.resume}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626', textDecoration: 'none', fontWeight: 500 }}>
                                                                    <FaFilePdf /> View
                                                                </a>
                                                            ) : '—'}
                                                        </td>
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
                                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                        ><FaCheck /> Approve</button>
                                                                        <button
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => handleStatusUpdate(app._id, 'rejected')}
                                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                        ><FaTimes /> Reject</button>
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
                                    <div className="empty-state-icon"><FaClipboardList size={40} /></div>
                                    <p>No volunteer applications yet for "{oppTitle}"</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

                    {activeTab === 'events' && (
                        <>

                            {!selectedEventId && !loadingEvents && (
                                <div className="empty-state">
                                    <div className="empty-state-icon"><FaCalendarAlt size={40} /></div>
                                    <p>Select an event above to view registered volunteers</p>
                                </div>
                            )}

                            {loadingEvents && (
                                <div className="loading-screen" style={{ height: '30vh' }}>
                                    <div className="loader"></div>
                                </div>
                            )}

                            {selectedEventId && loadingEventDetails && (
                                <div className="loading-screen" style={{ height: '30vh' }}>
                                    <div className="loader"></div>
                                </div>
                            )}

                            {selectedEventId && eventDetails && !loadingEventDetails && (
                                <>
                                    <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(to right, #F0F5EC, #FFFFFF)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <FaCertificate color="var(--color-primary)" /> Event Certificates
                                                </h3>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                    Upload a blank certificate template to automatically generate certs for all verified attendees.
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div className="file-upload-wrapper">
                                                    <input 
                                                        type="file" 
                                                        id="event-cert-upload" 
                                                        accept="image/*" 
                                                        onChange={handleEventTemplateUpload}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <label htmlFor="event-cert-upload" className="btn btn-outline" style={{ cursor: 'pointer', margin: 0 }}>
                                                        {eventDetails.certificateTemplate ? 'Update Template' : 'Upload Template'}
                                                    </label>
                                                </div>
                                                
                                                {eventDetails.certificateTemplate && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <input 
                                                            type="number" 
                                                            placeholder="X (px)" 
                                                            className="input" 
                                                            style={{ width: '80px', padding: '0.4rem', fontSize: '0.8rem', minHeight: 'unset' }}
                                                            value={certX}
                                                            onChange={e => setCertX(e.target.value)}
                                                        />
                                                        <input 
                                                            type="number" 
                                                            placeholder="Y (px)" 
                                                            className="input" 
                                                            style={{ width: '80px', padding: '0.4rem', fontSize: '0.8rem', minHeight: 'unset' }}
                                                            value={certY}
                                                            onChange={e => setCertY(e.target.value)}
                                                        />
                                                        <button 
                                                            className="btn btn-primary" 
                                                            onClick={handleGenerateEventCertificates}
                                                            disabled={eventGeneratingCerts || !eventDetails.volunteers?.some(v => v.status === 'registered' || v.status === 'attended')}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                                        >
                                                            {eventGeneratingCerts ? (
                                                                <><FaSpinner className="spin" /> Generating...</>
                                                            ) : (
                                                                <><FaCog /> Generate Certs</>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3>{eventDetails.title} Attributes</h3>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            Total Registered: <strong style={{ color: 'var(--color-primary)' }}>{eventDetails.volunteers?.length || 0}</strong>
                                        </div>
                                    </div>

                                    {eventDetails.volunteers && eventDetails.volunteers.length > 0 ? (
                                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table className="table-modern">
                                                    <thead>
                                                        <tr>
                                                            <th>Name</th>
                                                            <th>Email</th>
                                                            <th>Class</th>
                                                            <th>Teacher Info</th>
                                                            <th>Event Role</th>
                                                            <th>Attendance</th>
                                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {eventDetails.volunteers.map((vol, index) => (
                                                            <tr key={index}>
                                                                <td style={{ fontWeight: 600 }}>
                                                                    <Link to={`/network/student/${vol.user?._id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{vol.user?.name || 'Student'}</Link>
                                                                </td>
                                                                <td style={{ fontSize: '0.85rem' }}>{vol.user?.email || 'N/A'}</td>
                                                                <td style={{ fontSize: '0.85rem' }}>{vol.class || 'N/A'}</td>
                                                                <td style={{ fontSize: '0.85rem' }}>
                                                                    {vol.teacherName ? (
                                                                        <>
                                                                            <span style={{ display: 'block' }}>{vol.teacherName}</span>
                                                                            <span style={{ color: 'var(--color-text-muted)' }}>{vol.teacherEmail}</span>
                                                                        </>
                                                                    ) : 'N/A'}
                                                                </td>
                                                                <td>{vol.role}</td>
                                                                <td>
                                                                    <span className={`badge ${vol.status === 'attended' ? 'badge-success' : 'badge-status'}`}>
                                                                        {vol.status.toUpperCase()}
                                                                    </span>
                                                                </td>
                                                                <td style={{ textAlign: 'right' }}>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                                        <Link 
                                                                            to={`/network/student/${vol.user?._id}`} 
                                                                            className="btn btn-outline btn-sm"
                                                                        >
                                                                            Profile
                                                                        </Link>
                                                                        <button
                                                                            className="btn btn-outline btn-sm"
                                                                            onClick={() => handleEventDutyEmail(vol._id)}
                                                                            disabled={emailSending[vol._id] || !vol.teacherEmail}
                                                                            style={{ opacity: (emailSending[vol._id] || !vol.teacherEmail) ? 0.6 : 1 }}
                                                                        >
                                                                            {emailSending[vol._id] ? '⏳ Sending...' : '✉ Duty Leave'}
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-outline btn-sm"
                                                                            style={{ color: '#EF4444', borderColor: '#EF4444' }}
                                                                            onClick={() => handleRemoveEventVolunteer(vol._id)}      
                                                                        >
                                                                            <FaTrash /> Remove
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
                                            <div className="empty-state-icon"><FaUsers size={40} /></div>
                                            <p>No volunteers have registered for this event yet.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerVolunteers;
