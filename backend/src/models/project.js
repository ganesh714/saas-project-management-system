const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Tenants',
            key: 'id',
        },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'archived', 'completed'),
        defaultValue: 'active',
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['tenantId']
        }
    ]
});

module.exports = Project;
