// mock 数据接口（Day 8）：把「取项目列表」包成带延迟的假网络请求
// 为什么要有它：真实产品的数据要经过网络，会有等待和失败；现在用假接口
// 提前把「加载中 / 错误」两种状态做出来，下周接 CloudBase 时只改这个文件
import { loadData, calcProgress } from './store.js'

// 模拟网络延迟（毫秒）：让加载状态肉眼可见
const LATENCY = 600

// 取项目列表：forceError = true 时模拟服务器出错（演示错误状态用）
export function mockFetchProjects(forceError) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (forceError) {
        reject(new Error('mock: 服务器开小差了'))
        return
      }
      try {
        resolve(loadData().projects)
      } catch (e) {
        reject(e)
      }
    }, LATENCY)
  })
}

// 判断一个项目是否属于「历史项目」：已完成 100%，或结束日期已过
export function isHistoryProject(p) {
  return getProjectStatus(p) !== 'ongoing'
}

// 项目的三种状态（Day 8 用户反馈：过期没做完 ≠ 已完成，要区分开）
// 返回 'done'（真做完，100%）| 'overdue'（过期但没做完）| 'ongoing'（进行中）
export function getProjectStatus(p) {
  if (calcProgress(p) === 100) return 'done'
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  if (p.dueDate < y + '-' + m + '-' + d) return 'overdue' // 日期是 YYYY-MM-DD 格式，字符串比较即可
  return 'ongoing'
}
