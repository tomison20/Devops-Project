import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    certificateLink: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
