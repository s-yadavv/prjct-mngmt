const Board = require('../models/Board');

const boardAccess = (minRole = 'member') => async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.params.id || req.body.board;
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const isOwner = board.owner.toString() === req.user._id.toString();
    const memberEntry = board.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isGlobalAdmin = req.user.role === 'admin';

    if (!isOwner && !memberEntry && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Access denied to this board' });
    }

    const roleHierarchy = { member: 1, manager: 2, admin: 3 };
    const userBoardRole = isOwner || isGlobalAdmin ? 'admin' : memberEntry?.role || 'member';

    if (roleHierarchy[userBoardRole] < roleHierarchy[minRole]) {
      return res.status(403).json({ message: 'Insufficient board permissions' });
    }

    req.board = board;
    req.userBoardRole = userBoardRole;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { boardAccess };
