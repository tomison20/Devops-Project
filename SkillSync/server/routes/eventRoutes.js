import express from 'express';
import {
    createEvent,
    getEvents,
    getEventById,
    registerForEvent,
    verifyAttendance
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize('organizer', 'admin'), createEvent)
    .get(protect, getEvents);

router.route('/:id')
    .get(getEventById);

router.route('/:id/register')
    .post(protect, authorize('student'), registerForEvent);

// Workflow
router.route('/:id/verify')
    .post(protect, authorize('organizer', 'admin'), verifyAttendance);

export default router;
