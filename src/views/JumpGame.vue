<template>
  <DxxHeader :show-back="true">跳一跳</DxxHeader>
  <div class="jump-game dxx_wrap">
    <div class="game-stage">
      <canvas
        ref="canvasRef"
        class="jump-canvas"
        @pointerdown="handlePressStart"
        @pointerup="handlePressEnd"
        @pointercancel="handlePressCancel"
        @pointerleave="handlePointerLeave"
      ></canvas>

      <div class="score-panel">
        <div class="score-item">
          <span>分数</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="score-item">
          <span>最佳</span>
          <strong>{{ bestScore }}</strong>
        </div>
      </div>

      <div class="charge-meter" :class="{ active: isPressing }" aria-hidden="true">
        <div class="charge-fill" :style="{ width: `${chargePercent}%` }"></div>
      </div>

      <div v-if="gameState === 'ready'" class="game-overlay">
        <div class="overlay-panel">
          <div class="game-title">跳一跳</div>
          <van-button type="primary" round block @click="startGame">开始游戏</van-button>
        </div>
      </div>

      <div v-if="gameState === 'gameover'" class="game-overlay">
        <div class="overlay-panel">
          <div class="game-title">游戏结束</div>
          <div class="final-score">{{ score }}</div>
          <van-button type="primary" round block @click="startGame">再来一局</van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DxxHeader from '@/components/DxxHeader.vue'

const MAX_HOLD = 1100
const POWER_TO_DISTANCE = 0.2
const BEST_SCORE_KEY = 'jump-game-best-score'

const canvasRef = ref(null)
const score = ref(0)
const bestScore = ref(Number(localStorage.getItem(BEST_SCORE_KEY) || 0))
const chargePercent = ref(0)
const gameState = ref('ready')
const isPressing = ref(false)

let ctx = null
let frameId = 0
let pressStartedAt = 0
let currentPlatformIndex = 0
let activeJump = null

const view = {
  width: 0,
  height: 0,
  dpr: 1
}

const camera = {
  x: 0,
  y: 0
}

const cameraTween = {
  active: false,
  fromX: 0,
  fromY: 0,
  toX: 0,
  toY: 0,
  startedAt: 0,
  duration: 300
}

const player = {
  x: 0,
  y: 0,
  z: 0,
  rotation: 0
}

const platforms = []
const platformColors = [
  ['#ffb55f', '#dd7d42'],
  ['#69d8b5', '#329d86'],
  ['#7ab8ff', '#3f7bd4'],
  ['#f47d9b', '#c84d75'],
  ['#f0d66b', '#b8982f'],
  ['#8ed36f', '#4d9a49']
]

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const lerp = (from, to, progress) => from + (to - from) * progress
const easeOutCubic = (progress) => 1 - Math.pow(1 - progress, 3)
const randomBetween = (min, max) => min + Math.random() * (max - min)

const getAnchor = () => ({
  x: view.width * 0.5,
  y: view.height * 0.64
})

const toScreen = ({ x, y }) => {
  const anchor = getAnchor()
  return {
    x: anchor.x + x - camera.x,
    y: anchor.y + y - camera.y
  }
}

const createPlatform = (x, y) => {
  const color = platformColors[Math.floor(Math.random() * platformColors.length)]
  return {
    x,
    y,
    radius: randomBetween(33, 43),
    height: randomBetween(22, 32),
    topColor: color[0],
    sideColor: color[1],
    shape: Math.random() > 0.45 ? 'round' : 'diamond'
  }
}

const createNextPlatform = (from) => {
  const maxHorizontal = clamp(view.width * 0.34, 96, 150)
  const horizontal = randomBetween(98, maxHorizontal)
  const vertical = randomBetween(72, 98)
  const direction = Math.random() > 0.5 ? 1 : -1
  return createPlatform(from.x + horizontal * direction, from.y - vertical)
}

const updateBestScore = () => {
  if (score.value > bestScore.value) {
    bestScore.value = score.value
    localStorage.setItem(BEST_SCORE_KEY, String(bestScore.value))
  }
}

const resetGame = (state = 'ready') => {
  platforms.length = 0
  const first = createPlatform(0, 0)
  first.radius = 42
  first.shape = 'round'
  platforms.push(first)
  platforms.push(createNextPlatform(first))

  currentPlatformIndex = 0
  activeJump = null
  cameraTween.active = false
  camera.x = first.x
  camera.y = first.y
  player.x = first.x
  player.y = first.y
  player.z = 0
  player.rotation = 0
  score.value = 0
  chargePercent.value = 0
  isPressing.value = false
  gameState.value = state
}

