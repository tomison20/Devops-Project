import Achievement from '../models/Achievement.js';

// @desc    Get student achievements
// @route   GET /api/achievements
export const getMyAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.find({
            student: req.user._id,
            organization: req.user.organization
        });
        res.json(achievements);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Create achievement
// @route   POST /api/achievements
export const createAchievement = async (req, res) => {
    try {
        const { title, description, date, certificateLink } = req.body;
        const achievement = await Achievement.create({
            student: req.user._id,
            organization: req.user.organization,
            title,
            description,
            date,
            certificateLink
        });
        res.status(201).json(achievement);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update achievement
// @route   PUT /api/achievements/:id
export const updateAchievement = async (req, res) => {
    try {
        const item = await Achievement.findOne({ _id: req.params.id, student: req.user._id });
        if (!item) return res.status(404).json({ message: 'Achievement not found' });

        Object.assign(item, req.body);
        await item.save();
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete achievement
// @route   DELETE /api/achievements/:id
export const deleteAchievement = async (req, res) => {
    try {
        const item = await Achievement.findOneAndDelete({ _id: req.params.id, student: req.user._id });
        if (!item) return res.status(404).json({ message: 'Achievement not found' });
        res.json({ message: 'Achievement removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
