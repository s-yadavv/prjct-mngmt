import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { useBoard } from '../../context/BoardContext';
import toast from 'react-hot-toast';
import './ListColumn.css';

const AddTaskForm = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle('');
  };

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      />
      <div className="add-task-actions">
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const ListColumn = ({ list, tasks, boardId }) => {
  const { createTask, deleteList, updateList } = useBoard();
  const [addingTask, setAddingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: list._id });

  const {
    attributes, listeners, setNodeRef: setSortRef,
    transform, transition, isDragging,
  } = useSortable({ id: `list-${list._id}`, data: { type: 'list' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddTask = async (title) => {
    try {
      await createTask(list._id, { title, board: boardId });
      toast.success('Task added');
      setAddingTask(false);
    } catch {
      toast.error('Failed to add task');
    }
  };

  const handleDeleteList = async () => {
    if (!window.confirm('Archive this list and all its tasks?')) return;
    try {
      await deleteList(list._id);
      toast.success('List archived');
    } catch {
      toast.error('Failed to archive list');
    }
  };

  const handleTitleSave = async () => {
    if (!newTitle.trim() || newTitle === list.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await updateList(list._id, { title: newTitle });
      setEditingTitle(false);
    } catch {
      toast.error('Failed to rename list');
    }
  };

  return (
    <div ref={setSortRef} style={style} className="list-column-wrapper">
      <div ref={setDropRef} className={`list-column ${isOver ? 'drop-over' : ''}`}>
        <div className="list-header" {...attributes} {...listeners}>
          {editingTitle ? (
            <input
              className="list-title-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false); }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="list-title" onDoubleClick={() => setEditingTitle(true)}>{list.title}</h3>
          )}
          <div className="list-header-right">
            <span className="list-count">{tasks.length}</span>
            <div className="list-menu-wrapper">
              <button className="btn btn-ghost btn-icon btn-sm list-menu-btn" onClick={(e) => { e.stopPropagation(); setShowMenu((p) => !p); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {showMenu && (
                <div className="list-dropdown">
                  <button onClick={() => { setEditingTitle(true); setShowMenu(false); }}>Rename</button>
                  <button className="danger" onClick={() => { handleDeleteList(); setShowMenu(false); }}>Archive list</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="list-tasks">
          <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onClick={() => setSelectedTask(task)} />
            ))}
          </SortableContext>
        </div>

        {addingTask ? (
          <AddTaskForm onAdd={handleAddTask} onCancel={() => setAddingTask(false)} />
        ) : (
          <button className="add-task-btn" onClick={() => setAddingTask(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add task
          </button>
        )}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          boardId={boardId}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default ListColumn;
