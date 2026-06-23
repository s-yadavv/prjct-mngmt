import React, { useState, useEffect } from 'react';
import { useBoard } from '../../context/BoardContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './TaskModal.css';

const TaskModal = ({ task, onClose, boardId }) => {
  const { updateTask, deleteTask } = useBoard();
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    labels: task.labels?.join(', ') || '',
    assignees: task.assignees?.map((a) => a._id) || [],
    checklist: task.checklist || [],
  });
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState('');

  useEffect(() => {
    api.get('/users').then(({ data }) => setUsers(data.users)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTask(task._id, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: form.dueDate || null,
        labels: form.labels.split(',').map((l) => l.trim()).filter(Boolean),
        assignees: form.assignees,
        checklist: form.checklist,
      });
      toast.success('Task updated');
      onClose();
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(task._id);
      toast.success('Task deleted');
      onClose();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const toggleAssignee = (userId) => {
    setForm((p) => ({
      ...p,
      assignees: p.assignees.includes(userId)
        ? p.assignees.filter((id) => id !== userId)
        : [...p.assignees, userId],
    }));
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setForm((p) => ({
      ...p,
      checklist: [...p.checklist, { text: newCheckItem.trim(), completed: false }],
    }));
    setNewCheckItem('');
  };

  const toggleCheck = (idx) => {
    setForm((p) => ({
      ...p,
      checklist: p.checklist.map((c, i) => i === idx ? { ...c, completed: !c.completed } : c),
    }));
  };

  const removeCheck = (idx) => {
    setForm((p) => ({ ...p, checklist: p.checklist.filter((_, i) => i !== idx) }));
  };

  const doneCount = form.checklist.filter((c) => c.completed).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <input
            className="task-title-input"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="task-modal-body">
          <div className="task-modal-main">
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Add a description..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Checklist {form.checklist.length > 0 && `(${doneCount}/${form.checklist.length})`}
              </label>
              {form.checklist.length > 0 && (
                <div className="checklist-progress">
                  <div className="checklist-bar">
                    <div className="checklist-fill" style={{ width: `${(doneCount / form.checklist.length) * 100}%` }} />
                  </div>
                  <span>{Math.round((doneCount / form.checklist.length) * 100)}%</span>
                </div>
              )}
              <div className="checklist-items">
                {form.checklist.map((item, idx) => (
                  <div key={idx} className="checklist-item">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleCheck(idx)}
                      className="check-input"
                    />
                    <span className={item.completed ? 'check-done' : ''}>{item.text}</span>
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeCheck(idx)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="checklist-add">
                <input
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="Add item..."
                  onKeyDown={(e) => e.key === 'Enter' && addCheckItem()}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={addCheckItem}>Add</button>
              </div>
            </div>
          </div>

          <div className="task-modal-sidebar">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Labels (comma-separated)</label>
              <input value={form.labels} onChange={(e) => setForm((p) => ({ ...p, labels: e.target.value }))} placeholder="design, frontend" />
            </div>

            <div className="form-group">
              <label className="form-label">Assignees</label>
              <div className="assignees-list">
                {users.map((u) => (
                  <label key={u._id} className={`assignee-option ${form.assignees.includes(u._id) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={form.assignees.includes(u._id)} onChange={() => toggleAssignee(u._id)} style={{ display: 'none' }} />
                    <div className="assignee-avatar">{u.name[0].toUpperCase()}</div>
                    <div className="assignee-info">
                      <span className="assignee-name">{u.name}</span>
                      <span className="assignee-role">{u.role}</span>
                    </div>
                    {form.assignees.includes(u._id) && <span className="check-mark">✓</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="task-meta-info">
              <p>Created by <strong>{task.createdBy?.name || 'Unknown'}</strong></p>
              <p>Created {format(new Date(task.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
