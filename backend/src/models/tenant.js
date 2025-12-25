const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tenant = sequelize.define('Tenant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    subdomain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'suspended'),
        defaultValue: 'active',
    },
    plan: {
        type: DataTypes.ENUM('free', 'pro', 'enterprise'),
        defaultValue: 'free',
    },
    // Subscription limits (denormalized for quick access)
    maxUsers: {
        type: DataTypes.INTEGER,
        defaultValue: 5, // Free plan default
    },
    maxProjects: {
        type: DataTypes.INTEGER,
        defaultValue: 3, // Free plan default
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['subdomain']
        }
    ]
});

module.exports = Tenant;
