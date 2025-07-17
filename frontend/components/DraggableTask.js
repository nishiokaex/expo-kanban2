import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Paragraph, Chip, Button, Menu } from 'react-native-paper';
import { Draggable } from '@mgcrea/react-native-dnd';

export default function DraggableTask({ 
  task, 
  index, 
  columnId, 
  onEdit, 
  onDelete, 
  menuVisible, 
  onToggleMenu 
}) {
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

  return (
    <Draggable
      id={task.id}
      type="task"
      data={{ task, columnId, index }}
    >
      <Card style={styles.taskCard}>
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
    </Draggable>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    marginBottom: 8,
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