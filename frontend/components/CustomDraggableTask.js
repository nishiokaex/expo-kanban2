import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, Paragraph, Chip, Button, Menu } from 'react-native-paper';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CustomDraggableTask({ 
  task, 
  index, 
  columnId, 
  onEdit, 
  onDelete, 
  menuVisible, 
  onToggleMenu,
  onDragStart,
  onDragEnd,
  onDragMove,
  initialPosition = { x: 0, y: 0 }
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(1);
  const isDragging = useSharedValue(false);
  
  const gestureRef = useRef(null);
  const taskRef = useRef(null);

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

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      isDragging.value = true;
      scale.value = withSpring(1.05);
      opacity.value = withSpring(0.8);
      zIndex.value = 1000;
      
      // ドラッグ開始をメインスレッドに通知
      if (onDragStart) {
        runOnJS(onDragStart)({
          task,
          columnId,
          index,
          startX: event.absoluteX,
          startY: event.absoluteY
        });
      }
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      
      // ドラッグ中の位置をメインスレッドに通知
      if (onDragMove) {
        runOnJS(onDragMove)({
          task,
          columnId,
          index,
          currentX: event.absoluteX,
          currentY: event.absoluteY,
          translationX: event.translationX,
          translationY: event.translationY
        });
      }
    })
    .onEnd((event) => {
      isDragging.value = false;
      
      // アニメーションで元の位置に戻す
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
      zIndex.value = 1;
      
      // ドラッグ終了をメインスレッドに通知
      if (onDragEnd) {
        runOnJS(onDragEnd)({
          task,
          columnId,
          index,
          endX: event.absoluteX,
          endY: event.absoluteY,
          translationX: event.translationX,
          translationY: event.translationY
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
      elevation: isDragging.value ? 10 : 1, // Android用のz-index
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      scale.value,
      [1, 1.05],
      [0.1, 0.3],
      Extrapolate.CLAMP
    );
    
    return {
      shadowOpacity,
      shadowRadius: interpolate(
        scale.value,
        [1, 1.05],
        [2, 8],
        Extrapolate.CLAMP
      ),
      shadowOffset: {
        width: 0,
        height: interpolate(
          scale.value,
          [1, 1.05],
          [1, 4],
          Extrapolate.CLAMP
        )
      }
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, shadowStyle]}>
        <Card ref={taskRef} style={styles.taskCard}>
          <Card.Content>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {menuVisible ? (
                <Menu
                  visible={true}
                  onDismiss={onToggleMenu}
                  anchor={
                    <Button
                      mode="text"
                      compact
                      onPress={(e) => {
                        e.stopPropagation();
                        onToggleMenu();
                      }}
                    >
                      ⋮
                    </Button>
                  }
                >
                  <Menu.Item
                    title="編集"
                    onPress={() => {
                      onToggleMenu();
                      onEdit(task, columnId);
                    }}
                  />
                  <Menu.Item
                    title="削除"
                    onPress={() => {
                      onToggleMenu();
                      onDelete(columnId, task.id);
                    }}
                  />
                </Menu>
              ) : (
                <Button
                  mode="text"
                  compact
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleMenu();
                  }}
                >
                  ⋮
                </Button>
              )}
            </View>
            {task.description ? (
              <Paragraph style={styles.taskDescription}>
                {task.description}
              </Paragraph>
            ) : null}
            <View style={styles.taskFooter}>
              <Chip
                mode="outlined"
                textStyle={{ 
                  color: getPriorityColor(task.priority),
                  fontSize: 10 
                }}
                style={{ 
                  borderColor: getPriorityColor(task.priority),
                  height: 24
                }}
              >
                {getPriorityLabel(task.priority)}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});