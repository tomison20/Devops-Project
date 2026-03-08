import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationRequest from '../models/OrganizationRequest.js';
import jwt from 'jsonwebtoken';
import axios from 'axios'; // For EmailJS REST API

// Generate JWT and set as httpOnly cookie
const generateToken = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return token;
};

// Send welcome email via EmailJS REST API
const sendWelcomeEmail = async (user) => {
    try {
        await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
                to_name: user.name,
                to_email: user.email,
                message: `Welcome to SkillSync, ${user.name}! Your account has been created successfully.`,
            },
        });
        console.log('Welcome email sent to:', user.email);
    } catch (error) {
        console.error('Failed to send welcome email:', error.message);
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, instituteCode, role } = req.body;

        if (!name || !email || !password || !instituteCode) {
            return res.status(400).json({ message: 'Please provide all required fields, including Institute Code' });
        }

        // Validate Institute Code (Strict)
        const organization = await Organization.findOne({ uniqueCode: instituteCode.toUpperCase() });
        if (!organization) {
            return res.status(400).json({
                message: 'Invalid Institute Code. If your college is not registered, please submit a Request College form.'
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            organization: organization._id,
            role: role || 'student',
            userType: role === 'organizer' ? 'organizer' : 'freelancer'
        });

        if (user) {
            const token = generateToken(res, user._id);

            sendWelcomeEmail(user);

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: {
                    name: organization.name,
                    id: organization._id,
                    uniqueCode: organization.uniqueCode
                },
                token
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Request a new organization
// @route   POST /api/auth/request-org
// @access  Public
export const requestOrganization = async (req, res) => {
    try {
        const { name, code, domain, requesterName, requesterEmail } = req.body;

        if (!name || !code || !requesterName || !requesterEmail) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if org or request already exists
        const orgExists = await Organization.findOne({ uniqueCode: code.toUpperCase() });
        if (orgExists) {
            return res.status(400).json({ message: 'An organization with this code already exists' });
        }

        const requestExists = await OrganizationRequest.findOne({ code: code.toUpperCase(), status: 'pending' });
        if (requestExists) {
            return res.status(400).json({ message: 'A request for this organization is already pending approval' });
        }

        const orgRequest = await OrganizationRequest.create({
            name,
            code: code.toUpperCase(),
            domain,
            requesterName,
            requesterEmail
        });

        res.status(201).json({ message: 'Request submitted successfully. An admin will review it soon.', request: orgRequest });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).populate('organization', 'name uniqueCode');

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(res, user._id);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
                token
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        if (!req.user?._id) {
            res.status(401);
            throw new Error('Not authorized, no user context');
        }

        const user = await User.findById(req.user._id).select('-password').populate('organization', 'name uniqueCode');

        if (user) {
            res.json(user);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        res.status(res.statusCode === 200 ? 404 : res.statusCode).json({ message: error.message });
    }
};

// @desc    Update user profile (social links, headline, bio, skills)
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { headline, bio, skills, github, linkedin, twitter, portfolioWebsite } = req.body;

        if (headline !== undefined) user.headline = headline;
        if (bio !== undefined) user.bio = bio;
        if (skills !== undefined) user.skills = skills;
        if (github !== undefined) user.github = github;
        if (linkedin !== undefined) user.linkedin = linkedin;
        if (twitter !== undefined) user.twitter = twitter;
        if (portfolioWebsite !== undefined) user.portfolioWebsite = portfolioWebsite;

        const updatedUser = await user.save();
        const populated = await User.findById(updatedUser._id).select('-password').populate('organization', 'name uniqueCode');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
