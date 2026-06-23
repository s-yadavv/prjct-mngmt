import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

const ROLES = ['member', 'manager', 'admin'];

const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.patch(`/users/${userId}/deactivate`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast.success('User deactivated');
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = { admin: 0, manager: 0, member: 0 };
  users.forEach((u) => roleCounts[u.role]++);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>User Management</h1>
          <p className="admin-subtitle">Manage team members and their access levels</p>
        </div>
      </div>

      <div className="admin-stats">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className={`stat-card stat-${role}`}>
            <span className="stat-count">{count}</span>
            <span className="stat-label">{role}s</span>
          </div>
        ))}
        <div className="stat-card">
          <span className="stat-count">{users.length}</span>
          <span className="stat-label">Total users</span>
        </div>
      </div>

      <div className="admin-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          style={{ paddingLeft: '2rem' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto' }} />
        </div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className={u._id === currentUser?._id ? 'current-user' : ''}>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell-avatar">{u.name[0].toUpperCase()}</div>
                      <span className="user-cell-name">
                        {u.name}
                        {u._id === currentUser?._id && <span className="you-tag">you</span>}
                      </span>
                    </div>
                  </td>
                  <td className="cell-muted">{u.email}</td>
                  <td>
                    <select
                      className={`role-select role-${u.role}`}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={u._id === currentUser?._id}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="cell-muted">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    {u._id !== currentUser?._id && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u._id)}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="table-empty">No users match your search</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
