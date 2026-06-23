import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import ListColumn from '../components/Board/ListColumn';
import TaskCard from '../components/Board/TaskCard';
import toast from 'react-hot-toast';
import './BoardPage.css';

const BoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentBoard, lists, tasks,
    loadingBoard, fetchBoard,
    createList, moveTask, reorderLists, reorderTasks, setTasks,
  } = useBoard();

  const [activeTask, setActiveTask] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => { fetchBoard(id); }, [id, fetchBoard]);

  const getTasksByList = useCallback(
    (listId) => tasks.filter((t) => t.list === listId).sort((a, b) => a.position - b.position),
    [tasks]
  );

  const handleDragStart = ({ active }) => {
    const task = tasks.find((t) => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const isListDrag = String(active.id).startsWith('list-');
    if (isListDrag) {
      const oldIdx = lists.findIndex((l) => `list-${l._id}` === active.id);
      const newIdx = lists.findIndex((l) => `list-${l._id}` === over.id);
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderLists(arrayMove(lists, oldIdx, newIdx));
      }
      return;
    }

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    let targetListId = over.id;
    const overTask = tasks.find((t) => t._id === over.id);
    if (overTask) targetListId = overTask.list;

    const isValidList = lists.some((l) => l._id === targetListId);
    if (!isValidList) return;

    const targetTasks = tasks
      .filter((t) => t.list === targetListId && t._id !== activeTask._id)
      .sort((a, b) => a.position - b.position);

    let newPosition = targetTasks.length;

    if (overTask && overTask.list === targetListId) {
      const overIdx = targetTasks.findIndex((t) => t._id === over.id);
      newPosition = overIdx >= 0 ? overIdx : targetTasks.length;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t._id === activeTask._id ? { ...t, list: targetListId, position: newPosition } : t
      )
    );

    const newListTasks = [
      ...targetTasks.slice(0, newPosition),
      { ...activeTask, list: targetListId },
      ...targetTasks.slice(newPosition),
    ];
    reorderTasks(targetListId, newListTasks);

    try {
      await moveTask(activeTask._id, targetListId, newPosition, id);
    } catch {
      toast.error('Failed to move task');
      fetchBoard(id);
    }
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    try {
      await createList(id, newListTitle.trim());
      setNewListTitle('');
      setAddingList(false);
      toast.success('List added');
    } catch {
      toast.error('Failed to add list');
    }
  };

  if (loadingBoard) return (
    <div className="board-loading">
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!currentBoard) return (
    <div className="board-error">
      <h2>Board not found</h2>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );

  return (
    <div className="board-page">
      <div className="board-topbar">
        <div className="board-topbar-left">
          <button className="btn btn-ghost btn-sm back-btn" onClick={() => navigate('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Boards
          </button>
          <div className="board-color-indicator" style={{ background: currentBoard.color }} />
          <h1 className="board-title">{currentBoard.title}</h1>
          {currentBoard.description && (
            <span className="board-description-badge">{currentBoard.description}</span>
          )}
        </div>
        <div className="board-topbar-right">
          <div className="board-members-row">
            {currentBoard.members?.slice(0, 5).map((m) => (
              <div key={m.user?._id} className="board-member-avatar" title={`${m.user?.name} (${m.role})`}>
                {m.user?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          <span className="board-role-tag">{user?.role}</span>
        </div>
      </div>

      <div className="board-canvas">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lists.map((l) => `list-${l._id}`)} strategy={horizontalListSortingStrategy}>
            <div className="lists-container">
              {lists.map((list) => (
                <ListColumn
                  key={list._id}
                  list={list}
                  tasks={getTasksByList(list._id)}
                  boardId={id}
                />
              ))}

              <div className="add-list-wrapper">
                {addingList ? (
                  <form className="add-list-form" onSubmit={handleAddList}>
                    <input
                      autoFocus
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="List title..."
                      onKeyDown={(e) => e.key === 'Escape' && setAddingList(false)}
                    />
                    <div className="add-list-actions">
                      <button type="submit" className="btn btn-primary btn-sm">Add List</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddingList(false)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button className="add-list-btn" onClick={() => setAddingList(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add List
                  </button>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} onClick={() => {}} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default BoardPage;
