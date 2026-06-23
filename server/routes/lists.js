const express = require('express');
const List = require('../models/List');
const { protect } = require('../middleware/auth');
const { boardAccess } = require('../middleware/boardAccess');

const router = express.Router();
router.use(protect);

router.post('/board/:boardId', boardAccess('member'), async (req, res, next) => {
  try {
    const { title } = req.body;
    const count = await List.countDocuments({ board: req.params.boardId, isArchived: false });
    const list = await List.create({
      title,
      board: req.params.boardId,
      position: count,
    });
    res.status(201).json({ list });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', protect, async (req, res, next) => {
  try {
    const { title, position } = req.body;
    const list = await List.findByIdAndUpdate(
      req.params.id,
      { title, position },
      { new: true }
    );
    res.json({ list });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    await List.findByIdAndUpdate(req.params.id, { isArchived: true });
    res.json({ message: 'List archived' });
  } catch (err) {
    next(err);
  }
});

router.patch('/reorder/:boardId', boardAccess('member'), async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    const updates = orderedIds.map((id, index) =>
      List.findByIdAndUpdate(id, { position: index })
    );
    await Promise.all(updates);
    res.json({ message: 'Lists reordered' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
