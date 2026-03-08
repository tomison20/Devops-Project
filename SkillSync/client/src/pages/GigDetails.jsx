import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const GigDetails = () => {
    const { id } = useParams();
    const [gig, setGig] = useState(null);
    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState([]); // Renamed from bids
    const [proposal, setProposal] = useState('');
    const [submissionLink, setSubmissionLink] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const userRes = await api.get('/auth/profile');
                setUser(userRes.data);

                const gigRes = await api.get(`/gigs/${id}`);
                setGig(gigRes.data);

                // Fetch applications if organizer
                if (userRes.data._id === gigRes.data.organizer._id) {
                    // This assumes the backend returns bids with the gig or has a specific route
                    // For now, checking if gig.bids exists or needs separate fetch
                    setApplications(gigRes.data.bids || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/gigs/${id}/apply`, { proposal });
            alert('Application submitted successfully!');
            window.location.reload();
        } catch (error) { alert(error.response?.data?.message); }
    };

    const handleApproveApplication = async (bidId) => {
        try {
            await api.put(`/gigs/${id}/approve-app/${bidId}`);
            alert('Student assigned to this opportunity.');
            window.location.reload();
        } catch (error) { alert(error.response?.data?.message); }
    };

    const handleSubmitWork = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/gigs/${id}/submit`, { link: submissionLink, description: 'Work submitted' });
            alert('Work submitted for verification.');
            window.location.reload();
        } catch (error) { alert(error.response?.data?.message); }
    };

    const handleVerifyWork = async () => {
        try {
            await api.put(`/gigs/${id}/verify`);
            alert('Work verified and marked as completed!');
            window.location.reload();
        } catch (error) { alert(error.response?.data?.message); }
    };

    if (loading || !gig || !user) return <div className="container" style={{ padding: '4rem' }}>Loading details...</div>;

    const isOrganizer = user._id === (gig.organizer._id || gig.organizer);
    const isAssigned = gig.assignedTo?._id === user._id || gig.assignedTo === user._id;

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ marginBottom: '2rem' }}>
                <span className={`badge ${gig.status === 'open' ? 'badge-success' : 'badge-status'}`} style={{ marginBottom: '1rem' }}>
                    {gig.status.toUpperCase()}
                </span>
                <h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>{gig.title}</h1>
                <div style={{ display: 'flex', gap: '2rem', color: 'var(--color-text-muted)' }}>
                    <span>Deadline: <strong>{new Date(gig.deadline).toLocaleDateString()}</strong></span>
                    <span>Institutional Opportunity</span>
                </div>
            </div>

            <div className="grid-layout" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="card">
                    <h3>Description</h3>
                    <p style={{ whiteSpace: 'pre-wrap', marginBottom: '2rem', color: '#334155' }}>{gig.description}</p>

                    <h3>Expected Deliverables</h3>
                    <p style={{ color: '#334155', marginBottom: '2rem' }}>{gig.deliverables}</p>

                    {/* Workflow: Submission (Student) */}
                    {isAssigned && gig.status === 'assigned' && (
                        <div style={{ marginTop: '2rem', padding: '2rem', background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                            <h4>Submit Your Work</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Provide a link to your completed project or documentation.</p>
                            <form onSubmit={handleSubmitWork}>
                                <div className="input-group">
                                    <label className="label">Submission Link</label>
                                    <input className="input" value={submissionLink} onChange={e => setSubmissionLink(e.target.value)} placeholder="e.g. GitHub Repository, Google Drive" required />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit for Verification</button>
                            </form>
                        </div>
                    )}

                    {/* Workflow: Verification (Organizer) */}
                    {isOrganizer && gig.status === 'submitted' && (
                        <div style={{ marginTop: '2rem', padding: '2rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ color: '#166534' }}>Review & Verify Work</h4>
                            <div style={{ margin: '1rem 0', padding: '1rem', background: 'white', borderRadius: '4px' }}>
                                <p><strong>Submission Link:</strong> <a href={gig.submission?.link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)' }}>{gig.submission?.link}</a></p>
                            </div>
                            <p style={{ fontSize: '0.9rem' }}>Verifying will mark this opportunity as completed and record it in the student's portfolio.</p>
                            <button onClick={handleVerifyWork} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                                Verify & Mark Completed
                            </button>
                        </div>
                    )}
                </div>

                <div className="card">
                    <h3>Organizer</h3>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem', fontWeight: 'bold' }}>
                            {gig.organizer.name?.charAt(0)}
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, margin: 0 }}>{gig.organizer.name}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>{user?.organization?.name}</p>
                        </div>
                    </div>

                    {/* Workflow: Application (Student) */}
                    {!isOrganizer && !isAssigned && gig.status === 'open' && (
                        <form onSubmit={handleApply}>
                            <h4>Quick Apply</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Express your interest and mention relevant skills.</p>
                            <div className="input-group">
                                <label className="label">Proposal / Notes</label>
                                <textarea className="input" rows="4" value={proposal} onChange={e => setProposal(e.target.value)} placeholder="Why are you a good fit for this?" required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Application</button>
                        </form>
                    )}

                    {/* Workflow: Managing Applications (Organizer) */}
                    {isOrganizer && gig.status === 'open' && (
                        <div>
                            <h4>Applications</h4>
                            {applications.length > 0 ? applications.map(app => (
                                <div key={app._id} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: '1rem' }}>
                                    <p style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>{app.freelancer?.name || 'Student'}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{app.proposal}</p>
                                    <button onClick={() => handleApproveApplication(app._id)} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Assign Student</button>
                                </div>
                            )) : (
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>No applications yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GigDetails;
