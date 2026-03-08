import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreateGig = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: '',
        skillsRequired: '',
        deliverables: '',
        volunteersRequired: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/gigs', {
                ...formData,
                skillsRequired: formData.skillsRequired.split(',').map(s => s.trim()),
                deliverables: formData.deliverables.split('\n'),
                volunteersRequired: parseInt(formData.volunteersRequired) || 0
            });
            navigate('/dashboard/organizer');
        } catch (error) {
            alert('Error creating opportunity: ' + error.response?.data?.message);
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Post a New Verified Opportunity</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Opportunity Title</label>
                        <input className="input" name="title" onChange={handleChange} required placeholder="e.g. Redesign Campus App UI" />
                    </div>

                    <div className="input-group">
                        <label className="label">Description</label>
                        <textarea className="input" name="description" rows="5" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="label">Deadline</label>
                        <input type="date" className="input" name="deadline" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="label">Skills Required (Comma separated)</label>
                        <input className="input" name="skillsRequired" onChange={handleChange} placeholder="React, Design, Writing..." />
                    </div>

                    <div className="input-group">
                        <label className="label">Expected Deliverables</label>
                        <textarea className="input" name="deliverables" rows="3" onChange={handleChange} required placeholder="What exactly should be submitted?" />
                    </div>

                    <div className="input-group">
                        <label className="label">Volunteers Required (optional)</label>
                        <input type="number" className="input" name="volunteersRequired" onChange={handleChange} placeholder="e.g. 10" min="0" />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                        Post Verified Opportunity
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        Verification: This opportunity will be visible to students within your institution.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default CreateGig;
