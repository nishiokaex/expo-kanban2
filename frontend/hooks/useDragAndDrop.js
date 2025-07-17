import { useState, useCallback, useRef } from 'react';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const useDragAndDrop = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [hoveredColumn, setHoveredColumn] = useState(null);
  
  const columnsRef = useRef({});
  const dragStartTime = useRef(0);
  const dragStartPosition = useRef({ x: 0, y: 0 });

  // カラムの参照を登録
  const registerColumn = useCallback((columnId, columnInfo) => {
    columnsRef.current[columnId] = columnInfo;
  }, []);

  // カラムの参照を解除
  const unregisterColumn = useCallback((columnId) => {
    delete columnsRef.current[columnId];
  }, []);

  // ドラッグ開始
  const handleDragStart = useCallback((dragInfo) => {
    const { task, columnId, startX, startY } = dragInfo;
    
    dragStartTime.current = Date.now();
    dragStartPosition.current = { x: startX, y: startY };
    
    setIsDragActive(true);
    setDraggedTask(task);
    setDraggedColumn(columnId);
    setCurrentPosition({ x: startX, y: startY });
    
    console.log('Drag started:', { task: task.title, columnId, startX, startY });
  }, []);

  // ドラッグ中
  const handleDragMove = useCallback((dragInfo) => {
    const { currentX, currentY } = dragInfo;
    
    setCurrentPosition({ x: currentX, y: currentY });
    
    // 現在ホバー中のカラムを検出
    let newHoveredColumn = null;
    for (const [columnId, columnInfo] of Object.entries(columnsRef.current)) {
      if (columnInfo.isPointInColumn && columnInfo.isPointInColumn(currentX, currentY)) {
        newHoveredColumn = columnId;
        break;
      }
    }
    
    if (newHoveredColumn !== hoveredColumn) {
      setHoveredColumn(newHoveredColumn);
    }
  }, [hoveredColumn]);

  // ドラッグ終了
  const handleDragEnd = useCallback((dragInfo, onTaskMove) => {
    const { endX, endY, task, columnId: sourceColumnId } = dragInfo;
    const dragDuration = Date.now() - dragStartTime.current;
    const dragDistance = Math.sqrt(
      Math.pow(endX - dragStartPosition.current.x, 2) + 
      Math.pow(endY - dragStartPosition.current.y, 2)
    );
    
    console.log('Drag ended:', { 
      task: task.title, 
      sourceColumnId, 
      endX, 
      endY, 
      duration: dragDuration,
      distance: dragDistance
    });
    
    // ドロップ先のカラムを検出
    let targetColumnId = null;
    let insertIndex = -1;
    
    for (const [columnId, columnInfo] of Object.entries(columnsRef.current)) {
      if (columnInfo.isPointInColumn && columnInfo.isPointInColumn(endX, endY)) {
        targetColumnId = columnId;
        if (columnInfo.getInsertionIndex) {
          insertIndex = columnInfo.getInsertionIndex(endX, endY);
        }
        break;
      }
    }
    
    // 有効なドロップの場合
    if (targetColumnId && insertIndex !== -1 && onTaskMove) {
      // 最小ドラッグ距離のチェック（意図しないドロップを防ぐ）
      const MIN_DRAG_DISTANCE = 10;
      const MIN_DRAG_DURATION = 100;
      
      if (dragDistance >= MIN_DRAG_DISTANCE || dragDuration >= MIN_DRAG_DURATION) {
        // 同じカラム内で同じ位置にドロップした場合はスキップ
        if (sourceColumnId === targetColumnId) {
          // 元のインデックスを取得
          const sourceColumn = columnsRef.current[sourceColumnId];
          const originalIndex = sourceColumn?.tasks?.findIndex(t => t.id === task.id) ?? -1;
          
          if (originalIndex === insertIndex || originalIndex === insertIndex - 1) {
            console.log('Same position drop, skipping');
            resetDragState();
            return false;
          }
        }
        
        console.log('Valid drop:', { 
          task: task.title, 
          sourceColumnId, 
          targetColumnId, 
          insertIndex 
        });
        
        onTaskMove({
          task,
          sourceColumnId,
          targetColumnId,
          insertIndex
        });
        
        resetDragState();
        return true;
      }
    }
    
    console.log('Invalid drop, resetting');
    resetDragState();
    return false;
  }, []);

  // ドラッグ状態をリセット
  const resetDragState = useCallback(() => {
    setIsDragActive(false);
    setDraggedTask(null);
    setDraggedColumn(null);
    setCurrentPosition({ x: 0, y: 0 });
    setHoveredColumn(null);
    dragStartTime.current = 0;
    dragStartPosition.current = { x: 0, y: 0 };
  }, []);

  // 特定のカラムがドロップターゲットかどうか
  const isDropTarget = useCallback((columnId) => {
    return isDragActive && hoveredColumn === columnId;
  }, [isDragActive, hoveredColumn]);

  // 現在のドラッグ情報
  const getDragInfo = useCallback(() => {
    return {
      isDragActive,
      draggedTask,
      draggedColumn,
      currentPosition,
      hoveredColumn
    };
  }, [isDragActive, draggedTask, draggedColumn, currentPosition, hoveredColumn]);

  return {
    isDragActive,
    draggedTask,
    draggedColumn,
    currentPosition,
    hoveredColumn,
    registerColumn,
    unregisterColumn,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    resetDragState,
    isDropTarget,
    getDragInfo
  };
};