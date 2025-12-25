const sequelize = require('../config/db');
const { Sequelize } = require('sequelize');

const Tenant = require('./tenant');
const User = require('./user');
const Project = require('./project');
const Task = require('./task');
const AuditLog = require('./auditLog');

// Relations
Tenant.hasMany(User, { foreignKey: 'tenantId' });
User.belongsTo(Tenant, { foreignKey: 'tenantId' });

Tenant.hasMany(Project, { foreignKey: 'tenantId' });
Project.belongsTo(Tenant, { foreignKey: 'tenantId' });

User.hasMany(Project, { foreignKey: 'createdBy' });
Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Tenant.hasMany(Task, { foreignKey: 'tenantId' });
Task.belongsTo(Tenant, { foreignKey: 'tenantId' });

Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(Task, { foreignKey: 'assignedTo' });
Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

Tenant.hasMany(AuditLog, { foreignKey: 'tenantId' });
AuditLog.belongsTo(Tenant, { foreignKey: 'tenantId' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

const db = {
    sequelize,
    Sequelize,
    Tenant,
    User,
    Project,
    Task,
    AuditLog
};

module.exports = db;
