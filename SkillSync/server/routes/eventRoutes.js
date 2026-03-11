import express from 'express';
import {
    createEvent,
    getEvents,
    getEventById,
    registerForEvent,
    verifyAttendance,
    updateEvent,
    deleteEvent,
    removeVolunteer,
    exportEventVolunteers,
    uploadCertificateTemplate,
    generateCertificates,
    sendDutyLeaveEmail
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorize('organizer', 'admin'), createEvent)
    .get(protect, getEvents);

router.route('/:id')
    .get(getEventById)
    .put(protect, authorize('organizer', 'admin'), updateEvent)
    .delete(protect, authorize('organizer', 'admin'), deleteEvent);

router.route('/:id/register')
    .post(protect, authorize('student'), registerForEvent);

// Workflow
router.route('/:id/verify')
    .post(protect, authorize('organizer', 'admin'), verifyAttendance);

router.route('/:id/volunteers/:volunteerId')
    .delete(protect, authorize('organizer', 'admin'), removeVolunteer);

router.route('/:id/export')
    .get(protect, authorize('organizer', 'admin'), exportEventVolunteers);

router.route('/:id/certificate-template')
    .post(protect, authorize('organizer', 'admin'), uploadCertificateTemplate);

router.route('/:id/generate-certificates')
    .post(protect, authorize('organizer', 'admin'), generateCertificates);

router.route('/:id/volunteers/:volunteerId/duty-leave-email')
    .post(protect, authorize('organizer', 'admin'), sendDutyLeaveEmail);

export default router;
