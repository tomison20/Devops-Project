import mongoose from 'mongoose';

const gigSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },

    // Multi-tenant Scoping
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },

    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
        type: String,
        enum: ['open', 'assigned', 'submitted', 'completed', 'cancelled', 'disputed'],
        default: 'open'
    },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Workflow tracking
    submission: {
        link: String,
        description: String,
        submittedAt: Date
    },

    skillsRequired: [{ type: String }],
    deliverables: [{ type: String }],
    category: { type: String, default: 'General' },

    // Volunteer management
    volunteersRequired: { type: Number, default: 0 },
    certificateTemplate: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
gigSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Gig = mongoose.model('Gig', gigSchema);
export default Gig;
