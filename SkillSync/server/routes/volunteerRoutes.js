import express from 'express';
import {
    applyAsVolunteer,
    getVolunteerApplications,
    updateVolunteerStatus,
    exportVolunteers,
    sendDutyLeaveEmail,
    uploadCertificateTemplate,
    upload
} from '../controllers/volunteerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student applies as volunteer
router.route('/apply')
    .post(protect, authorize('student'), applyAsVolunteer);

// Organizer gets applications for an opportunity
router.route('/opportunity/:opportunityId')
    .get(protect, authorize('organizer', 'admin'), getVolunteerApplications);

// Organizer approves/rejects application
router.route('/:id/status')
    .put(protect, authorize('organizer', 'admin'), updateVolunteerStatus);

// Export volunteers to Excel
router.route('/opportunity/:opportunityId/export')
    .get(protect, authorize('organizer', 'admin'), exportVolunteers);

// Send duty leave email
router.route('/:id/duty-leave-email')
    .post(protect, authorize('organizer', 'admin'), sendDutyLeaveEmail);

// Upload certificate template
router.route('/opportunity/:opportunityId/certificate-template')
    .post(protect, authorize('organizer', 'admin'), upload.single('template'), uploadCertificateTemplate);

export default router;
