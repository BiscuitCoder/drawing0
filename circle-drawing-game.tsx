"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Trophy } from "lucide-react"

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
      setIsDrawing(true)
      setPoints([])
      setScore(null)
      const pos = getMousePos(e)
      setPoints([pos])
    },
    [getMousePos],
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

    // 使用函数式更新来获取最新的points
    setPoints((currentPoints) => {
      if (currentPoints.length < 10) return currentPoints

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

  // 清除画布
  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    // 设置深色背景以突出发光效果
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    setPoints([])
    setScore(null)
    setIsDrawing(false)
  }

  // 获取评分等级和颜色
  const getScoreInfo = (score: number) => {
    if (score >= 90) return { level: "完美", color: "bg-green-500" }
    if (score >= 80) return { level: "优秀", color: "bg-blue-500" }
    if (score >= 70) return { level: "良好", color: "bg-yellow-500" }
    if (score >= 60) return { level: "及格", color: "bg-orange-500" }
    return { level: "需要练习", color: "bg-red-500" }
  }

  // 设置canvas事件监听
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 初始化黑色背景
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    canvas.addEventListener("mousedown", startDrawing)
    canvas.addEventListener("mousemove", draw)
    canvas.addEventListener("mouseup", stopDrawing)
    canvas.addEventListener("mouseleave", stopDrawing)

    return () => {
      canvas.removeEventListener("mousedown", startDrawing)
      canvas.removeEventListener("mousemove", draw)
      canvas.removeEventListener("mouseup", stopDrawing)
      canvas.removeEventListener("mouseleave", stopDrawing)
    }
  }, [startDrawing, draw, stopDrawing])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">画圈挑战</CardTitle>
            <CardDescription className="text-lg">用鼠标在下方画一个完美的圆圈，系统会给你的圆圈打分！</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                {bestScore > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">最高分: {bestScore}</span>
                  </div>
                )}
              </div>
              <Button onClick={clearCanvas} variant="outline" className="flex items-center gap-2 bg-transparent">
                <RotateCcw className="w-4 h-4" />
                重新开始
              </Button>
            </div>

            {/* 画布 */}
            <div className="relative border-2 border-gray-600 rounded-lg overflow-hidden bg-gray-900 shadow-inner">
              <canvas
                ref={canvasRef}
                width={800}
                height={500}
                className="block cursor-crosshair"
                style={{ touchAction: "none" }}
              />

              {/* 提示文字 */}
              {points.length === 0 && !isDrawing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-gray-400 text-xl font-medium">点击并拖拽鼠标画一个炫酷的发光圆圈</div>
                </div>
              )}
            </div>

            {/* 评分显示 */}
            {score !== null && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-4 bg-white rounded-lg p-6 shadow-lg">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800 mb-2">{score}分</div>
                    <Badge className={`${getScoreInfo(score).color} text-white`}>{getScoreInfo(score).level}</Badge>
                  </div>
                  <div className="text-left text-sm text-gray-600">
                    <div>绘制点数: {points.length}</div>
                    <div className="mt-1">
                      {score >= 90 && "哇！几乎完美的圆形！"}
                      {score >= 80 && score < 90 && "很棒的圆形！"}
                      {score >= 70 && score < 80 && "不错的尝试！"}
                      {score >= 60 && score < 70 && "还需要多练习哦"}
                      {score < 60 && "继续努力，你可以做得更好！"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 使用说明 */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>💡 小贴士：画圆时保持匀速，尽量让起点和终点重合，这样能获得更高分数！</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
