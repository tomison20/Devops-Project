import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Volunteering = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data } = await api.get('/events');
                setEvents(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Volunteer Opportunities</h1>
                {(user?.role === 'organizer' || user?.role === 'admin') && (
                    <button className="btn btn-primary" onClick={() => navigate('/volunteering/create')}>Create Event</button>
                )}
            </div>

            <div className="grid-layout">
                {events.map(event => (
                    <div key={event._id} className="card">
                        <h3>{event.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{event.description}</p>
                        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            <p>📍 {event.location}</p>
                            <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <button className="btn btn-outline" style={{ width: '100%' }}>View Roles</button>
                    </div>
                ))}
                {events.length === 0 && <p>No upcoming volunteer events.</p>}
            </div>
        </div>
    );
};

export default Volunteering;
