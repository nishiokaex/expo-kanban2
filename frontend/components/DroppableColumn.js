import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Title, Text, Button } from 'react-native-paper';
import { Droppable } from '@mgcrea/react-native-dnd';
import DraggableTask from './DraggableTask';

export default function DroppableColumn({ 
  column, 
  width, 
  onAddTask, 
  onDeleteColumn, 
  onEditTask, 
  onDeleteTask,
  menuVisible,
  onToggleMenu
}) {
  return (
    <Droppable
      id={column.id}
      type="task"
      style={[styles.column, { width }]}
    >
      <View style={styles.columnHeader} pointerEvents="box-none">
        <Title style={styles.columnTitle}>{column.title}</Title>
        <Text style={styles.taskCount}>
          {column.tasks.length} タスク
        </Text>
        <View style={styles.columnActions} pointerEvents="box-none">
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

      <ScrollView style={styles.tasksContainer} pointerEvents="box-none">
        {column.tasks.map((task, index) => (
          <DraggableTask
            key={task.id}
            task={task}
            index={index}
            columnId={column.id}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            menuVisible={menuVisible[task.id]}
            onToggleMenu={() => onToggleMenu(task.id)}
          />
        ))}
      </ScrollView>
    </Droppable>
  );
}

const styles = StyleSheet.create({
  column: {
    marginRight: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
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
    maxHeight: 400,
  },
});