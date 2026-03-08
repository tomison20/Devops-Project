import mongoose from 'mongoose';

const volunteerApplicationSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    class: { type: String, required: true },
    teacherName: { type: String, required: true },
    teacherEmail: { type: String, required: true },
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    appliedAt: { type: Date, default: Date.now }
});

// Prevent duplicate applications
volunteerApplicationSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });

const VolunteerApplication = mongoose.model('VolunteerApplication', volunteerApplicationSchema);
export default VolunteerApplication;
