const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { boardAccess } = require('../middleware/boardAccess');

const router = express.Router();
router.use(protect);

router.post('/list/:listId', protect, async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assignees, labels, board } = req.body;
    const count = await Task.countDocuments({ list: req.params.listId, isArchived: false });
    const task = await Task.create({
      title,
      description,
      list: req.params.listId,
      board,
      position: count,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignees: assignees || [],
      labels: labels || [],
      createdBy: req.user._id,
    });
    await task.populate('assignees', 'name email avatar');
    await task.populate('createdBy', 'name');
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { title, description, priority, dueDate, assignees, labels, list, position, checklist } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, priority, dueDate, assignees, labels, list, position, checklist },
      { new: true, runValidators: true }
    )
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name');
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { isArchived: true });
    res.json({ message: 'Task archived' });
  } catch (err) {
    next(err);
  }
});

router.patch('/move/:id', protect, async (req, res, next) => {
  try {
    const { listId, position, boardId } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { list: listId, position, board: boardId },
      { new: true }
    )
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name');
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.patch('/reorder/:listId', protect, async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    const updates = orderedIds.map((id, index) =>
      Task.findByIdAndUpdate(id, { position: index })
    );
    await Promise.all(updates);
    res.json({ message: 'Tasks reordered' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
