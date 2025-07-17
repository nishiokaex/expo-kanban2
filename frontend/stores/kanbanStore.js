import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'kanban_data';

class KanbanStore {
  // 状態
  boards = [];
  currentBoard = null;
  loading = false;
  error = null;

  // ボード管理
  addBoard = (boardData) => {
    const newBoard = {
      id: Date.now().toString(),
      name: boardData.name,
      description: boardData.description || '',
      columns: [
        { id: '1', title: 'TODO', tasks: [] },
        { id: '2', title: 'DOING', tasks: [] },
        { id: '3', title: 'DONE', tasks: [] }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.boards.push(newBoard);
    this.saveToStorage();
  };

  updateBoard = (boardId, updates) => {
    const index = this.boards.findIndex(board => board.id === boardId);
    if (index !== -1) {
      this.boards[index] = {
        ...this.boards[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveToStorage();
    }
  };

  deleteBoard = (boardId) => {
    this.boards = this.boards.filter(board => board.id !== boardId);
    if (this.currentBoard?.id === boardId) {
      this.currentBoard = null;
    }
    this.saveToStorage();
  };

  setCurrentBoard = (boardId) => {
    this.currentBoard = this.boards.find(board => board.id === boardId) || null;
  };

  // カラム管理
  addColumn = (boardId, columnData) => {
    const board = this.boards.find(board => board.id === boardId);
    if (board) {
      const newColumn = {
        id: Date.now().toString(),
        title: columnData.title,
        tasks: []
      };
      board.columns.push(newColumn);
      board.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  };

  updateColumn = (boardId, columnId, updates) => {
    const board = this.boards.find(board => board.id === boardId);
    if (board) {
      const column = board.columns.find(col => col.id === columnId);
      if (column) {
        Object.assign(column, updates);
        board.updatedAt = new Date().toISOString();
        this.saveToStorage();
      }
    }
  };

  deleteColumn = (boardId, columnId) => {
    const board = this.boards.find(board => board.id === boardId);
    if (board) {
      board.columns = board.columns.filter(col => col.id !== columnId);
      board.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  };

  // タスク管理
  addTask = (boardId, columnId, taskData) => {
    const board = this.boards.find(board => board.id === boardId);
    if (board) {
      const column = board.columns.find(col => col.id === columnId);
      if (column) {
        const newTask = {
          id: Date.now().toString(),
          title: taskData.title,
          description: taskData.description || '',
          priority: taskData.priority || 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        column.tasks.push(newTask);
        board.updatedAt = new Date().toISOString();
        this.saveToStorage();
      }
    }
  };

  updateTask = (boardId, columnId, taskId, updates) => {
    const board = this.boards.find(board => board.id === boardId);
    if (board) {
      const column = board.columns.find(col => col.id === columnId);
      if (column) {
        const task = column.tasks.find(task => task.id === taskId);
        if (task) {
          Object.assign(task, updates, { updatedAt: new Date().toISOString() });
          board.updatedAt = new Date().toISOString();
          this.saveToStorage();
        }
      }
    }
  };

  deleteTask = (boardId, columnId, taskId) => {
    const board = this.boards.find(board => board.id === boardId);
    if (board) {
      const column = board.columns.find(col => col.id === columnId);
      if (column) {
        column.tasks = column.tasks.filter(task => task.id !== taskId);
        board.updatedAt = new Date().toISOString();
        this.saveToStorage();
      }
    }
  };

  // タスクの移動
  moveTask = (boardId, sourceColumnId, destColumnId, taskId, newIndex) => {
    const board = this.boards.find(board => board.id === boardId);
    if (board) {
      const sourceColumn = board.columns.find(col => col.id === sourceColumnId);
      const destColumn = board.columns.find(col => col.id === destColumnId);
      
      if (sourceColumn && destColumn) {
        const taskIndex = sourceColumn.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);
          movedTask.updatedAt = new Date().toISOString();
          destColumn.tasks.splice(newIndex, 0, movedTask);
          board.updatedAt = new Date().toISOString();
          this.saveToStorage();
        }
      }
    }
  };

  // データ永続化
  saveToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.boards));
    } catch (error) {
      this.error = 'データの保存に失敗しました';
      console.error('Save error:', error);
    }
  };

  loadFromStorage = async () => {
    try {
      this.loading = true;
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.boards = JSON.parse(stored);
      }
      this.error = null;
    } catch (error) {
      this.error = 'データの読み込みに失敗しました';
      console.error('Load error:', error);
    } finally {
      this.loading = false;
    }
  };

  // 初期化
  initialize = async () => {
    await this.loadFromStorage();
  };
}

export const useKanbanStore = create((set, get) => {
  const store = new KanbanStore();
  
  // ストアメソッドをzustandのsetで包む
  Object.keys(store).forEach(key => {
    if (typeof store[key] === 'function') {
      const originalMethod = store[key];
      store[key] = (...args) => {
        const result = originalMethod.apply(store, args);
        set({ ...store });
        return result;
      };
    }
  });

  // 初期化を実行
  store.initialize();

  return store;
});