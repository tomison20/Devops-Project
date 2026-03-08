import Gig from '../models/Gig.js';
import Bid from '../models/Bid.js';

// @desc    Create a new gig (Verified Opportunity)
// @route   POST /api/gigs
// @access  Private (Organizer/Admin)
export const createGig = async (req, res) => {
    try {
        const { title, description, deadline, skillsRequired, deliverables, volunteersRequired } = req.body;

        const gig = await Gig.create({
            title,
            description,
            deadline,
            skillsRequired,
            deliverables,
            volunteersRequired: volunteersRequired || 0,
            organizer: req.user._id,
            organization: req.user.organization // Multi-tenant scoping
        });

        res.status(201).json(gig);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all gigs
// @route   GET /api/gigs
// @access  Public
export const getGigs = async (req, res) => {
    try {
        console.log('getGigs: Checking req.user...');
        if (!req.user) {
            console.warn('getGigs: req.user is undefined/null');
            return res.status(401).json({ message: 'Not authorized' });
        }

        console.log('getGigs: User found, ID:', req.user._id);
        console.log('getGigs: User organization:', req.user.organization);

        if (!req.user.organization) {
            console.warn('getGigs: req.user.organization is missing');
            return res.status(400).json({ message: 'User organization not found' });
        }

        // Scoped to organization
        const query = {
            organization: req.user.organization
        };

        // If not admin, show only open gigs or gigs relevant to them
        if (req.user.role !== 'admin') {
            query.status = { $in: ['open', 'assigned', 'submitted', 'completed'] };
        }

        console.log('getGigs: Built query:', JSON.stringify(query));

        const gigs = await Gig.find(query)
            .populate('organizer', 'name email avatar headline')
            .populate('assignedTo', 'name email avatar')
            .sort({ createdAt: -1 });

        console.log('getGigs: Found', gigs?.length, 'gigs');
        res.json(gigs || []);
    } catch (error) {
        console.error('getGigs CRASH:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// @desc    Get single gig
// @route   GET /api/gigs/:id
// @access  Public
export const getGigById = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id)
            .populate('organizer', 'name email avatar')
            .populate('assignedTo', 'name email');

        if (!gig) {
            res.status(404);
            throw new Error('Gig not found');
        }

        // Also fetch applications/bids for this gig
        const bids = await Bid.find({ gig: gig._id })
            .populate('freelancer', 'name email')
            .sort({ createdAt: -1 });

        res.json({ ...gig.toObject(), bids });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// @desc    Apply for an opportunity
// @route   POST /api/gigs/:id/apply
// @access  Private (Student)
export const applyForGig = async (req, res) => {
    try {
        const { proposal } = req.body;
        const gig = await Gig.findById(req.params.id);

        if (!gig || gig.status !== 'open') {
            res.status(400);
            throw new Error('Opportunity not available for applications');
        }

        const bid = await Bid.create({
            gig: gig._id,
            freelancer: req.user._id,
            proposal: proposal
        });

        res.status(201).json(bid);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Approve an application
// @route   PUT /api/gigs/:id/approve-app/:bidId
// @access  Private (Organizer)
export const approveApplication = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        const bid = await Bid.findById(req.params.bidId);

        if (!gig || !bid) {
            res.status(404);
            throw new Error('Opportunity or Application not found');
        }

        if (gig.organizer.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to approve applications for this opportunity');
        }

        // Update Gig Status
        gig.status = 'assigned';
        gig.assignedTo = bid.freelancer;
        await gig.save();

        // Update Application Status
        bid.status = 'accepted';
        await bid.save();

        res.json({ message: 'Application approved and student assigned', gig });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Submit Work
// @route   PUT /api/gigs/:id/submit
// @access  Private (Student)
export const submitWork = async (req, res) => {
    try {
        const { link, description } = req.body;
        const gig = await Gig.findById(req.params.id);

        if (gig.assignedTo.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized');
        }

        gig.status = 'submitted';
        gig.submission = {
            link,
            description,
            submittedAt: Date.now()
        };
        await gig.save();

        res.json(gig);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Complete & Verify Work
// @route   PUT /api/gigs/:id/verify
// @access  Private (Organizer)
export const verifyWork = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);

        if (gig.organizer.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized');
        }

        if (gig.status !== 'submitted') {
            res.status(400);
            throw new Error('Work not submitted yet');
        }

        gig.status = 'completed';
        await gig.save();

        res.json({ message: 'Work verified and marked as completed', gig });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update gig
// @route   PUT /api/gigs/:id
// @access  Private (Organizer)
export const updateGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);

        if (!gig) {
            res.status(404);
            throw new Error('Gig not found');
        }

        // Check ownership
        if (gig.organizer.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('User not authorized');
        }

        const updatedGig = await Gig.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json(updatedGig);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete gig
// @route   DELETE /api/gigs/:id
// @access  Private (Organizer)
export const deleteGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);

        if (!gig) {
            res.status(404);
            throw new Error('Gig not found');
        }

        // Check ownership
        if (gig.organizer.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('User not authorized');
        }

        await gig.deleteOne();

        res.json({ message: 'Gig removed' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get applications for a gig
// @route   GET /api/gigs/:id/applications
// @access  Private (Organizer)
export const getApplicationsForGig = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        if (!gig) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }
        if (gig.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const applications = await Bid.find({ gig: req.params.id })
            .populate('freelancer', 'name email avatar headline skills')
            .sort({ createdAt: -1 });

        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject an application
// @route   PUT /api/gigs/:id/reject-app/:bidId
// @access  Private (Organizer)
export const rejectApplication = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.id);
        const bid = await Bid.findById(req.params.bidId);

        if (!gig || !bid) {
            return res.status(404).json({ message: 'Opportunity or Application not found' });
        }

        if (gig.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        bid.status = 'rejected';
        await bid.save();

        res.json({ message: 'Application rejected', bid });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get student's own applications
// @route   GET /api/gigs/my-applications
// @access  Private (Student)
export const getMyApplications = async (req, res) => {
    try {
        const applications = await Bid.find({ freelancer: req.user._id })
            .populate({
                path: 'gig',
                select: 'title description deadline status organizer organization',
                populate: { path: 'organizer', select: 'name' }
            })
            .sort({ createdAt: -1 });

        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

