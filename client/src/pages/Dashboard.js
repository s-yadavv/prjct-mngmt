import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Dashboard.css';

const COLORS = ['#7c6ff7', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#fb923c'];

const CreateBoardModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ title: '', description: '', color: COLORS[0] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Board</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Marketing Roadmap" required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What's this board for?" style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker">
                {COLORS.map((c) => (
                  <button key={c} type="button" className={`color-dot ${form.color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setForm((p) => ({ ...p, color: c }))} />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { boards, loadingBoards, fetchBoards, createBoard, deleteBoard } = useBoard();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const handleCreate = async (form) => {
    try {
      const board = await createBoard(form);
      toast.success('Board created!');
      navigate(`/board/${board._id}`);
    } catch {
      toast.error('Failed to create board');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Archive this board?')) return;
    try {
      await deleteBoard(id);
      toast.success('Board archived');
    } catch {
      toast.error('Failed to archive board');
    }
  };

  const canDelete = (board) =>
    user?.role === 'admin' || board.owner?._id === user?._id;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Your Boards</h1>
          <p className="dashboard-subtitle">Manage projects and collaborate with your team</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Board
        </button>
      </div>

      {loadingBoards ? (
        <div className="loading-state">
          <div className="spinner" style={{ width: 36, height: 36 }} />
          <p>Loading boards...</p>
        </div>
      ) : boards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No boards yet</h3>
          <p>Create your first board to get started</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Board</button>
        </div>
      ) : (
        <div className="boards-grid">
          {boards.map((board) => (
            <div key={board._id} className="board-card" onClick={() => navigate(`/board/${board._id}`)}>
              <div className="board-card-accent" style={{ background: board.color }} />
              <div className="board-card-body">
                <div className="board-card-header">
                  <div className="board-color-dot" style={{ background: board.color }} />
                  <h3 className="board-card-title">{board.title}</h3>
                  {canDelete(board) && (
                    <button className="btn btn-ghost btn-icon btn-sm board-delete" onClick={(e) => handleDelete(e, board._id)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                </div>
                {board.description && <p className="board-card-desc">{board.description}</p>}
                <div className="board-card-footer">
                  <div className="board-members">
                    {board.members?.slice(0, 4).map((m) => (
                      <div key={m.user?._id || m._id} className="member-avatar" title={m.user?.name}>
                        {m.user?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    ))}
                    {board.members?.length > 4 && (
                      <div className="member-avatar member-more">+{board.members.length - 4}</div>
                    )}
                  </div>
                  <span className="board-owner-label">
                    {board.owner?._id === user?._id ? 'Owner' : `by ${board.owner?.name}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
};

export default Dashboard;
