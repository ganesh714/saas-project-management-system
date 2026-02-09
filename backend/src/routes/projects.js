const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProject, updateProject, deleteProject } = require('../controllers/projectController');
const { createTask, getTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

router.route('/:projectId')
    .get(protect, getProject)
    .put(protect, updateProject)
    .delete(protect, deleteProject);

router.route('/:projectId/tasks')
    .post(protect, createTask)
    .get(protect, getTasks);

module.exports = router;
