import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, CreditCard as Edit2, Trash2, CheckCircle, Circle, Clock, AlertCircle, Users } from 'lucide-react';
import { Task, User } from '../types';
import * as tasksApi from '../api/tasksApi';
import * as authApi from '../api/authApi';

export const Dashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as Task['status'],
    priority: 'medium' as Task['priority']
  });

  useEffect(() => {
    loadTasks();
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [token]);

  const loadTasks = () => {
    const authHeader = `Bearer ${token}`;
    const response = tasksApi.getTasks(authHeader);

    if (response.success && response.data) {
      setTasks(response.data);
    } else {
      setError(response.error?.message || 'Failed to load tasks');
    }
  };

  const loadUsers = () => {
    const authHeader = `Bearer ${token}`;
    const response = authApi.getAllUsers(authHeader);

    if (response.success && response.data) {
      setUsers(response.data);
    } else if (response.error?.message === 'Access denied. Admin role required.') {
      // Ignore silently for non-admins
    } else if (response.error?.message) {
      setError(response.error.message);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation for better UX
    if (!formData.title || formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      return;
    }

    const authHeader = `Bearer ${token}`;
    const response = tasksApi.createTask(authHeader, formData);

    if (response.success && response.data) {
      setTasks([...tasks, response.data]);
      setSuccess('Task created successfully');
      setShowCreateModal(false);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      const validationMsgs = response.error?.errors?.map(e => `${e.field}: ${e.message}`) || [];
      const message = validationMsgs.length > 0 ? validationMsgs.join(', ') : (response.error?.message || 'Failed to create task');
      setError(message);
    }
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setError('');
    if (formData.title && formData.title.trim().length > 0 && formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters long');
      return;
    }
    const authHeader = `Bearer ${token}`;
    const response = tasksApi.updateTask(authHeader, editingTask.id, formData);

    if (response.success && response.data) {
      setTasks(tasks.map(t => t.id === editingTask.id ? response.data! : t));
      setSuccess('Task updated successfully');
      setEditingTask(null);
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      const validationMsgs = response.error?.errors?.map(e => `${e.field}: ${e.message}`) || [];
      const message = validationMsgs.length > 0 ? validationMsgs.join(', ') : (response.error?.message || 'Failed to update task');
      setError(message);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const authHeader = `Bearer ${token}`;
    const response = tasksApi.deleteTask(authHeader, taskId);

    if (response.success) {
      setTasks(tasks.filter(t => t.id !== taskId));
      setSuccess('Task deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(response.error?.message || 'Failed to delete task');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium'
    });
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority
    });
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Taskbook</h1>
              <p className="text-sm text-gray-600">Hi {user?.fullName}, here’s what’s on your plate.</p>
            </div>
            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                  Admin
                </span>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your tasks</h2>
            <p className="text-gray-600">A short list beats a long memory.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            New task
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">You’re all caught up. Add the first task to get rolling.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="card p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                {task.description && (
                  <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {task.status.replace('_', ' ')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {user?.role === 'admin' && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-gray-900">All users</h3>
              </div>
              <button onClick={loadUsers} className="btn-secondary">Refresh</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>No users to show.</td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="border-t border-slate-100">
                        <td className="px-4 py-2">{u.fullName}</td>
                        <td className="px-4 py-2 text-slate-600">{u.email}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${u.role === 'admin' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {(showCreateModal || editingTask) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>

            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
