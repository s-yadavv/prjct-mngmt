import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const BoardContext = createContext(null);

export const BoardProvider = ({ children }) => {
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const fetchBoards = useCallback(async () => {
    setLoadingBoards(true);
    try {
      const { data } = await api.get('/boards');
      setBoards(data.boards);
    } catch {
      toast.error('Failed to load boards');
    } finally {
      setLoadingBoards(false);
    }
  }, []);

  const fetchBoard = useCallback(async (id) => {
    setLoadingBoard(true);
    try {
      const { data } = await api.get(`/boards/${id}`);
      setCurrentBoard(data.board);
      setLists(data.lists.sort((a, b) => a.position - b.position));
      setTasks(data.tasks);
    } catch {
      toast.error('Failed to load board');
    } finally {
      setLoadingBoard(false);
    }
  }, []);

  const createBoard = useCallback(async (boardData) => {
    const { data } = await api.post('/boards', boardData);
    setBoards((prev) => [data.board, ...prev]);
    return data.board;
  }, []);

  const updateBoard = useCallback(async (id, boardData) => {
    const { data } = await api.patch(`/boards/${id}`, boardData);
    setBoards((prev) => prev.map((b) => (b._id === id ? data.board : b)));
    setCurrentBoard(data.board);
    return data.board;
  }, []);

  const deleteBoard = useCallback(async (id) => {
    await api.delete(`/boards/${id}`);
    setBoards((prev) => prev.filter((b) => b._id !== id));
  }, []);

  const createList = useCallback(async (boardId, title) => {
    const { data } = await api.post(`/lists/board/${boardId}`, { title });
    setLists((prev) => [...prev, data.list]);
    return data.list;
  }, []);

  const updateList = useCallback(async (id, listData) => {
    const { data } = await api.patch(`/lists/${id}`, listData);
    setLists((prev) => prev.map((l) => (l._id === id ? data.list : l)));
    return data.list;
  }, []);

  const deleteList = useCallback(async (id) => {
    await api.delete(`/lists/${id}`);
    setLists((prev) => prev.filter((l) => l._id !== id));
    setTasks((prev) => prev.filter((t) => t.list !== id));
  }, []);

  const createTask = useCallback(async (listId, taskData) => {
    const { data } = await api.post(`/tasks/list/${listId}`, taskData);
    setTasks((prev) => [...prev, data.task]);
    return data.task;
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    const { data } = await api.patch(`/tasks/${id}`, taskData);
    setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
    return data.task;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  }, []);

  const moveTask = useCallback(async (taskId, listId, position, boardId) => {
    const { data } = await api.patch(`/tasks/move/${taskId}`, { listId, position, boardId });
    setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    return data.task;
  }, []);

  const reorderLists = useCallback((newLists) => {
    setLists(newLists);
    const orderedIds = newLists.map((l) => l._id);
    api.patch(`/lists/reorder/${currentBoard?._id}`, { orderedIds }).catch(() => {});
  }, [currentBoard]);

  const reorderTasks = useCallback((listId, newTasks) => {
    setTasks((prev) => {
      const otherTasks = prev.filter((t) => t.list !== listId);
      return [...otherTasks, ...newTasks];
    });
    const orderedIds = newTasks.map((t) => t._id);
    api.patch(`/tasks/reorder/${listId}`, { orderedIds }).catch(() => {});
  }, []);

  return (
    <BoardContext.Provider
      value={{
        boards, currentBoard, lists, tasks,
        loadingBoards, loadingBoard,
        fetchBoards, fetchBoard,
        createBoard, updateBoard, deleteBoard,
        createList, updateList, deleteList,
        createTask, updateTask, deleteTask,
        moveTask, reorderLists, reorderTasks,
        setTasks, setLists,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) throw new Error('useBoard must be used within BoardProvider');
  return context;
};
