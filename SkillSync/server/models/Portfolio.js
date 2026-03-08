import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    title: { type: String, required: true },
    description: { type: String },
    link: { type: String },
    projectLink: { type: String },
    image: { type: String },
    portfolioPDF: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;
