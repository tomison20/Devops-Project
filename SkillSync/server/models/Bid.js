import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, default: 0 },
    proposal: { type: String, required: true },
    class: { type: String },
    teacherName: { type: String },
    teacherEmail: { type: String },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    certificateUrl: { type: String }, // For generated certificates
    createdAt: { type: Date, default: Date.now }
});

const Bid = mongoose.model('Bid', bidSchema);
export default Bid;
