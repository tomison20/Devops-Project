import express from 'express';
import {
    getMyAchievements,
    createAchievement,
    updateAchievement,
    deleteAchievement
} from '../controllers/achievementController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, authorize('student', 'faculty', 'admin'), getMyAchievements)
    .post(protect, authorize('student'), createAchievement);

router.route('/:id')
    .put(protect, authorize('student'), updateAchievement)
    .delete(protect, authorize('student'), deleteAchievement);

export default router;
