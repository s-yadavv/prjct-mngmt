const express = require('express');
const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const { protect, requireRole } = require('../middleware/auth');
const { boardAccess } = require('../middleware/boardAccess');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const boards = await Board.find({
      isArchived: false,
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort('-updatedAt');

    const allBoards = req.user.role === 'admin'
      ? await Board.find({ isArchived: false })
          .populate('owner', 'name email avatar')
          .populate('members.user', 'name email avatar')
          .sort('-updatedAt')
      : boards;

    res.json({ boards: allBoards });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, color } = req.body;
    const board = await Board.create({
      title,
      description,
      color,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    await board.populate('owner', 'name email avatar');
    res.status(201).json({ board });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', boardAccess('member'), async (req, res, next) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    const lists = await List.find({ board: req.params.id, isArchived: false }).sort('position');
    const tasks = await Task.find({ board: req.params.id, isArchived: false })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name')
      .sort('position');
    res.json({ board, lists, tasks });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', boardAccess('manager'), async (req, res, next) => {
  try {
    const { title, description, color } = req.body;
    const board = await Board.findByIdAndUpdate(
      req.params.id,
      { title, description, color },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');
    res.json({ board });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', boardAccess('admin'), async (req, res, next) => {
  try {
    await Board.findByIdAndUpdate(req.params.id, { isArchived: true });
    res.json({ message: 'Board archived successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/members', boardAccess('manager'), async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const board = req.board;
    const existing = board.members.find((m) => m.user.toString() === userId);
    if (existing) return res.status(400).json({ message: 'User is already a member' });
    board.members.push({ user: userId, role: role || 'member' });
    await board.save();
    await board.populate('members.user', 'name email avatar');
    res.json({ board });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/members/:userId', boardAccess('manager'), async (req, res, next) => {
  try {
    const board = req.board;
    board.members = board.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await board.save();
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
