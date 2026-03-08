import VolunteerApplication from '../models/VolunteerApplication.js';
import Gig from '../models/Gig.js';
import nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for certificate template upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `cert-${unique}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and image files are allowed'), false);
    }
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// @desc    Student applies as volunteer
// @route   POST /api/volunteers/apply
// @access  Private (Student)
export const applyAsVolunteer = async (req, res) => {
    try {
        const { name, email, phoneNumber, class: studentClass, teacherName, teacherEmail, opportunityId } = req.body;

        // Verify opportunity exists
        const gig = await Gig.findById(opportunityId);
        if (!gig) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        const application = await VolunteerApplication.create({
            studentId: req.user._id,
            name,
            email,
            phoneNumber,
            class: studentClass,
            teacherName,
            teacherEmail,
            opportunityId,
            organization: req.user.organization
        });

        res.status(201).json(application);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already applied for this opportunity' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get volunteer applications for an opportunity
// @route   GET /api/volunteers/opportunity/:opportunityId
// @access  Private (Organizer/Admin)
export const getVolunteerApplications = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.opportunityId);
        if (!gig) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }
        if (gig.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const applications = await VolunteerApplication.find({
            opportunityId: req.params.opportunityId
        }).sort({ appliedAt: -1 });

        res.json({
            applications,
            volunteersRequired: gig.volunteersRequired || 0,
            opportunityTitle: gig.title,
            certificateTemplate: gig.certificateTemplate || null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or reject a volunteer application
// @route   PUT /api/volunteers/:id/status
// @access  Private (Organizer/Admin)
export const updateVolunteerStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be approved or rejected' });
        }

        const application = await VolunteerApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Verify organizer owns the opportunity
        const gig = await Gig.findById(application.opportunityId);
        if (!gig || gig.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        application.status = status;
        await application.save();

        res.json(application);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Export volunteer list to Excel
// @route   GET /api/volunteers/opportunity/:opportunityId/export
// @access  Private (Organizer/Admin)
export const exportVolunteers = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.opportunityId);
        if (!gig || gig.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const applications = await VolunteerApplication.find({
            opportunityId: req.params.opportunityId
        }).sort({ appliedAt: -1 });

        const data = applications.map(app => ({
            'Name': app.name,
            'Phone Number': app.phoneNumber,
            'Email': app.email,
            'Class': app.class,
            'Teacher Name': app.teacherName,
            'Teacher Email': app.teacherEmail,
            'Status': app.status,
            'Applied At': new Date(app.appliedAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Volunteers');

        // Set column widths
        worksheet['!cols'] = [
            { wch: 25 }, { wch: 15 }, { wch: 30 },
            { wch: 15 }, { wch: 25 }, { wch: 30 },
            { wch: 12 }, { wch: 15 }
        ];

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        const filename = `volunteers_${gig.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send duty leave email to teacher
// @route   POST /api/volunteers/:id/duty-leave-email
// @access  Private (Organizer/Admin)
export const sendDutyLeaveEmail = async (req, res) => {
    try {
        const application = await VolunteerApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const gig = await Gig.findById(application.opportunityId);
        if (!gig || gig.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: application.teacherEmail,
            subject: 'Volunteer Duty Leave Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1E293B; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">
                        Volunteer Duty Leave Request
                    </h2>
                    <p>Dear ${application.teacherName},</p>
                    <p>The student <strong>${application.name}</strong> will be volunteering for the event
                    "<strong>${gig.title}</strong>".</p>
                    <p>Kindly grant duty leave for participation.</p>
                    <div style="margin-top: 20px; padding: 15px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                        <p style="margin: 0;"><strong>Student:</strong> ${application.name}</p>
                        <p style="margin: 5px 0;"><strong>Class:</strong> ${application.class}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${application.email}</p>
                        <p style="margin: 5px 0;"><strong>Event:</strong> ${gig.title}</p>
                        <p style="margin: 5px 0;"><strong>Deadline:</strong> ${new Date(gig.deadline).toLocaleDateString()}</p>
                    </div>
                    <p style="margin-top: 20px; color: #64748B; font-size: 0.85rem;">
                        This is an automated message from SkillSync.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: `Duty leave email sent to ${application.teacherEmail}` });
    } catch (error) {
        console.error('Email send error:', error);
        res.status(500).json({ message: 'Failed to send email. Check SMTP configuration.' });
    }
};

// @desc    Upload certificate template for an opportunity
// @route   POST /api/volunteers/opportunity/:opportunityId/certificate-template
// @access  Private (Organizer/Admin)
export const uploadCertificateTemplate = async (req, res) => {
    try {
        const gig = await Gig.findById(req.params.opportunityId);
        if (!gig || gig.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        gig.certificateTemplate = `/uploads/${req.file.filename}`;
        await gig.save();

        res.json({
            message: 'Certificate template uploaded',
            certificateTemplate: gig.certificateTemplate
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
