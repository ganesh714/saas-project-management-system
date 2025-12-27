const express = require('express');
const router = express.Router();
const { createProject, getProjects, updateProject, deleteProject } = require('../controllers/projectController');
const { createTask, getTasks } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

router.route('/:projectId')
    .put(protect, updateProject)
    .delete(protect, deleteProject);

router.route('/:projectId/tasks')
    .post(protect, createTask)
    .get(protect, getTasks);

module.exports = router;