const startGame = () => {
  resetGame('playing')
}

const resizeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  view.width = Math.max(1, rect.width)
  view.height = Math.max(1, rect.height)
  view.dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.floor(view.width * view.dpr)
  canvas.height = Math.floor(view.height * view.dpr)
  ctx = canvas.getContext('2d')
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0)

  if (platforms.length === 0) {
    resetGame('ready')
  }
}

const animateCameraTo = (platform) => {
  cameraTween.active = true
  cameraTween.fromX = camera.x
  cameraTween.fromY = camera.y
  cameraTween.toX = platform.x
  cameraTween.toY = platform.y
  cameraTween.startedAt = performance.now()
}

const updateCamera = (now) => {
  if (!cameraTween.active) return

  const progress = clamp((now - cameraTween.startedAt) / cameraTween.duration, 0, 1)
  const eased = easeOutCubic(progress)
  camera.x = lerp(cameraTween.fromX, cameraTween.toX, eased)
  camera.y = lerp(cameraTween.fromY, cameraTween.toY, eased)

  if (progress >= 1) {
    cameraTween.active = false
    camera.x = cameraTween.toX
    camera.y = cameraTween.toY
  }
}

const finishJump = () => {
  const nextPlatform = platforms[currentPlatformIndex + 1]
  const landingDistance = Math.hypot(player.x - nextPlatform.x, player.y - nextPlatform.y)
  const isLanded = landingDistance <= nextPlatform.radius * 0.82

  player.z = 0
  activeJump = null

  if (!isLanded) {
    gameState.value = 'gameover'
    updateBestScore()
    return
  }

  const centerBonus = landingDistance <= 9 ? 2 : 1
  score.value += centerBonus
  updateBestScore()

  currentPlatformIndex += 1
  const currentPlatform = platforms[currentPlatformIndex]
  player.x = currentPlatform.x
  player.y = currentPlatform.y
  player.rotation = 0

  if (!platforms[currentPlatformIndex + 1]) {
    platforms.push(createNextPlatform(currentPlatform))
  }

  if (currentPlatformIndex > 1) {
    platforms.splice(0, currentPlatformIndex - 1)
    currentPlatformIndex = 1
  }

  animateCameraTo(platforms[currentPlatformIndex])
  gameState.value = 'playing'
}

const updateJump = (now) => {
  if (!activeJump) return

  const progress = clamp((now - activeJump.startedAt) / activeJump.duration, 0, 1)
  const eased = easeOutCubic(progress)
  player.x = lerp(activeJump.fromX, activeJump.toX, eased)
  player.y = lerp(activeJump.fromY, activeJump.toY, eased)
  player.z = Math.sin(progress * Math.PI) * activeJump.arcHeight
  player.rotation = progress * Math.PI * 2 * activeJump.spinDirection

  if (progress >= 1) {
    finishJump()
  }
}

const launchJump = (holdTime) => {
  const currentPlatform = platforms[currentPlatformIndex]
  const nextPlatform = platforms[currentPlatformIndex + 1]
  const vectorX = nextPlatform.x - currentPlatform.x
  const vectorY = nextPlatform.y - currentPlatform.y
  const vectorLength = Math.hypot(vectorX, vectorY)
  const directionX = vectorX / vectorLength
  const directionY = vectorY / vectorLength
  const distance = clamp(holdTime * POWER_TO_DISTANCE, 30, 245)

  activeJump = {
    fromX: currentPlatform.x,
    fromY: currentPlatform.y,
    toX: currentPlatform.x + directionX * distance,
    toY: currentPlatform.y + directionY * distance,
    arcHeight: clamp(distance * 0.72, 72, 130),
    spinDirection: directionX > 0 ? 1 : -1,
    duration: clamp(390 + holdTime * 0.18, 430, 620),
    startedAt: performance.now()
  }

  gameState.value = 'jumping'
}

const handlePressStart = (event) => {
  if (gameState.value !== 'playing' || activeJump) return

  event.preventDefault()
  event.currentTarget.setPointerCapture?.(event.pointerId)
  pressStartedAt = performance.now()
  isPressing.value = true
  chargePercent.value = 0
}

const handlePressEnd = (event) => {
  if (!isPressing.value || gameState.value !== 'playing') return

  event.preventDefault()
  event.currentTarget.releasePointerCapture?.(event.pointerId)
  const holdTime = clamp(performance.now() - pressStartedAt, 80, MAX_HOLD)
  isPressing.value = false
  chargePercent.value = 0
  launchJump(holdTime)
}

