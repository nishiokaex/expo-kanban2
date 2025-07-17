import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Title, Text, Button } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import CustomDraggableTask from './CustomDraggableTask';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CustomDroppableColumn({ 
  column, 
  width, 
  onAddTask, 
  onDeleteColumn, 
  onEditTask, 
  onDeleteTask,
  menuVisible,
  onToggleMenu,
  onTaskDrop,
  isDragActive = false,
  draggedTask = null,
  onColumnRegister,
  onColumnUnregister,
  onDragStart,
  onDragMove,
  onDragEnd
}) {
  const [columnLayout, setColumnLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [taskLayouts, setTaskLayouts] = useState({});
  const columnRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  // アニメーション用のshared value
  const highlightOpacity = useSharedValue(0);
  const borderWidth = useSharedValue(0);
  const backgroundColor = useSharedValue(0);

  // ドラッグがアクティブな時のアニメーション
  // カラムの参照を親コンポーネントに登録
  useEffect(() => {
    if (onColumnRegister) {
      const columnInfo = {
        tasks: column.tasks,
        isPointInColumn: (x, y) => isPointInColumn(x, y),
        getInsertionIndex: (x, y) => getInsertionIndex(x, y)
      };
      onColumnRegister(column.id, columnInfo);
    }
    
    return () => {
      if (onColumnUnregister) {
        onColumnUnregister(column.id);
      }
    };
  }, [column.id, column.tasks, columnLayout, taskLayouts, onColumnRegister, onColumnUnregister]);

  useEffect(() => {
    if (isDragActive) {
      highlightOpacity.value = withSpring(1);
      borderWidth.value = withSpring(2);
      backgroundColor.value = withSpring(1);
    } else {
      highlightOpacity.value = withSpring(0);
      borderWidth.value = withSpring(0);
      backgroundColor.value = withSpring(0);
    }
  }, [isDragActive]);

  // カラムのレイアウト情報を取得
  const handleColumnLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    columnRef.current?.measureInWindow((windowX, windowY) => {
      setColumnLayout({
        x: windowX,
        y: windowY,
        width,
        height
      });
    });
  };

  // タスクのレイアウト情報を取得
  const handleTaskLayout = (taskId, event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setTaskLayouts(prev => ({
      ...prev,
      [taskId]: { x, y, width, height }
    }));
  };

  // 座標がカラム内にあるかチェック
  const isPointInColumn = (x, y) => {
    return (
      x >= columnLayout.x &&
      x <= columnLayout.x + columnLayout.width &&
      y >= columnLayout.y &&
      y <= columnLayout.y + columnLayout.height
    );
  };

  // 最適な挿入位置を計算
  const getInsertionIndex = (x, y) => {
    if (!isPointInColumn(x, y)) return -1;
    
    const relativeY = y - columnLayout.y;
    let insertIndex = 0;
    
    // 各タスクのY座標と比較して適切な位置を見つける
    for (let i = 0; i < column.tasks.length; i++) {
      const taskLayout = taskLayouts[column.tasks[i].id];
      if (taskLayout && relativeY > taskLayout.y + taskLayout.height / 2) {
        insertIndex = i + 1;
      }
    }
    
    return insertIndex;
  };

  // ドラッグ中のタスクの位置追跡
  const handleDragMove = (dragInfo) => {
    // 統合されたDnDフックで処理される
    // ここではローカルな視覚的フィードバックのみ処理
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (dragInfo) => {
    // 統合されたDnDフックで処理される
    // ここではローカルなクリーンアップのみ処理
  };

  // カラムのアニメーションスタイル
  const animatedColumnStyle = useAnimatedStyle(() => {
    const bgColor = interpolate(
      backgroundColor.value,
      [0, 1],
      [0xf1f5f9, 0xe0f2fe], // 通常色から強調色へ
      Extrapolate.CLAMP
    );
    
    return {
      backgroundColor: `#${bgColor.toString(16).padStart(6, '0')}`,
      borderWidth: borderWidth.value,
      borderColor: '#2196f3',
      opacity: interpolate(
        highlightOpacity.value,
        [0, 1],
        [1, 0.9],
        Extrapolate.CLAMP
      )
    };
  });

  // プレースホルダー用のアニメーションスタイル
  const placeholderStyle = useAnimatedStyle(() => {
    return {
      opacity: highlightOpacity.value,
      height: interpolate(
        highlightOpacity.value,
        [0, 1],
        [0, 50],
        Extrapolate.CLAMP
      )
    };
  });

  return (
    <Animated.View 
      style={[styles.column, { width }, animatedColumnStyle]}
      onLayout={handleColumnLayout}
      ref={columnRef}
    >
      <View style={styles.columnHeader}>
        <Title style={styles.columnTitle}>{column.title}</Title>
        <Text style={styles.taskCount}>
          {column.tasks.length} タスク
        </Text>
        <View style={styles.columnActions}>
          <Button
            mode="text"
            compact
            testID={`add-task-button-${column.id}`}
            onPress={(e) => {
              e.stopPropagation();
              onAddTask(column.id);
            }}
          >
            + タスク
          </Button>
          <Button
            mode="text"
            compact
            textColor="#ef4444"
            onPress={(e) => {
              e.stopPropagation();
              onDeleteColumn(column.id);
            }}
          >
            削除
          </Button>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.tasksContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDragActive} // ドラッグ中はスクロールを無効化
      >
        {column.tasks.map((task, index) => (
          <View
            key={task.id}
            onLayout={(event) => handleTaskLayout(task.id, event)}
          >
            <CustomDraggableTask
              task={task}
              index={index}
              columnId={column.id}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              menuVisible={menuVisible[task.id]}
              onToggleMenu={() => onToggleMenu(task.id)}
              onDragStart={(dragInfo) => {
                if (onDragStart) onDragStart(dragInfo);
              }}
              onDragMove={(dragInfo) => {
                if (onDragMove) onDragMove(dragInfo);
              }}
              onDragEnd={(dragInfo) => {
                if (onDragEnd) onDragEnd(dragInfo);
              }}
            />
          </View>
        ))}
        
        {/* ドラッグ中のプレースホルダー */}
        {isDragActive && (
          <Animated.View style={[styles.placeholder, placeholderStyle]}>
            <View style={styles.placeholderContent}>
              <Text style={styles.placeholderText}>ここにドロップ</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  column: {
    marginRight: 16,
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
  },
  columnHeader: {
    marginBottom: 12,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskCount: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  columnActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tasksContainer: {
    flex: 1,
    maxHeight: 400,
  },
  placeholder: {
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196f3',
    borderStyle: 'dashed',
    backgroundColor: '#e3f2fd',
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: 'bold',
  },
});