<template>
  <DxxHeader :show-back="true">九球计分</DxxHeader>
  <div class="nine-ball dxx_wrap">
    <div class="content">
      <div class="players-section">
        <div class="section-header">
          <span>选手列表（可拖拽排序）</span>
          <van-button type="primary" size="small" plain @click="addPlayer">
            添加选手
          </van-button>
        </div>
        
        <div class="players-list">
          <div 
            v-for="(player, index) in players" 
            :key="index"
            class="player-card"
            :class="{ 
              active: currentPlayerIndex === index,
              dragging: dragIndex === index,
              'drag-over': dragOverIndex === index
            }"
            draggable="true"
            @click="selectPlayer(index)"
            @dragstart="handleDragStart($event, index)"
            @dragend="handleDragEnd"
            @dragover="handleDragOver($event, index)"
            @drop="handleDrop($event, index)"
          >
            <van-icon name="wap-nav" class="drag-handle" />
            <div class="player-info">
              <van-field 
                v-model="player.name" 
                :placeholder="`选手${index + 1}`"
                class="name-input"
                @click.stop
              />
            </div>
            <div class="player-score">{{ player.score }}</div>
            <van-icon 
              name="delete" 
              class="delete-btn"
              @click.stop="removePlayer(index)"
              v-if="players.length > 2"
            />
          </div>
        </div>
      </div>
      
      <div class="score-section">
        <div class="section-header">
          <span>普通计分</span>
        </div>
        
        <div class="score-buttons">
          <van-button 
            v-for="score in scoreOptions" 
            :key="score"
            type="primary"
            class="score-btn"
            @click="addScore(score)"
          >
            +{{ score }}
          </van-button>
        </div>
      </div>
      
      <div class="win-section">
        <div class="section-header">
          <span>胜利计分</span>
        </div>
        
        <div class="win-buttons">
          <van-button 
            type="success"
            class="win-btn"
            @click="bigGold"
          >
            大金
          </van-button>
          <van-button 
            type="warning"
            class="win-btn"
            @click="smallGold"
          >
            小金
          </van-button>
          <van-button 
            type="default"
            class="win-btn"
            @click="normalWin"
          >
            普胜
          </van-button>
        </div>
        
        <div class="win-desc">
          <p>大金：每人掏10分给赢家</p>
          <p>小金：每人掏4分给赢家</p>
          <p>普胜：上家掏4分给赢家</p>
        </div>
      </div>
      
      <div class="quick-actions">
        <van-button type="default" size="small" @click="undoScore">撤销</van-button>
        <van-button type="default" size="small" @click="foul">犯规(-1)</van-button>
      </div>
      
      <div class="game-actions">
        <van-button type="warning" plain block @click="newGame">新一局</van-button>
        <van-button type="danger" plain block @click="resetAll">重置比赛</van-button>
      </div>
      
      <div class="history-section" v-if="scoreHistory.length > 0">
        <div class="section-header">
          <span>得分记录</span>
        </div>
        <div class="history-list">
          <div 
            v-for="(record, index) in scoreHistory.slice().reverse()" 
            :key="index"
            class="history-item"
          >
            <span class="history-name">{{ record.name }}</span>
            <span class="history-score" :class="{ negative: record.score < 0 }">
              {{ record.score > 0 ? '+' : '' }}{{ record.score }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import DxxHeader from '@/components/DxxHeader.vue'

const currentPlayerIndex = ref(0)
const scoreOptions = [1, 4, 7, 10]
const dragIndex = ref(null)
const dragOverIndex = ref(null)

const players = ref([
  { name: '', score: 0 },
  { name: '', score: 0 }
])

const scoreHistory = ref([])

const handleDragStart = (e, index) => {
  dragIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', index)
}

const handleDragEnd = () => {
  dragIndex.value = null
  dragOverIndex.value = null
}

const handleDragOver = (e, index) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

const handleDrop = (e, targetIndex) => {
  e.preventDefault()
  const sourceIndex = dragIndex.value
  
  if (sourceIndex !== null && sourceIndex !== targetIndex) {
    const player = players.value.splice(sourceIndex, 1)[0]
    players.value.splice(targetIndex, 0, player)
    
    if (currentPlayerIndex.value === sourceIndex) {
      currentPlayerIndex.value = targetIndex
    } else if (sourceIndex < currentPlayerIndex.value && targetIndex >= currentPlayerIndex.value) {
      currentPlayerIndex.value--
    } else if (sourceIndex > currentPlayerIndex.value && targetIndex <= currentPlayerIndex.value) {
      currentPlayerIndex.value++
    }
    
    showToast('已调整顺序')
  }
  
  dragIndex.value = null
  dragOverIndex.value = null
}

const addPlayer = () => {
  if (players.value.length >= 8) {
    showToast('最多支持8位选手')
    return
  }
  players.value.push({ name: '', score: 0 })
  showToast(`已添加选手${players.value.length}`)
}

const removePlayer = (index) => {
  players.value.splice(index, 1)
  if (currentPlayerIndex.value >= players.value.length) {
    currentPlayerIndex.value = players.value.length - 1
  }
  showToast('已移除选手')
}

const selectPlayer = (index) => {
  currentPlayerIndex.value = index
}

const addScore = (score) => {
  const player = players.value[currentPlayerIndex.value]
  player.score += score
  
  scoreHistory.value.push({
    playerIndex: currentPlayerIndex.value,
    name: player.name || `选手${currentPlayerIndex.value + 1}`,
    score: score
  })
  
  const nextIndex = (currentPlayerIndex.value + 1) % players.value.length
  currentPlayerIndex.value = nextIndex
}

const bigGold = () => {
  const winnerIndex = currentPlayerIndex.value
  const winner = players.value[winnerIndex]
  const winnerName = winner.name || `选手${winnerIndex + 1}`
  
  players.value.forEach((player, index) => {
    if (index !== winnerIndex) {
      player.score -= 10
      scoreHistory.value.push({
        playerIndex: index,
        name: player.name || `选手${index + 1}`,
        score: -10,
        type: 'bigGold'
      })
    }
  })
  
  const totalWin = (players.value.length - 1) * 10
  winner.score += totalWin
  scoreHistory.value.push({
    playerIndex: winnerIndex,
    name: winnerName,
    score: totalWin,
    type: 'bigGold'
  })
  
  showToast(`${winnerName} 大金！+${totalWin}分`)
}

const smallGold = () => {
  const winnerIndex = currentPlayerIndex.value
  const winner = players.value[winnerIndex]
  const winnerName = winner.name || `选手${winnerIndex + 1}`
  
  players.value.forEach((player, index) => {
    if (index !== winnerIndex) {
      player.score -= 4
      scoreHistory.value.push({
        playerIndex: index,
        name: player.name || `选手${index + 1}`,
        score: -4,
        type: 'smallGold'
      })
    }
  })
  
  const totalWin = (players.value.length - 1) * 4
  winner.score += totalWin
  scoreHistory.value.push({
    playerIndex: winnerIndex,
    name: winnerName,
    score: totalWin,
    type: 'smallGold'
  })
  
  showToast(`${winnerName} 小金！+${totalWin}分`)
}

const normalWin = () => {
  const winnerIndex = currentPlayerIndex.value
  const winner = players.value[winnerIndex]
  const winnerName = winner.name || `选手${winnerIndex + 1}`
  
  const prevIndex = (winnerIndex - 1 + players.value.length) % players.value.length
  const prevPlayer = players.value[prevIndex]
  
  prevPlayer.score -= 4
  scoreHistory.value.push({
    playerIndex: prevIndex,
    name: prevPlayer.name || `选手${prevIndex + 1}`,
    score: -4,
    type: 'normalWin'
  })
  
  winner.score += 4
  scoreHistory.value.push({
    playerIndex: winnerIndex,
    name: winnerName,
    score: 4,
    type: 'normalWin'
  })
  
  showToast(`${winnerName} 普胜！+4分`)
}

const undoScore = () => {
  if (scoreHistory.value.length === 0) {
    showToast('没有可撤销的记录')
    return
  }
  
  const lastRecord = scoreHistory.value.pop()
  const player = players.value[lastRecord.playerIndex]
  player.score -= lastRecord.score
  currentPlayerIndex.value = lastRecord.playerIndex
  
  showToast('已撤销')
}

const foul = () => {
  const player = players.value[currentPlayerIndex.value]
  player.score -= 1
  
  scoreHistory.value.push({
    playerIndex: currentPlayerIndex.value,
    name: player.name || `选手${currentPlayerIndex.value + 1}`,
    score: -1
  })
  
  const nextIndex = (currentPlayerIndex.value + 1) % players.value.length
  currentPlayerIndex.value = nextIndex
  
  showToast(`${player.name || `选手${currentPlayerIndex.value + 1}`} 犯规`)
}

const newGame = async () => {
  try {
    await showConfirmDialog({
      title: '新一局',
      message: '确定要开始新一局吗？分数将清零，选手保留。',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    
    players.value.forEach(player => {
      player.score = 0
    })
    scoreHistory.value = []
    currentPlayerIndex.value = 0
    
    showToast('新一局已开始')
  } catch {
    // 用户取消
  }
}

const resetAll = async () => {
  try {
    await showConfirmDialog({
      title: '重置比赛',
      message: '确定要重置比赛吗？所有数据将被清空。',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    
    players.value = [
      { name: '', score: 0 },
      { name: '', score: 0 }
    ]
    scoreHistory.value = []
    currentPlayerIndex.value = 0
    
    showToast('比赛已重置')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="less">
.nine-ball {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.content {
  padding: 15px;
  padding-top: calc(46px + var(--status-bar-height) + 15px);
  padding-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.players-section {
  margin-bottom: 20px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px 15px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: grab;
  
  &.active {
    border-color: #1989fa;
    background: linear-gradient(135deg, #e8f4ff 0%, #f0f9ff 100%);
  }
  
  &.dragging {
    opacity: 0.5;
    transform: scale(0.98);
  }
  
  &.drag-over {
    border-color: #07c160;
    background: linear-gradient(135deg, #e8ffe8 0%, #f0fff0 100%);
  }
  
  &:active {
    cursor: grabbing;
  }
}

.drag-handle {
  font-size: 18px;
  color: #999;
  margin-right: 10px;
  cursor: grab;
}

.player-info {
  flex: 1;
  
  .name-input {
    padding: 0;
    background: transparent;
    
    :deep(.van-field__control) {
      font-size: 16px;
      font-weight: 500;
    }
  }
}

.player-score {
  font-size: 28px;
  font-weight: bold;
  color: #1989fa;
  min-width: 60px;
  text-align: center;
}

.delete-btn {
  font-size: 20px;
  color: #ee0a24;
  margin-left: 10px;
}

.score-section {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.score-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.score-btn {
  height: 50px;
  font-size: 20px;
  font-weight: bold;
  border-radius: 12px;
}

.win-section {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.win-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.win-btn {
  height: 50px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 12px;
}

.win-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.8;
  
  p {
    margin: 0;
  }
}

.quick-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  
  .van-button {
    flex: 1;
    border-radius: 8px;
  }
}

.game-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  
  .van-button {
    flex: 1;
    border-radius: 8px;
  }
}

.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.history-name {
  color: #666;
  font-size: 14px;
}

.history-score {
  font-weight: 600;
  color: #1989fa;
  
  &.negative {
    color: #ee0a24;
  }
}
</style>
