const express = require('express');
const { body, param } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const router = express.Router();

// @desc    Get all users (admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
router.get('/', protect, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await User.countDocuments({ isActive: true });
    const users = await User.find({ isActive: true })
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin or Own Profile
router.get('/:id', 
  protect,
  param('id').isMongoId().withMessage('Invalid user ID'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Check if user is accessing their own profile or is admin
      if (req.user._id.toString() !== req.params.id && 
          !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this profile'
        });
      }

      const user = await User.findById(req.params.id);

      if (!user || !user.isActive) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Update user profile
// @route   PUT /api/v1/users/:id
// @access  Private/Own Profile or Admin
router.put('/:id',
  protect,
  param('id').isMongoId().withMessage('Invalid user ID'),
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('profile.phoneNumber')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please enter a valid phone number'),
    body('profile.address.country')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be between 2 and 100 characters')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Check if user is updating their own profile or is admin
      if (req.user._id.toString() !== req.params.id && 
          !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this profile'
        });
      }

      const allowedFields = [
        'firstName',
        'lastName',
        'profile.avatar',
        'profile.phoneNumber',
        'profile.dateOfBirth',
        'profile.gender',
        'profile.address',
        'profile.sustainabilityPreferences'
      ];

      // Only admins can update role and isActive
      if (['admin', 'super_admin'].includes(req.user.role)) {
        allowedFields.push('role', 'isActive');
      }

      // Filter out non-allowed fields
      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true
        }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
);

// @desc    Deactivate user account
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin or Own Account
router.delete('/:id',
  protect,
  param('id').isMongoId().withMessage('Invalid user ID'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Check if user is deleting their own account or is admin
      if (req.user._id.toString() !== req.params.id && 
          !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this account'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