const handlePressCancel = () => {
  if (!isPressing.value) return

  isPressing.value = false
  chargePercent.value = 0
}

const handlePointerLeave = (event) => {
  if (event.pointerType === 'mouse') {
    handlePressCancel()
  }
}

const drawBackground = () => {
  const gradient = ctx.createLinearGradient(0, 0, 0, view.height)
  gradient.addColorStop(0, '#d7f7ff')
  gradient.addColorStop(0.54, '#f9f2d7')
  gradient.addColorStop(1, '#f7d6c8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, view.width, view.height)

  ctx.globalAlpha = 0.32
  ctx.fillStyle = '#ffffff'
  drawCloud(view.width * 0.22, view.height * 0.18, 1)
  drawCloud(view.width * 0.78, view.height * 0.28, 0.82)
  ctx.globalAlpha = 1

  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
  for (let index = 0; index < 18; index += 1) {
    const x = (index * 73) % view.width
    const y = view.height * 0.76 + ((index * 31) % 90)
    ctx.beginPath()
    ctx.arc(x, y, 2 + (index % 3), 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawCloud = (x, y, scale) => {
  ctx.beginPath()
  ctx.ellipse(x - 24 * scale, y + 4 * scale, 24 * scale, 11 * scale, 0, 0, Math.PI * 2)
  ctx.ellipse(x, y, 32 * scale, 16 * scale, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 26 * scale, y + 5 * scale, 22 * scale, 10 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawRoundPlatform = (platform, screen) => {
  const radius = platform.radius
  const height = platform.height

  ctx.fillStyle = 'rgba(83, 67, 91, 0.18)'
  ctx.beginPath()
  ctx.ellipse(screen.x + 4, screen.y + height + 10, radius * 1.05, radius * 0.28, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = platform.sideColor
  ctx.beginPath()
  ctx.moveTo(screen.x - radius, screen.y)
  ctx.bezierCurveTo(screen.x - radius, screen.y + radius * 0.42, screen.x + radius, screen.y + radius * 0.42, screen.x + radius, screen.y)
  ctx.lineTo(screen.x + radius, screen.y + height)
  ctx.bezierCurveTo(screen.x + radius, screen.y + height + radius * 0.42, screen.x - radius, screen.y + height + radius * 0.42, screen.x - radius, screen.y + height)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = platform.topColor
  ctx.beginPath()
  ctx.ellipse(screen.x, screen.y, radius, radius * 0.45, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(screen.x - radius * 0.16, screen.y - 2, radius * 0.58, radius * 0.21, 0, 0, Math.PI * 2)
  ctx.stroke()
}

const drawDiamondPlatform = (platform, screen) => {
  const radius = platform.radius
  const height = platform.height
  const halfY = radius * 0.52

  ctx.fillStyle = 'rgba(83, 67, 91, 0.18)'
  ctx.beginPath()
  ctx.ellipse(screen.x + 4, screen.y + height + 12, radius * 1.04, radius * 0.25, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = platform.sideColor
  ctx.beginPath()
  ctx.moveTo(screen.x - radius, screen.y)
  ctx.lineTo(screen.x, screen.y + halfY)
  ctx.lineTo(screen.x + radius, screen.y)
  ctx.lineTo(screen.x + radius, screen.y + height)
  ctx.lineTo(screen.x, screen.y + halfY + height)
  ctx.lineTo(screen.x - radius, screen.y + height)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = platform.topColor
  ctx.beginPath()
  ctx.moveTo(screen.x, screen.y - halfY)
  ctx.lineTo(screen.x + radius, screen.y)
  ctx.lineTo(screen.x, screen.y + halfY)
  ctx.lineTo(screen.x - radius, screen.y)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(screen.x, screen.y - halfY + 6)
  ctx.lineTo(screen.x + radius * 0.58, screen.y)
  ctx.lineTo(screen.x, screen.y + halfY - 6)
  ctx.stroke()
}

const drawPlatform = (platform) => {
  const screen = toScreen(platform)
  if (platform.shape === 'diamond') {
    drawDiamondPlatform(platform, screen)
  } else {
    drawRoundPlatform(platform, screen)
  }
}

const drawRoundedRect = (x, y, width, height, radius) => {
  const corner = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + corner, y)
  ctx.lineTo(x + width - corner, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + corner)
  ctx.lineTo(x + width, y + height - corner)
  ctx.quadraticCurveTo(x + width, y + height, x + width - corner, y + height)
  ctx.lineTo(x + corner, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - corner)
  ctx.lineTo(x, y + corner)
  ctx.quadraticCurveTo(x, y, x + corner, y)
  ctx.closePath()
}

const drawPlayer = () => {
  const base = toScreen(player)
  const heldProgress = isPressing.value ? chargePercent.value / 100 : 0
  const squashY = 1 - heldProgress * 0.22
  const squashX = 1 + heldProgress * 0.14
  const footY = base.y - player.z

  ctx.fillStyle = 'rgba(83, 67, 91, 0.18)'
  ctx.beginPath()
  ctx.ellipse(base.x + 3, base.y + 9, 18, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.translate(base.x, footY)
  ctx.rotate(player.rotation * 0.08)
  ctx.scale(squashX, squashY)

  const bodyGradient = ctx.createLinearGradient(-16, -46, 18, -4)
  bodyGradient.addColorStop(0, '#4155d9')
  bodyGradient.addColorStop(0.55, '#5d72ff')
  bodyGradient.addColorStop(1, '#2e3f9f')

  ctx.fillStyle = bodyGradient
  drawRoundedRect(-15, -44, 30, 38, 13)
  ctx.fill()

  ctx.fillStyle = '#f6f2ff'
  ctx.beginPath()
  ctx.ellipse(0, -44, 15, 7, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#27337f'
  ctx.beginPath()
  ctx.ellipse(0, -6, 15, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

const drawGuideLine = () => {
  if (!isPressing.value) return

  const currentPlatform = platforms[currentPlatformIndex]
  const nextPlatform = platforms[currentPlatformIndex + 1]
  const currentScreen = toScreen(currentPlatform)
  const nextScreen = toScreen(nextPlatform)

  ctx.strokeStyle = 'rgba(43, 57, 95, 0.18)'
  ctx.lineWidth = 3
  ctx.setLineDash([6, 8])
  ctx.beginPath()
  ctx.moveTo(currentScreen.x, currentScreen.y)
  ctx.lineTo(nextScreen.x, nextScreen.y)
  ctx.stroke()
  ctx.setLineDash([])
}

const drawScene = (now) => {
  if (!ctx) return

  if (isPressing.value) {
    const holdTime = clamp(now - pressStartedAt, 0, MAX_HOLD)
    chargePercent.value = Math.round((holdTime / MAX_HOLD) * 100)
  }

  updateCamera(now)
  updateJump(now)
  drawBackground()

  const sortedPlatforms = [...platforms].sort((a, b) => a.y - b.y)
  sortedPlatforms.forEach(drawPlatform)
  drawGuideLine()
  drawPlayer()
}

const render = (now) => {
  drawScene(now)
  frameId = requestAnimationFrame(render)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  frameId = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped lang="less">
.jump-game {
  min-height: 100vh;
  padding-top: calc(46px + var(--status-bar-height));
  overflow: hidden;
  background: linear-gradient(180deg, #d7f7ff 0%, #f9f2d7 55%, #f7d6c8 100%);
}

.game-stage {
  position: relative;
  width: 100%;
  max-width: 520px;
  height: calc(100vh - 46px - var(--status-bar-height));
  margin: 0 auto;
  overflow: hidden;
}

.jump-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
}

.score-panel {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.score-item {
  min-width: 88px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 24px rgba(63, 83, 132, 0.14);
  backdrop-filter: blur(10px);

  span {
    display: block;
    color: #607083;
    font-size: 12px;
    line-height: 1;
  }

  strong {
    display: block;
    margin-top: 4px;
    color: #27324d;
    font-size: 24px;
    line-height: 1;
  }
}

.charge-meter {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 28px;
  z-index: 2;
  height: 10px;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.52);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.18s ease, transform 0.18s ease;
  pointer-events: none;

  &.active {
    opacity: 1;
    transform: translateY(0);
  }
}

.charge-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #56d7a5 0%, #f2cb55 58%, #ef756d 100%);
}

.game-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(32, 43, 70, 0.18);
  backdrop-filter: blur(3px);
}

.overlay-panel {
  width: min(100%, 260px);
  padding: 22px 18px 18px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 42px rgba(51, 64, 105, 0.18);
  text-align: center;

  :deep(.van-button) {
    height: 44px;
    font-size: 16px;
    font-weight: 600;
  }
}

.game-title {
  margin-bottom: 16px;
  color: #27324d;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.final-score {
  margin: -2px 0 18px;
  color: #4155d9;
  font-size: 44px;
  font-weight: 800;
  line-height: 1;
}
</style>
