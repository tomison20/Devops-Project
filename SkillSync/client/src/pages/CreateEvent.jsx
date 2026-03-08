import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        roleName: 'Volunteer',
        roleCapacity: 10,
        roleDescription: 'General volunteering tasks'
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Construct the roles array from the single role input for now
            const eventData = {
                title: formData.title,
                description: formData.description,
                date: formData.date,
                location: formData.location,
                roles: [{
                    name: formData.roleName,
                    capacity: parseInt(formData.roleCapacity),
                    description: formData.roleDescription
                }]
            };

            await api.post('/events', eventData);
            navigate('/dashboard/organizer');
        } catch (error) {
            alert('Error creating event: ' + (error.response?.data?.message || 'Server Error'));
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 0', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Create Volunteer Event</h1>
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Event Title</label>
                        <input className="input" name="title" onChange={handleChange} required placeholder="e.g. Campus Cleanup" />
                    </div>

                    <div className="input-group">
                        <label className="label">Description</label>
                        <textarea className="input" name="description" rows="4" onChange={handleChange} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div className="input-group">
                            <label className="label">Date</label>
                            <input type="date" className="input" name="date" onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label className="label">Location</label>
                            <input className="input" name="location" onChange={handleChange} required placeholder="e.g. Student Center" />
                        </div>
                    </div>

                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.2rem' }}>Primary Volunteer Role</h3>
                    <div className="input-group">
                        <label className="label">Role Name</label>
                        <input className="input" name="roleName" value={formData.roleName} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="label">Role Description</label>
                        <input className="input" name="roleDescription" value={formData.roleDescription} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="label">Capacity</label>
                        <input type="number" className="input" name="roleCapacity" value={formData.roleCapacity} onChange={handleChange} required min="1" />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Create Event
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateEvent;
