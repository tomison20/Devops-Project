import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },

    // Multi-tenant Scoping
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },

    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    date: { type: Date, required: true },
    location: { type: String, required: true },
    image: { type: String }, // Cover image for the event
    certificateTemplate: { type: String }, // Path to the uploaded certificate template

    roles: [{
        name: String, // e.g., "Usher", "Photographer"
        description: String,
        capacity: Number,
        filled: { type: Number, default: 0 }
    }],

    volunteers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String, // Must match one of the roles.name
        class: { type: String },
        teacherName: { type: String },
        teacherEmail: { type: String },
        status: { type: String, enum: ['registered', 'attended', 'cancelled'], default: 'registered' },
        registeredAt: { type: Date, default: Date.now },
        attendanceHash: { type: String }, // For QR verification
        certificateUrl: { type: String } // Path to student's generated certificate
    }],

    status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },

    createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
