const express = require('express');
const router = express.Router();
const {
    getTenant,
    getAllTenants,
    updateTenant,
    createTenantUser,
    getTenantUsers
} = require('../controllers/tenantController');
const { protect } = require('../middleware/auth');

// Super Admin List
router.get('/', protect, getAllTenants);

// Tenant Details
router.get('/:tenantId', protect, getTenant);
router.put('/:tenantId', protect, updateTenant);

// Tenant Users
router.post('/:tenantId/users', protect, createTenantUser);
router.get('/:tenantId/users', protect, getTenantUsers);

module.exports = router;
