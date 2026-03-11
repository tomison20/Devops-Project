import Event from '../models/Event.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Jimp, HorizontalAlign, VerticalAlign, loadFont } from 'jimp';
import { SANS_64_BLACK } from 'jimp/fonts';// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Organizer)
export const createEvent = async (req, res) => {
    try {
        const { title, description, date, location, roles, coOrganizers } = req.body;

        const event = await Event.create({
            title,
            description,
            date,
            location,
            roles,
            organizer: req.user._id,
            coOrganizers: coOrganizers || [],
            organization: req.user.organization // Multi-tenant scoping
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Private (Student/Organizer) - Updated access level for clarity
export const getEvents = async (req, res) => {
    try {
        // Scoped to organization
        const query = {
            organization: req.user.organization
        };

        const events = await Event.find(query).populate('organizer', 'name').sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email organization')
            .populate('coOrganizers', 'name email avatar')
            .populate('volunteers.user', 'name email avatar headline');
        if (event) res.json(event);
        else {
            res.status(404);
            throw new Error('Event not found');
        }
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private (Student)
export const registerForEvent = async (req, res) => {
    try {
        const { role, studentClass, teacherName, teacherEmail } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const roleData = event.roles.find(r => r.name === role);
        if (!roleData || roleData.filled >= roleData.capacity) {
            res.status(400);
            throw new Error('Role unavailable');
        }

        if (event.volunteers.some(v => v.user.toString() === req.user._id.toString())) {
            res.status(400);
            throw new Error('Already registered');
        }

        // Generate QR Hash simulation
        const qrHash = crypto.randomBytes(16).toString('hex');

        event.volunteers.push({
            user: req.user._id,
            role,
            class: studentClass || '',
            teacherName: teacherName || '',
            teacherEmail: teacherEmail || '',
            attendanceHash: qrHash
        });

        roleData.filled += 1;
        await event.save();

        res.status(201).json({ message: 'Registered', qrCode: qrHash });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Verify Attendance (QR Scan Simulation)
// @route   POST /api/events/:id/verify
// @access  Private (Organizer)
export const verifyAttendance = async (req, res) => {
    try {
        const { qrHash } = req.body;
        const event = await Event.findById(req.params.id);

        if (event.organizer.toString() !== req.user._id.toString() && !event.coOrganizers.some(id => id.toString() === req.user._id.toString())) {
            res.status(403);
            throw new Error('Not authorized');
        }

        const volunteer = event.volunteers.find(v => v.attendanceHash === qrHash);
        if (!volunteer) {
            res.status(404);
            throw new Error('Invalid QR Code');
        }

        if (volunteer.status === 'attended') {
            res.status(400);
            throw new Error('Already marked present');
        }

        volunteer.status = 'attended';
        await event.save();

        res.json({ message: 'Attendance verified', user: volunteer.user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Organizer)
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (event.organizer.toString() !== req.user._id.toString() && !event.coOrganizers.some(id => id.toString() === req.user._id.toString())) {
            res.status(403);
            throw new Error('Not authorized to update this event');
        }

        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Organizer)
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (event.organizer.toString() !== req.user._id.toString() && !event.coOrganizers.some(id => id.toString() === req.user._id.toString())) {
            res.status(403);
            throw new Error('Not authorized to delete this event');
        }

        await event.deleteOne();

        res.json({ message: 'Event removed perfectly' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Remove a volunteer from an event
// @route   DELETE /api/events/:id/volunteers/:volunteerId
// @access  Private (Organizer)
export const removeVolunteer = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (event.organizer.toString() !== req.user._id.toString() && !event.coOrganizers.some(id => id.toString() === req.user._id.toString())) {
            res.status(403);
            throw new Error('Not authorized');
        }

        // Find the volunteer to adjust role counts
        const volunteerIndex = event.volunteers.findIndex(v => v._id.toString() === req.params.volunteerId);
        
        if (volunteerIndex === -1) {
            res.status(404);
            throw new Error('Volunteer record not found');
        }

        const volunteerRole = event.volunteers[volunteerIndex].role;
        const roleData = event.roles.find(r => r.name === volunteerRole);

        if (roleData && roleData.filled > 0) {
            roleData.filled -= 1;
        }

        event.volunteers.splice(volunteerIndex, 1);
        await event.save();

        res.json({ message: 'Volunteer removed successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Export volunteer list to Excel for an event
// @route   GET /api/events/:id/export
// @access  Private (Organizer)
export const exportEventVolunteers = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('volunteers.user', 'name email headline course'); 

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString() && !event.coOrganizers.some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const data = event.volunteers.map(vol => ({
            'Name': vol.user?.name || 'Unknown',
            'Email': vol.user?.email || 'N/A',
            'Class/Course': vol.user?.course || 'N/A',
            'Headline': vol.user?.headline || 'N/A',
            'Role': vol.role,
            'Attendance Status': vol.status,
            'Registered At': new Date() // Since we don't have individual timestamps, just log export date or omit.
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Event Registrations');

        worksheet['!cols'] = [
            { wch: 30 }, { wch: 35 }, { wch: 25 }, { wch: 40 },
            { wch: 25 }, { wch: 20 }, { wch: 15 }
        ];

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        const filename = `event_registrations_${event.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Multer config for certificate template upload

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-cert-template-' + unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'));
    }
}).single('template');

// @desc    Upload certificate template for an event
// @route   POST /api/events/:id/certificate-template
// @access  Private (Organizer)
export const uploadCertificateTemplate = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        
        try {
            const event = await Event.findById(req.params.id);
            if (!event || (event.organizer.toString() !== req.user._id.toString() && !event.coOrganizers.some(id => id.toString() === req.user._id.toString()))) {
                return res.status(403).json({ message: 'Not authorized' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            event.certificateTemplate = `/uploads/${req.file.filename}`;
            await event.save();

            res.json({
                message: 'Certificate template uploaded',
                certificateTemplate: event.certificateTemplate
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    });
};

// @desc    Generate certificates for registered event volunteers
// @route   POST /api/events/:id/generate-certificates
// @access  Private (Organizer)
export const generateCertificates = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('volunteers.user', 'name');
        if (!event || (event.organizer.toString() !== req.user._id.toString() && !event.coOrganizers.some(id => id.toString() === req.user._id.toString()))) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!event.certificateTemplate) {
            return res.status(400).json({ message: 'No certificate template uploaded for this event' });
        }

        // Get all students who are registered or attended
        const validVolunteers = event.volunteers.filter(v => v.status === 'registered' || v.status === 'attended');

        console.log(`[DEBUG] Attempting generation. Total volunteers: ${event.volunteers.length}, Valid volunteers: ${validVolunteers.length}`);

        if (validVolunteers.length === 0) {
            console.log(`[DEBUG] Skipping because 0 valid volunteers. Volunteer statuses:`, event.volunteers.map(v => v.status));
            return res.status(400).json({ message: 'No eligible volunteers found to generate certificates for.' });
        }

        const templatePath = path.join(__dirname, '..', event.certificateTemplate.replace(/^\//,''));
        
        if (!fs.existsSync(templatePath)) {
            console.log('[DEBUG] Template missing at path:', templatePath);
            return res.status(404).json({ message: 'Template file not found on server' });
        }

        const certsDir = path.join(__dirname, '..', 'public', 'certificates');
        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
        }

        const font = await loadFont(SANS_64_BLACK);
        let generatedCount = 0;
        
        const { textX, textY } = req.body;
        const xOffset = textX && !isNaN(parseInt(textX)) ? parseInt(textX) : null;
        const yOffset = textY && !isNaN(parseInt(textY)) ? parseInt(textY) : null;

        for (const volunteer of validVolunteers) {
            if (!volunteer.user || !volunteer.user.name) {
                console.log('Skipping volunteer due to missing user or name:', volunteer);
                continue;
            }

            try {
                const image = await Jimp.read(templatePath);
                
                const isCustomPos = xOffset !== null || yOffset !== null;
                
                image.print({
                    font,
                    x: xOffset !== null ? xOffset : 0,
                    y: yOffset !== null ? yOffset : 0,
                    text: isCustomPos
                        ? volunteer.user.name
                        : { text: volunteer.user.name, alignmentX: HorizontalAlign.CENTER, alignmentY: VerticalAlign.MIDDLE },
                    maxWidth: isCustomPos ? image.bitmap.width - (xOffset || 0) : image.bitmap.width,
                    maxHeight: isCustomPos ? image.bitmap.height - (yOffset || 0) : image.bitmap.height
                });

                const filename = `cert_event_${volunteer._id}.png`;
                const outputPath = path.join(certsDir, filename);

                await image.write(outputPath);

                volunteer.certificateUrl = `/public/certificates/${filename}`;
                generatedCount++;
            } catch (err) {
                console.error(`Failed to generate cert for event volunteer ${volunteer.user.name}:`, err);
            }
        }

        await event.save();

        res.json({ 
            message: `Successfully generated ${generatedCount} certificates for event volunteers.`,
            count: generatedCount
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send duty leave email to teacher for an event volunteer
// @route   POST /api/events/:id/volunteers/:volunteerId/duty-leave-email
// @access  Private (Organizer/Admin)
export const sendDutyLeaveEmail = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('volunteers.user', 'name email');
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Verify organizer owns the event
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const volunteer = event.volunteers.id(req.params.volunteerId);
        if (!volunteer) {
            return res.status(404).json({ message: 'Volunteer not found in this event' });
        }

        if (!volunteer.teacherEmail) {
            return res.status(400).json({ message: 'Teacher email is not provided for this volunteer' });
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

        const studentName = volunteer.user ? volunteer.user.name : volunteer.name || 'Unknown Student';
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: volunteer.teacherEmail,
            subject: 'Event Volunteer Duty Leave Request',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1E293B; border-bottom: 2px solid #3B82F6; padding-bottom: 10px;">
                        Event Volunteer Duty Leave Request
                    </h2>
                    <p>Dear ${volunteer.teacherName || 'Teacher'},</p>
                    <p>The student <strong>${studentName}</strong> will be volunteering for the event
                    "<strong>${event.title}</strong>".</p>
                    <p>Kindly grant duty leave for participation.</p>
                    <div style="margin-top: 20px; padding: 15px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                        <p style="margin: 0;"><strong>Student:</strong> ${studentName}</p>
                        <p style="margin: 5px 0;"><strong>Class:</strong> ${volunteer.class || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Event:</strong> ${event.title}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                    </div>
                    <p style="margin-top: 20px; color: #64748B; font-size: 0.85rem;">
                        This is an automated message from SkillSync on behalf of the event organizers.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Duty leave email sent successfully to ' + volunteer.teacherEmail });
    } catch (error) {
        console.error('Duty leave email error:', error);
        res.status(500).json({ message: error.message });
    }
};
