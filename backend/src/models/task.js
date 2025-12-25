const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
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
    projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Projects',
            key: 'id',
        },
        onDelete: 'CASCADE'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'completed'),
        defaultValue: 'todo',
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
    },
    assignedTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id',
        },
        onDelete: 'SET NULL'
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    }
}, {
    timestamps: true,
    indexes: [
        {
            fields: ['tenantId']
        },
        {
            fields: ['projectId']
        },
        {
            fields: ['tenantId', 'projectId']
        }
    ]
});

module.exports = Task;
