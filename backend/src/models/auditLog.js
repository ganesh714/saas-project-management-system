const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: true, // Super admin actions might not have a tenant or might just be global
        references: {
            model: 'Tenants',
            key: 'id',
        },
        onDelete: 'SET NULL'
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id',
        },
        onDelete: 'SET NULL'
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    entityType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    entityId: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
    updatedAt: false, // Audit logs usually only have createdAt
    indexes: [
        {
            fields: ['tenantId']
        }
    ]
});

module.exports = AuditLog;
