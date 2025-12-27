const express = require('express');
const router = express.Router(); // This router will handle /projects/:projectId/tasks AND /tasks/...

const {
    createTask,
    getTasks,
    updateTaskStatus,
    updateTask,
    deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getTasks);
router.put('/:taskId', protect, updateTask);
router.patch('/:taskId/status', protect, updateTaskStatus);
router.delete('/:taskId', protect, deleteTask);

module.exports = router;
