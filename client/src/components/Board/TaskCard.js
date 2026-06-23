import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, isToday } from 'date-fns';
import './TaskCard.css';

const priorityIcon = { low: '▽', medium: '◇', high: '▲', critical: '⬡' };

const TaskCard = ({ task, onClick }) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const duePast = dueDate && isPast(dueDate) && !isToday(dueDate);
  const dueToday = dueDate && isToday(dueDate);

  const checklistDone = task.checklist?.filter((c) => c.completed).length || 0;
  const checklistTotal = task.checklist?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-top">
        <div className="task-labels">
          {task.labels?.map((label, i) => (
            <span key={i} className="task-label">{label}</span>
          ))}
        </div>
        <span className={`task-priority priority-${task.priority}`} title={task.priority}>
          {priorityIcon[task.priority]}
        </span>
      </div>

      <p className="task-title">{task.title}</p>

      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}

      <div className="task-card-bottom">
        <div className="task-meta">
          {dueDate && (
            <span className={`task-due ${duePast ? 'overdue' : dueToday ? 'today' : ''}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {format(dueDate, 'MMM d')}
            </span>
          )}
          {checklistTotal > 0 && (
            <span className={`task-checklist ${checklistDone === checklistTotal ? 'done' : ''}`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              {checklistDone}/{checklistTotal}
            </span>
          )}
        </div>

        {task.assignees?.length > 0 && (
          <div className="task-assignees">
            {task.assignees.slice(0, 3).map((a) => (
              <div key={a._id} className="task-avatar" title={a.name}>
                {a.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
