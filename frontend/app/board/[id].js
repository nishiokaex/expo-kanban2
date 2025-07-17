import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import alert from '../../utils/alert';
import { 
  Text, 
  Card, 
  Button, 
  FAB, 
  Portal, 
  Modal, 
  TextInput, 
  Menu,
  Title,
  Paragraph,
  Chip,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useKanbanStore } from '../../stores/kanbanStore';
import CustomDroppableColumn from '../../components/CustomDroppableColumn';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = Math.min(300, width * 0.8);

export default function BoardDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { 
    boards, 
    currentBoard, 
    setCurrentBoard,
    addColumn,
    updateColumn,
    deleteColumn,
    addTask,
    updateTask,
    deleteTask,
    moveTask
  } = useKanbanStore();

  const [columnModalVisible, setColumnModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState({});
  const [columnTitle, setColumnTitle] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // カスタムドラッグ&ドロップフックを使用
  const {
    isDragActive,
    draggedTask,
    draggedColumn,
    registerColumn,
    unregisterColumn,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDropTarget,
    getDragInfo
  } = useDragAndDrop();

  useEffect(() => {
    if (id) {
      setCurrentBoard(id);
    }
  }, [id, setCurrentBoard]);

  useEffect(() => {
    if (!currentBoard && boards.length > 0) {
      router.replace('/');
    }
  }, [currentBoard, boards]);

  const handleAddColumn = () => {
    if (columnTitle.trim()) {
      addColumn(id, { title: columnTitle.trim() });
      setColumnTitle('');
      setColumnModalVisible(false);
      setSnackbarMessage('カラムを追加しました');
    }
  };

  const handleAddTask = () => {
    if (taskTitle.trim() && selectedColumnId) {
      addTask(id, selectedColumnId, {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setSelectedColumnId('');
      setTaskModalVisible(false);
      setSnackbarMessage('タスクを追加しました');
    }
  };

  const handleEditTask = () => {
    if (taskTitle.trim() && editingTask) {
      updateTask(id, editingTask.columnId, editingTask.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority
      });
      setEditingTask(null);
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('medium');
      setEditModalVisible(false);
      setSnackbarMessage('タスクを更新しました');
    }
  };

  const handleDeleteColumn = (columnId) => {
    const column = currentBoard?.columns.find(col => col.id === columnId);
    if (column) {
      alert(
        'カラムを削除',
        `「${column.title}」とその中のタスクをすべて削除しますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '削除', 
            style: 'destructive',
            onPress: () => {
              deleteColumn(id, columnId);
              setSnackbarMessage('カラムを削除しました');
            }
          }
        ]
      );
    }
  };

  const handleDeleteTask = (columnId, taskId) => {
    const column = currentBoard?.columns.find(col => col.id === columnId);
    const task = column?.tasks.find(t => t.id === taskId);
    if (task) {
      alert(
        'タスクを削除',
        `「${task.title}」を削除しますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: '削除', 
            style: 'destructive',
            onPress: () => {
              deleteTask(id, columnId, taskId);
              setSnackbarMessage('タスクを削除しました');
            }
          }
        ]
      );
    }
  };

  const openEditTaskModal = (task, columnId) => {
    setEditingTask({ ...task, columnId });
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority || 'medium');
    setEditModalVisible(true);
  };

  const toggleMenu = (taskId) => {
    setMenuVisible(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // カスタムドラッグ&ドロップのタスク移動処理
  const handleTaskMove = ({ task, sourceColumnId, targetColumnId, insertIndex }) => {
    console.log('Task move:', { 
      task: task.title, 
      sourceColumnId, 
      targetColumnId, 
      insertIndex 
    });
    
    try {
      moveTask(id, sourceColumnId, targetColumnId, task.id, insertIndex);
      setSnackbarMessage('タスクを移動しました');
    } catch (error) {
      console.error('Error moving task:', error);
      setSnackbarMessage('タスクの移動に失敗しました');
    }
  };

  // カラムの参照を管理
  const handleColumnRegister = (columnId, columnRef) => {
    registerColumn(columnId, columnRef);
  };

  const handleColumnUnregister = (columnId) => {
    unregisterColumn(columnId);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '不明';
    }
  };

  if (!currentBoard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>ボードが見つかりません</Text>
          <Button mode="contained" onPress={() => router.replace('/')}>
            ボード一覧に戻る
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Title>{currentBoard.name}</Title>
          {currentBoard.description ? (
            <Paragraph>{currentBoard.description}</Paragraph>
          ) : null}
        </View>

        <ScrollView 
          horizontal 
          style={styles.boardContainer}
          contentContainerStyle={styles.boardContent}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={!isDragActive}
        >
          {currentBoard.columns.map((column) => (
            <CustomDroppableColumn
              key={column.id}
              column={column}
              width={COLUMN_WIDTH}
              onAddTask={(columnId) => {
                setSelectedColumnId(columnId);
                setTaskModalVisible(true);
              }}
              onDeleteColumn={handleDeleteColumn}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              menuVisible={menuVisible}
              onToggleMenu={toggleMenu}
              onTaskDrop={handleTaskMove}
              isDragActive={isDragActive && isDropTarget(column.id)}
              draggedTask={draggedTask}
              onColumnRegister={handleColumnRegister}
              onColumnUnregister={handleColumnUnregister}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={(dragInfo) => handleDragEnd(dragInfo, handleTaskMove)}
            />
          ))}

          <View style={styles.addColumnContainer}>
            <Button
              mode="outlined"
              onPress={() => setColumnModalVisible(true)}
              style={styles.addColumnButton}
            >
              + カラム追加
            </Button>
          </View>
        </ScrollView>

      {/* カラム追加モーダル */}
      <Portal>
        <Modal
          visible={columnModalVisible}
          onDismiss={() => setColumnModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>新しいカラム</Title>
          <TextInput
            label="カラム名"
            value={columnTitle}
            onChangeText={setColumnTitle}
            mode="outlined"
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setColumnModalVisible(false)}
            >
              キャンセル
            </Button>
            <Button
              mode="contained"
              onPress={handleAddColumn}
              disabled={!columnTitle.trim()}
            >
              追加
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* タスク追加モーダル */}
      <Portal>
        <Modal
          visible={taskModalVisible}
          onDismiss={() => setTaskModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>新しいタスク</Title>
          <TextInput
            label="タスク名"
            value={taskTitle}
            onChangeText={setTaskTitle}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="説明（任意）"
            value={taskDescription}
            onChangeText={setTaskDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <View style={styles.priorityContainer}>
            <Text>優先度:</Text>
            <View style={styles.priorityButtons}>
              {['low', 'medium', 'high'].map((priority) => (
                <Button
                  key={priority}
                  mode={taskPriority === priority ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setTaskPriority(priority)}
                  style={styles.priorityButton}
                >
                  {getPriorityLabel(priority)}
                </Button>
              ))}
            </View>
          </View>
          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setTaskModalVisible(false)}
            >
              キャンセル
            </Button>
            <Button
              mode="contained"
              onPress={handleAddTask}
              disabled={!taskTitle.trim()}
            >
              追加
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* タスク編集モーダル */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>タスクを編集</Title>
          <TextInput
            label="タスク名"
            value={taskTitle}
            onChangeText={setTaskTitle}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="説明（任意）"
            value={taskDescription}
            onChangeText={setTaskDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <View style={styles.priorityContainer}>
            <Text>優先度:</Text>
            <View style={styles.priorityButtons}>
              {['low', 'medium', 'high'].map((priority) => (
                <Button
                  key={priority}
                  mode={taskPriority === priority ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setTaskPriority(priority)}
                  style={styles.priorityButton}
                >
                  {getPriorityLabel(priority)}
                </Button>
              ))}
            </View>
          </View>
          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setEditModalVisible(false)}
            >
              キャンセル
            </Button>
            <Button
              mode="contained"
              onPress={handleEditTask}
              disabled={!taskTitle.trim()}
            >
              更新
            </Button>
          </View>
        </Modal>
      </Portal>

        <Snackbar
          visible={!!snackbarMessage}
          onDismiss={() => setSnackbarMessage('')}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  boardContainer: {
    flex: 1,
  },
  boardContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: '100%',
  },
  addColumnContainer: {
    width: COLUMN_WIDTH,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addColumnButton: {
    width: '100%',
    height: 60,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});