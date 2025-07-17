import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import alert from '../utils/alert';
import { 
  Card, 
  Title, 
  Paragraph, 
  FAB, 
  Button, 
  Text,
  Portal,
  Modal,
  TextInput,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useKanbanStore } from '../stores/kanbanStore';

export default function BoardListScreen() {
  const router = useRouter();
  const { boards, addBoard, deleteBoard, loading, error } = useKanbanStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleCreateBoard = () => {
    if (boardName.trim()) {
      addBoard({
        name: boardName.trim(),
        description: boardDescription.trim()
      });
      setBoardName('');
      setBoardDescription('');
      setModalVisible(false);
      setSnackbarVisible(true);
    }
  };

  const handleDeleteBoard = (boardId, boardName) => {
    alert(
      'ボードを削除',
      `「${boardName}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => deleteBoard(boardId)
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderBoardItem = ({ item }) => (
    <Card 
      style={styles.boardCard}
      onPress={() => router.push(`/board/${item.id}`)}
    >
      <Card.Content>
        <Title>{item.name}</Title>
        {item.description ? (
          <Paragraph>{item.description}</Paragraph>
        ) : null}
        <Text style={styles.dateText}>
          作成日: {formatDate(item.createdAt)}
        </Text>
        <Text style={styles.dateText}>
          更新日: {formatDate(item.updatedAt)}
        </Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            カラム: {item.columns.length}
          </Text>
          <Text style={styles.statText}>
            タスク: {item.columns.reduce((total, col) => total + col.tasks.length, 0)}
          </Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button 
          mode="outlined"
          onPress={() => router.push(`/board/${item.id}`)}
        >
          開く
        </Button>
        <Button 
          mode="text"
          textColor="#ef4444"
          onPress={() => handleDeleteBoard(item.id, item.name)}
        >
          削除
        </Button>
      </Card.Actions>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {boards.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>ボードがありません</Text>
            <Text style={styles.emptySubText}>
              右下の「+」ボタンから新しいボードを作成してください
            </Text>
          </View>
        ) : (
          <FlatList
            data={boards}
            renderItem={renderBoardItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setModalVisible(true)}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>新しいボード</Title>
          <TextInput
            label="ボード名"
            value={boardName}
            onChangeText={setBoardName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="説明（任意）"
            value={boardDescription}
            onChangeText={setBoardDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setModalVisible(false)}
            >
              キャンセル
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateBoard}
              disabled={!boardName.trim()}
            >
              作成
            </Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        ボードを作成しました
      </Snackbar>

      {error && (
        <Snackbar
          visible={!!error}
          onDismiss={() => {}}
          duration={3000}
        >
          {error}
        </Snackbar>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#64748b',
  },
  emptySubText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  boardCard: {
    marginBottom: 16,
    elevation: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});