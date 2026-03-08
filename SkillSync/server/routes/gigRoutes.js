import express from 'express';
import {
    createGig,
    getGigs,
    getGigById,
    applyForGig,
    approveApplication,
    rejectApplication,
    getApplicationsForGig,
    getMyApplications,
    submitWork,
    verifyWork,
    updateGig,
    deleteGig
} from '../controllers/gigController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student: get my applications (must be before /:id to avoid param collision)
router.route('/my-applications')
    .get(protect, authorize('student'), getMyApplications);

router.route('/')
    .post(protect, authorize('organizer', 'admin'), createGig)
    .get(protect, getGigs);

router.route('/:id')
    .get(getGigById)
    .put(protect, authorize('organizer', 'admin'), updateGig)
    .delete(protect, authorize('organizer', 'admin'), deleteGig);

router.route('/:id/apply')
    .post(protect, authorize('student'), applyForGig);

// Organizer: get applications for a gig
router.route('/:id/applications')
    .get(protect, authorize('organizer', 'admin'), getApplicationsForGig);

// Workflow Routes
router.route('/:id/approve-app/:bidId')
    .put(protect, authorize('organizer', 'admin'), approveApplication);

router.route('/:id/reject-app/:bidId')
    .put(protect, authorize('organizer', 'admin'), rejectApplication);

router.route('/:id/submit')
    .put(protect, authorize('student'), submitWork);

router.route('/:id/verify')
    .put(protect, authorize('organizer', 'admin'), verifyWork);

export default router;
