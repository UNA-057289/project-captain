// 数据层：所有对 localStorage（浏览器本地小本子）的读写都集中在这里
// 注意：今天（Day 7）先用 localStorage 做原型，下周接 CloudBase 数据库后
// 这个文件里的函数换成调后端接口，页面代码不用大改（TECH_DESIGN 第八节预留的迁移路线）
//
// 数据模型 v2（Day 7 用户反馈升级）：从「每天一条待办」改为「每天一个组，组内多条待办」
// project.days = [ { id, day(日期), note(当天说明), items: [ {id, content, isDone, doneAt} ] } ]
// 存储键升级为 v2：旧 v1 的测试数据不再读取（当时只是测试项目，直接重新建即可）

const KEY = 'project-captain-data-v2'

// 读全部数据；第一次打开没有任何数据时返回空结构
export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { projects: [] }
    const d = JSON.parse(raw)
    if (!Array.isArray(d.projects)) d.projects = []
    return d
  } catch (e) {
    // 数据坏了也不能让页面崩，当成空数据重新开始
    return { projects: [] }
  }
}

// 写全部数据
export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

// 生成一个不易重复的 id（时间戳 + 随机数）
function makeId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function makeItemId() {
  return 'i_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// 日期一律用本地时间的年月日拼出来，不能用 toISOString（那是 UTC 标准时间，
// 在中国时区会把日期错前一天——3c 预检时抓出来的 bug）
function fmtLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + day
}

// 按起止日期预生成每日分组骨架，每天组内先放一条空待办（显示「待填写」）
export function generateSkeleton(startDate, dueDate) {
  const days = []
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(dueDate + 'T00:00:00')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      id: 'd_' + d.getTime().toString(36) + Math.random().toString(36).slice(2, 6),
      day: fmtLocal(d),
      note: '',
      items: [{ id: makeItemId(), content: '', isDone: false, doneAt: null }]
    })
  }
  return days
}

// 新建项目：数据校验在页面层做，这里只负责存
// content（内容与方案）、audience（使用对象）来自 Day 8 的四步问卷向导，选填
export function createProject({ name, description, startDate, dueDate, content, audience }) {
  const data = loadData()
  const project = {
    id: makeId(),
    name,
    description: description || '',
    content: content || '',     // 项目内容/方案（问卷第 3 步）
    audience: audience || '',   // 使用对象（问卷第 4 步）
    startDate,
    dueDate,
    createdAt: new Date().toISOString(),
    ownerKey: 'default', // v1 无登录，统一归属；字段为 v2.0 多用户预留
    days: generateSkeleton(startDate, dueDate)
  }
  data.projects.unshift(project) // 新项目排在最前面（PRD 功能 2）
  saveData(data)
  return project
}

// 通用：找到项目 → 改它 → 存回去 → 返回改后的项目
function updateProject(projectId, updater) {
  const data = loadData()
  const idx = data.projects.findIndex(p => p.id === projectId)
  if (idx === -1) return null
  updater(data.projects[idx])
  saveData(data)
  return data.projects[idx]
}

// 通用：找到某一天的分组，对它做修改
function updateDay(projectId, dayId, fn) {
  return updateProject(projectId, p => {
    const d = p.days.find(x => x.id === dayId)
    if (d) fn(d)
  })
}

// 勾选/取消某条待办（PRD 功能 4）
export function toggleTodo(projectId, dayId, itemId) {
  return updateDay(projectId, dayId, d => {
    const it = d.items.find(i => i.id === itemId)
    if (it) {
      it.isDone = !it.isDone
      it.doneAt = it.isDone ? new Date().toISOString() : null
    }
  })
}

// 编辑某条待办文字，空 = 回到「待填写」（PRD 功能 5）
export function editTodoContent(projectId, dayId, itemId, content) {
  return updateDay(projectId, dayId, d => {
    const it = d.items.find(i => i.id === itemId)
    if (it) it.content = content.trim()
  })
}

// 给某天添加一条待办（Day 7 用户反馈：每天可以有多条）
export function addTodoItem(projectId, dayId, content) {
  return updateDay(projectId, dayId, d => {
    d.items.push({ id: makeItemId(), content: (content || '').trim(), isDone: false, doneAt: null })
  })
}

// 删除某天的一条待办（Day 7 用户反馈：能删不要的）
// Day 10 修复①：改成「点了就真删」，允许一天变成 0 条。
// 原来剩最后一条时只清空内容、界面上看不出发生了什么，用户会以为「删」按钮坏了；
// 删空之后想加回来，点「＋ 添加一条」即可——少一次打断，结果看得见。
export function deleteTodoItem(projectId, dayId, itemId) {
  return updateDay(projectId, dayId, d => {
    d.items = d.items.filter(i => i.id !== itemId)
  })
}

// 保存某天的文字说明（PRD 功能 4：每天最多一条）
export function setDayNote(projectId, dayId, note) {
  return updateDay(projectId, dayId, d => {
    d.note = note.trim()
  })
}

// ⭐ 模拟版 AI 生成每日安排（Day 7 用户拍板：方案 A 的「模拟智能」）
// 现在是本地写好的生成逻辑；下周接 CloudBase 后端后，改成「调后端接口 →
// 后端拿密钥去调豆包/DeepSeek」——页面和这个函数的入参出参都不用变
export function aiFillPlan(projectId) {
  return updateProject(projectId, p => {
    const topic = p.description || p.name
    const total = p.days.length
    p.days.forEach((d, idx) => {
      const n = idx + 1
      const ratio = total > 1 ? n / total : 1
      let suggestion
      if (n === 1) {
        suggestion = `明确「${topic}」的目标和验收标准，把它拆成小任务`
      } else if (n === total) {
        suggestion = `收尾：检查「${topic}」整体完成情况，记录复盘要点`
      } else if (ratio < 0.4) {
        suggestion = `前期：为「${topic}」做准备——理清要用的材料和方法（第 ${n} 天）`
      } else if (ratio < 0.8) {
        suggestion = `中期：推进「${topic}」的主体工作，今天完成一个阶段性小成果（第 ${n} 天）`
      } else {
        suggestion = `后期：检查「${topic}」的遗留问题，开始收尾打磨（第 ${n} 天）`
      }
      // 只填空位，不动你已经写好的内容（用户负责在 AI 生成的内容上修改）
      // Day 10 修复②：先复用已有空行（避免同一天堆两条），没有再新建一条
      const empty = d.items.find(i => !i.content && !i.isDone)
      if (empty) {
        empty.content = suggestion
      } else {
        d.items.push({ id: makeItemId(), content: suggestion, isDone: false, doneAt: null })
      }    })
  })
}

// 计算某项目的进度百分比（PRD 功能 6：全部条目里已完成的比例，四舍五入）
// Day 10 修复②：只把「有内容的」条目算进分母。新建项目时每天会预放一条空白占位，
// 那些空行不是任务，算进去会让总数虚高、进度永远到不了 100%
export function calcProgress(project) {
  const days = (project && project.days) || []
  const items = days.flatMap(d => d.items || [])
  const filled = items.filter(i => (i.content || '').trim() !== '')
  if (filled.length === 0) return 0
  const done = filled.filter(i => i.isDone).length
  return Math.round((done / filled.length) * 100)
}
