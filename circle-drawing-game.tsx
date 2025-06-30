"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Trophy, Coffee, Eye, EyeOff } from "lucide-react"

interface Point {
  x: number
  y: number
}

export default function CircleDrawingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState<Point[]>([])
  const [score, setScore] = useState<number | null>(null)
  const [bestScore, setBestScore] = useState<number>(0)
  const [showMask, setShowMask] = useState(false) // 控制伪装遮罩显示
  const [drawCount, setDrawCount] = useState(0)
  const [allDrawings, setAllDrawings] = useState<Point[][]>([]) // 保存所有绘制的路径

  // 获取鼠标在canvas中的相对位置
  const getMousePos = useCallback((e: MouseEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  // 开始绘制
  const startDrawing = useCallback(
    (e: MouseEvent) => {
      // 如果已经有评分，说明上一次绘制已完成，清空画布重新开始
      if (score !== null) {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (canvas && ctx) {
          ctx.fillStyle = "#0a0a0a"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        setAllDrawings([]) // 清空所有保存的路径
      }
      
      setIsDrawing(true)
      setPoints([]) // 清空当前绘制的点
      setScore(null)
      const pos = getMousePos(e)
      setPoints([pos])
    },
    [getMousePos, score],
  )

  // 修复drawParticle函数的位置，将其移到组件内部但在useCallback之前
  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, pos: Point, hue: number) => {
    const particleSize = Math.random() * 3 + 1
    const offsetX = (Math.random() - 0.5) * 10
    const offsetY = (Math.random() - 0.5) * 10

    ctx.save()
    ctx.globalCompositeOperation = "screen"
    ctx.fillStyle = `hsla(${hue + Math.random() * 60 - 30}, 80%, 70%, ${Math.random() * 0.8 + 0.2})`
    ctx.shadowColor = `hsl(${hue}, 80%, 60%)`
    ctx.shadowBlur = 5

    ctx.beginPath()
    ctx.arc(pos.x + offsetX, pos.y + offsetY, particleSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [])

  // 绘制过程中
  const draw = useCallback(
    (e: MouseEvent) => {
      if (!isDrawing) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return

      const pos = getMousePos(e)

      setPoints((prevPoints) => {
        // 如果是第一个点，直接添加
        if (prevPoints.length === 0) {
          return [pos]
        }

        const lastPoint = prevPoints[prevPoints.length - 1]

        // 计算距离，只有移动距离超过阈值才绘制
        const distance = Math.sqrt(Math.pow(pos.x - lastPoint.x, 2) + Math.pow(pos.y - lastPoint.y, 2))

        // 设置最小移动距离阈值，避免绘制过多小点
        if (distance < 3) {
          return prevPoints
        }

        const newPoints = [...prevPoints, pos]

        // 使用平滑曲线绘制
        if (newPoints.length >= 3) {
          const len = newPoints.length
          const p1 = newPoints[len - 3]
          const p2 = newPoints[len - 2]
          const p3 = newPoints[len - 1]

          // 计算控制点（用于平滑曲线）
          const cp1x = p1.x + (p2.x - p1.x) * 0.5
          const cp1y = p1.y + (p2.y - p1.y) * 0.5
          const cp2x = p2.x + (p3.x - p2.x) * 0.5
          const cp2y = p2.y + (p3.y - p2.y) * 0.5

          // 根据绘制速度调整线条粗细
          const speed = Math.min(distance, 20)
          const lineWidth = Math.max(3, 10 - speed * 0.2)

          // 根据绘制进度计算彩虹色
          const progress = newPoints.length / 200
          const hue = (progress * 360) % 360

          // 创建渐变效果
          const gradient = ctx.createLinearGradient(p2.x, p2.y, p3.x, p3.y)
          gradient.addColorStop(0, `hsl(${hue}, 85%, 65%)`)
          gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 85%, 65%)`)

          // 绘制外发光效果
          ctx.save()
          ctx.globalCompositeOperation = "screen"
          ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
          ctx.shadowBlur = 20
          ctx.lineWidth = lineWidth + 6
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.4)`

          ctx.beginPath()
          ctx.moveTo(cp1x, cp1y)
          ctx.quadraticCurveTo(p2.x, p2.y, cp2x, cp2y)
          ctx.stroke()
          ctx.restore()

          // 绘制主线条（使用平滑曲线）
          ctx.save()
          ctx.lineWidth = lineWidth
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.strokeStyle = gradient
          ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
          ctx.shadowBlur = 12

          ctx.beginPath()
          ctx.moveTo(cp1x, cp1y)
          ctx.quadraticCurveTo(p2.x, p2.y, cp2x, cp2y)
          ctx.stroke()
          ctx.restore()

          // 减少粒子生成频率，让效果更精致
          if (Math.random() < 0.15) {
            drawParticle(ctx, p2, hue)
          }
        } else if (newPoints.length === 2) {
          // 前两个点直接连线
          const p1 = newPoints[0]
          const p2 = newPoints[1]

          const lineWidth = 6
          const hue = 0

          // 外发光
          ctx.save()
          ctx.globalCompositeOperation = "screen"
          ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
          ctx.shadowBlur = 20
          ctx.lineWidth = lineWidth + 6
          ctx.lineCap = "round"
          ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.4)`

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
          ctx.restore()

          // 主线条
          ctx.save()
          ctx.lineWidth = lineWidth
          ctx.lineCap = "round"
          ctx.strokeStyle = `hsl(${hue}, 85%, 65%)`
          ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
          ctx.shadowBlur = 12

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
          ctx.restore()
        }

        return newPoints
      })
    },
    [isDrawing, getMousePos, drawParticle],
  )

  // 结束绘制
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)
    setDrawCount(prev => prev + 1)

    // 使用函数式更新来获取最新的points
    setPoints((currentPoints) => {
      if (currentPoints.length < 10) return currentPoints

      // 将当前绘制的路径保存到所有绘制中
      setAllDrawings(prev => [...prev, [...currentPoints]])

      // 计算圆形完美度评分
      const circleScore = calculateCircleScore(currentPoints)
      setScore(circleScore)

      setBestScore((prevBest) => (circleScore > prevBest ? circleScore : prevBest))

      return currentPoints
    })
  }, [isDrawing])

  // 计算圆形完美度评分
  const calculateCircleScore = (points: Point[]): number => {
    if (points.length < 10) return 0

    // 1. 计算中心点（所有点的平均值）
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length

    // 2. 计算每个点到中心的距离
    const distances = points.map((p) => Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2)))

    // 3. 计算平均半径
    const avgRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length

    // 4. 计算距离的标准差（衡量圆形规整程度）
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgRadius, 2), 0) / distances.length
    const standardDeviation = Math.sqrt(variance)

    // 5. 检查闭合程度
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const closureDistance = Math.sqrt(Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2))

    // 6. 计算评分
    // 标准差越小，圆形越规整
    const regularityScore = Math.max(0, 100 - (standardDeviation / avgRadius) * 200)

    // 闭合程度评分
    const closureScore = Math.max(0, 100 - (closureDistance / avgRadius) * 100)

    // 点数适中性评分（太少或太多都不好）
    const pointCountScore =
      points.length > 50 && points.length < 200 ? 100 : Math.max(0, 100 - Math.abs(points.length - 100) * 2)

    // 综合评分
    const finalScore = regularityScore * 0.5 + closureScore * 0.3 + pointCountScore * 0.2

    return Math.round(Math.max(1, Math.min(100, finalScore)))
  }

  // 重新绘制所有保存的路径
  const redrawAllPaths = useCallback((ctx: CanvasRenderingContext2D, paths: Point[][]) => {
    paths.forEach((pathPoints) => {
      if (pathPoints.length < 2) return

      for (let i = 0; i < pathPoints.length - 1; i++) {
        const progress = i / Math.max(pathPoints.length - 1, 1)
        const hue = (progress * 360) % 360
        
        if (i === 0) {
          // 第一个点
          const p1 = pathPoints[i]
          const p2 = pathPoints[i + 1]
          
          const lineWidth = 6
          
          // 外发光
          ctx.save()
          ctx.globalCompositeOperation = "screen"
          ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
          ctx.shadowBlur = 20
          ctx.lineWidth = lineWidth + 6
          ctx.lineCap = "round"
          ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.4)`

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
          ctx.restore()

          // 主线条
          ctx.save()
          ctx.lineWidth = lineWidth
          ctx.lineCap = "round"
          ctx.strokeStyle = `hsl(${hue}, 85%, 65%)`
          ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
          ctx.shadowBlur = 12

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
          ctx.restore()
        } else if (i >= 2) {
          // 使用三点绘制平滑曲线
          const p1 = pathPoints[i - 2]
          const p2 = pathPoints[i - 1]
          const p3 = pathPoints[i]

          const cp1x = p1.x + (p2.x - p1.x) * 0.5
          const cp1y = p1.y + (p2.y - p1.y) * 0.5
          const cp2x = p2.x + (p3.x - p2.x) * 0.5
          const cp2y = p2.y + (p3.y - p2.y) * 0.5

          const lineWidth = 6
          const gradient = ctx.createLinearGradient(p2.x, p2.y, p3.x, p3.y)
          gradient.addColorStop(0, `hsl(${hue}, 85%, 65%)`)
          gradient.addColorStop(1, `hsl(${(hue + 40) % 360}, 85%, 65%)`)

          // 外发光
          ctx.save()
          ctx.globalCompositeOperation = "screen"
          ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
          ctx.shadowBlur = 20
          ctx.lineWidth = lineWidth + 6
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.4)`

          ctx.beginPath()
          ctx.moveTo(cp1x, cp1y)
          ctx.quadraticCurveTo(p2.x, p2.y, cp2x, cp2y)
          ctx.stroke()
          ctx.restore()

          // 主线条
          ctx.save()
          ctx.lineWidth = lineWidth
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.strokeStyle = gradient
          ctx.shadowColor = `hsl(${hue}, 85%, 65%)`
          ctx.shadowBlur = 12

          ctx.beginPath()
          ctx.moveTo(cp1x, cp1y)
          ctx.quadraticCurveTo(p2.x, p2.y, cp2x, cp2y)
          ctx.stroke()
          ctx.restore()
        }
      }
    })
  }, [])

  // 清除画布
  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    // 重新设置canvas尺寸（这会自动清除内容）
    const container = canvas.parentElement
    if (container) {
      const containerWidth = container.clientWidth
      const aspectRatio = 5 / 3
      canvas.width = Math.min(containerWidth - 4, 1000)
      canvas.height = Math.min(canvas.width / aspectRatio, 600)
    }

    // 设置深色背景以突出发光效果
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 清除所有保存的绘制
    setAllDrawings([])
    setPoints([])
    setScore(null)
    setIsDrawing(false)
  }

  // 获取评分等级和颜色
  const getScoreInfo = (score: number) => {
    if (score >= 95) return { level: "神级摸鱼手", color: "bg-purple-500", emoji: "🔥" }
    if (score >= 90) return { level: "摸鱼大师", color: "bg-green-500", emoji: "🎯" }
    if (score >= 80) return { level: "摸鱼高手", color: "bg-blue-500", emoji: "😎" }
    if (score >= 70) return { level: "合格摸鱼", color: "bg-yellow-500", emoji: "👍" }
    if (score >= 60) return { level: "菜鸟摸鱼", color: "bg-orange-500", emoji: "🤔" }
    return { level: "摸鱼失败", color: "bg-red-500", emoji: "😅" }
  }

  // 获取魔性的评语
  const getMagicComment = (score: number) => {
    if (score >= 95) return "老板看了都想给你加薪！🚀"
    if (score >= 90) return "这圆画得比工作汇报还圆满！👑"
    if (score >= 80) return "摸鱼技能已达到中层管理水平！📈"
    if (score >= 70) return "勉强算个合格的社畜摸鱼手！🐟"
    if (score >= 60) return "继续练习，早日脱离996！😴"
    return "建议回去搬砖，摸鱼都不会！🧱"
  }

  // 获取魔性的提示语
  const getRandomTip = () => {
    const tips = [
      "💡 据说画圆技术和工作效率成反比",
      "🎯 画得越圆，下班越早（迷信）",
      "🔮 传说画出完美圆的人都升职了",
      "⚡ 隐身模式+ESC键=终极摸鱼神器",
      "🎪 画圆时想象自己在画年终奖",
      "🌟 每画一个圆，就少写一行代码",
      "🎨 可以连续画圆叠加，打分后重画会清空",
      "🌈 完成打分后再画新圆会重新开始",
      "🥷 隐身模式让你摸鱼更安全",
      "🖥️ XP桌面伪装，老板永远不会发现"
    ]
    return tips[Math.floor(Math.random() * tips.length)]
  }

  // 设置canvas尺寸和事件监听
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 动态设置canvas尺寸以适应容器
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        const containerWidth = container.clientWidth
        const aspectRatio = 5 / 3 // 宽高比
        canvas.width = Math.min(containerWidth - 4, 1000) // 减去边框
        canvas.height = Math.min(canvas.width / aspectRatio, 600)
        
        // 重新绘制背景
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.fillStyle = "#0a0a0a"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          // 重新绘制所有保存的路径
          redrawAllPaths(ctx, allDrawings)
        }
      }
    }

    // 初始化尺寸
    resizeCanvas()

    // 添加窗口大小变化监听
    window.addEventListener("resize", resizeCanvas)

    canvas.addEventListener("mousedown", startDrawing)
    canvas.addEventListener("mousemove", draw)
    canvas.addEventListener("mouseup", stopDrawing)
    canvas.addEventListener("mouseleave", stopDrawing)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("mousedown", startDrawing)
      canvas.removeEventListener("mousemove", draw)
      canvas.removeEventListener("mouseup", stopDrawing)
      canvas.removeEventListener("mouseleave", stopDrawing)
    }
  }, [startDrawing, draw, stopDrawing, allDrawings, redrawAllPaths])

  // 键盘快捷键监听
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC键快速切换遮罩
      if (e.key === "Escape") {
        setShowMask(prev => !prev)
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [])

  return (
    <div className="min-h-screen transition-all duration-500 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 bg-black/20 backdrop-blur-sm border-purple-500/20">
          <CardHeader className="text-center relative">
            <Button 
              onClick={() => setShowMask(true)}
              variant="ghost" 
              size="sm"
              className="absolute top-2 right-2 text-xs text-white"
            >
              <EyeOff className="w-4 h-4" />
              逃生门
            </Button>
            
            <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              🎮 摸鱼神器·画圈挑战
            </CardTitle>
            <CardDescription className="text-lg text-purple-200">
              在老板不注意的时候，用鼠标画个炫酷发光圆圈！🌟
            </CardDescription>
                         <div className="flex items-center justify-center gap-2 mt-2 text-sm text-purple-300">
               <Coffee className="w-4 h-4" />
               <span>已摸鱼 {drawCount} 次 | 继续加油！ | 按ESC切换伪装</span>
             </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                {bestScore > 0 && (
                  <div className="flex items-center gap-2 text-yellow-300">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">摸鱼记录: {bestScore}分</span>
                  </div>
                )}
              </div>
                            <Button 
                onClick={clearCanvas} 
                variant="secondary"
                className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 border-purple-400/30 text-purple-200"
              >
                <RotateCcw className="w-4 h-4" />
                清空重摸
              </Button>
            </div>

            {/* 画布 */}
            <div className="relative border-2 rounded-lg overflow-hidden shadow-inner border-purple-500/30 bg-gray-900">
              <canvas
                ref={canvasRef}
                className="block cursor-crosshair w-full h-auto max-w-full"
                style={{ touchAction: "none" }}
              />

              {/* 提示文字 */}
              {points.length === 0 && !isDrawing && allDrawings.length === 0 && score === null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-xl font-medium text-purple-300">
                    点击拖拽画个发光圆圈，开始你的摸鱼时光✨
                  </div>
                </div>
              )}
              
              {/* 继续绘制提示 */}
              {points.length === 0 && !isDrawing && allDrawings.length > 0 && score === null && (
                <div className="absolute top-4 left-4 pointer-events-none">
                  <div className="text-sm px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30">
                    🎨 已摸鱼 {allDrawings.length} 个圆圈
                  </div>
                </div>
              )}

              {/* 重新开始提示 */}
              {points.length === 0 && !isDrawing && score !== null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-xl font-medium text-purple-300">
                    点击重新绘制，开始新的摸鱼挑战🎯
                  </div>
                </div>
              )}
            </div>

            {/* 评分显示 */}
            {score !== null && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-4 rounded-lg p-6 shadow-lg bg-black/30 backdrop-blur-sm border border-purple-500/20">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 text-white">
                      {score}分 {getScoreInfo(score).emoji}
                    </div>
                    <Badge className={`${getScoreInfo(score).color} text-white`}>
                      {getScoreInfo(score).level}
                    </Badge>
                  </div>
                  <div className="text-left text-sm text-purple-200">
                    <div>绘制点数: {points.length}</div>
                    <div className="mt-1 max-w-xs">
                      {getMagicComment(score)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 使用说明 */}
            <div className="mt-6 text-center text-sm text-purple-300">
              <p>{getRandomTip()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 伪装遮罩 */}
      {showMask && (
        <div 
          className="fixed inset-0 z-[9999] cursor-pointer"
          style={{
            backgroundImage: "url('/xp2.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
          onDoubleClick={() => setShowMask(false)}
        >
          {/* 操作提示 */}
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-sm opacity-30 hover:opacity-100 transition-opacity">
            <div>ESC</div>
            {/* <div className="text-xs text-gray-300 mt-1">🥷 伪装模式已激活</div> */}
          </div>
        </div>
      )}
    </div>
  )
}
