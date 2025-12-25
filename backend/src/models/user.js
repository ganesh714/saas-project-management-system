const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true, // Nullable for Super Admin
        references: {
            model: 'Tenants',
            key: 'id',
        },
        onDelete: 'CASCADE'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'tenant_admin', 'user'),
        defaultValue: 'user',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['email', 'tenantId'], // Unique email per tenant
        },
        {
            fields: ['tenantId']
        }
    ]
});

module.exports = User;
