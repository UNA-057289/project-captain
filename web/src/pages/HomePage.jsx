// 首页：PRD 功能 1、2 + Day 8 升级（四状态 + 分区 + 响应式）
// + Day 8 用户反馈升级：像素萌趣风美化、三种徽标（已完成/已过期/进行中）、
//   「新建项目」改为醒目大按钮 → 四步问卷向导（名片 → 时间 → 内容方案 → 使用对象）
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject, calcProgress } from '../store.js'
import { mockFetchProjects, isHistoryProject, getProjectStatus } from '../mockApi.js'

// 卡片小图标：根据项目 id 稳定地选一个（同一个项目每次进来图标不变）
const ICONS = ['🚀', '🌟', '🎈', '🌈', '🐱', '🍀', '🎮', '📚', '🍰', '⚽', '🎨', '🎵']
function iconOf(id) {
  let n = 0
  for (const c of String(id)) n = (n + c.charCodeAt(0)) % ICONS.length
  return ICONS[n]
}

export default function HomePage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ok | error（四状态之三，空是 ok 的子情况）
  const [projects, setProjects] = useState([])
  const [wizardOpen, setWizardOpen] = useState(false) // 四步问卷向导开关

  // 通过 mock 接口拉项目列表；下周接 CloudBase 真接口时，只改 mockApi.js 内部
  function fetchProjects(forceError) {
    setStatus('loading')
    const demoError = forceError !== undefined
      ? forceError
      : new URLSearchParams(window.location.search).get('mock') === 'error' // ?mock=error 演示错误态
    mockFetchProjects(demoError)
      .then(ps => { setProjects(ps); setStatus('ok') })
      .catch(() => setStatus('error'))
  }

  useEffect(() => { fetchProjects() }, [])

  const ongoing = projects.filter(p => !isHistoryProject(p))
  const history = projects.filter(isHistoryProject)

  return (
    <div className="page">
      {/* 顶部标题区（宽屏：标题居左 + 大按钮居右，左右排列；窄屏自动上下堆叠） */}
      <header className="topbar pixel-topbar">
        <div>
          <h1>🎮 我是超强负责人</h1>
          <p className="muted small">✨ 一眼看清项目进度，AI 帮你排每天的事 ✨</p>
        </div>
        {/* 醒目大按钮：新建项目 → 打开四步问卷向导（Day 8 用户拍板） */}
        <button className="btn-hero" onClick={() => setWizardOpen(true)}>
          <span className="hero-icon">🚀</span>
          <span className="hero-text">
            <b>开始创建项目</b>
            <small>四步小问卷，搭好项目框架</small>
          </span>
        </button>
      </header>

      {/* ---- 四种页面状态（同一时间只显示一种）---- */}

      {status === 'loading' && (
        <div className="cards" aria-label="加载中">
          {[0, 1, 2].map(i => (
            <div key={i} className="card skeleton-card">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-bar" />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="card error-card">
          <p className="error-emoji">😖</p>
          <p>项目列表加载失败了（模拟：服务器开小差）</p>
          <button className="btn btn-primary" onClick={() => fetchProjects(false)}>🔧 重试</button>
        </div>
      )}

      {status === 'ok' && projects.length === 0 && (
        <div className="card empty">
          <p className="empty-emoji">🐣</p>
          <p>还没有项目，点上面的大按钮「🚀 开始创建项目」孵出第一个吧</p>
        </div>
      )}

      {status === 'ok' && projects.length > 0 && (
        <div className="home-columns">
          {/* 进行中的项目 */}
          <section>
            <h2 className="section-title">🔥 进行中的项目 <span className="muted small">({ongoing.length})</span></h2>
            {ongoing.length === 0 ? (
              <p className="muted small card empty-mini">暂无进行中的项目</p>
            ) : (
              <div className="cards">
                {ongoing.map(p => <ProjectCard key={p.id} p={p} onOpen={() => navigate('/project/' + p.id)} />)}
              </div>
            )}
          </section>

          {/* 历史项目（✅ 已完成 / ⏰ 已过期 两种徽标区分开——Day 8 用户反馈） */}
          <section>
            <h2 className="section-title">📦 历史项目 <span className="muted small">({history.length})</span></h2>
            {history.length === 0 ? (
              <p className="muted small card empty-mini">还没有历史项目（完成或过期的项目会出现在这里）</p>
            ) : (
              <div className="cards">
                {history.map(p => <ProjectCard key={p.id} p={p} history onOpen={() => navigate('/project/' + p.id)} />)}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 四步问卷向导 */}
      {wizardOpen && (
        <WizardModal
          onClose={() => setWizardOpen(false)}
          onCreated={() => { setWizardOpen(false); fetchProjects() }}
        />
      )}
    </div>
  )
}

// 项目卡片：进行中显示进度条；历史显示「✅ 已完成」或「⏰ 已过期」徽标
function ProjectCard({ p, history, onOpen }) {
  const progress = calcProgress(p)
  const st = getProjectStatus(p)
  return (
    <div className="card project-card" onClick={onOpen}>
      <div className="card-title-line">
        <h3><span className="card-icon">{iconOf(p.id)}</span> {p.name}</h3>
        {history && (st === 'done'
          ? <span className="badge badge-done">✅ 已完成</span>
          : <span className="badge badge-overdue">⏰ 已过期</span>)}
      </div>
      {p.description && <p className="muted">{p.description}</p>}
      <p className="muted small">📅 {p.startDate} ~ {p.dueDate}</p>
      <div className="progress-line">
        <div className="progress-track">
          <div className={'progress-fill' + (st === 'overdue' ? ' fill-overdue' : '')} style={{ width: progress + '%' }} />
        </div>
        <span className="progress-num">{progress}%</span>
      </div>
    </div>
  )
}

// ============ 四步问卷向导 ============
// 第 1 步 项目名片（名称*+定位）→ 第 2 步 时间（起止日期*）→ 第 3 步 内容与方案 → 第 4 步 使用对象+确认
const STEP_TITLES = ['🏷️ 项目名片', '📅 项目时间', '📋 内容与方案', '🎯 使用对象']

function WizardModal({ onClose, onCreated }) {
  const [step, setStep] = useState(0) // 0~3
  const [errors, setErrors] = useState({})
  const [f, setF] = useState({ name: '', description: '', startDate: '', dueDate: '', content: '', audience: '' })

  const set = (k, v) => setF(old => ({ ...old, [k]: v }))

  // 每步「下一步」前的校验（必填挡住，结束日期晚于开始日期挡住）
  function validate(cur) {
    const errs = {}
    if (cur === 0 && !f.name.trim()) errs.name = '这项要填'
    if (cur === 1) {
      if (!f.startDate) errs.startDate = '这项要填'
      if (!f.dueDate) errs.dueDate = '这项要填'
      if (f.startDate && f.dueDate && f.dueDate < f.startDate) errs.dueDate = '结束日期要晚于开始日期'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function next() { if (validate(step)) setStep(s => s + 1) }
  function prev() { setErrors({}); setStep(s => s - 1) }

  function create() {
    createProject(f) // 校验在第 0、1 步已经拦过；第 3、4 步是选填
    onCreated()
  }

  return (
    <div className="wizard-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card wizard">
        {/* 步骤指示器：四个小圆点，走到哪亮到哪 */}
        <div className="wizard-steps">
          {STEP_TITLES.map((t, i) => (
            <React.Fragment key={t}>
              {i > 0 && <span className={'wiz-line' + (i <= step ? ' on' : '')} />}
              <span className={'wiz-dot' + (i === step ? ' now' : i < step ? ' past' : '')} title={t}>{i < step ? '✓' : i + 1}</span>
            </React.Fragment>
          ))}
        </div>
        <p className="muted small wiz-count">第 {step + 1} / 4 步</p>
        <h2 className="wiz-title">{STEP_TITLES[step]}</h2>

        {/* 第 1 步：项目名片 */}
        {step === 0 && (
          <div className="wiz-body">
            <label>
              项目名称 *
              <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="例如：中秋活动策划" />
              {errors.name && <span className="err">{errors.name}</span>}
            </label>
            <label>
              项目定位（一句话，选填）
              <input value={f.description} onChange={e => set('description', e.target.value)} placeholder="这个项目是为了什么" />
            </label>
          </div>
        )}

        {/* 第 2 步：项目时间 */}
        {step === 1 && (
          <div className="wiz-body">
            <div className="row">
              <label>
                开始日期 *
                <input type="date" value={f.startDate} onChange={e => set('startDate', e.target.value)} />
                {errors.startDate && <span className="err">{errors.startDate}</span>}
              </label>
              <label>
                结束日期 *
                <input type="date" value={f.dueDate} onChange={e => set('dueDate', e.target.value)} />
                {errors.dueDate && <span className="err">{errors.dueDate}</span>}
              </label>
            </div>
            <p className="muted small">💡 时间定好后，每一天都会自动生成一个待办格子</p>
          </div>
        )}

        {/* 第 3 步：内容与方案 */}
        {step === 2 && (
          <div className="wiz-body">
            <label>
              项目内容 / 方案（选填，之后也能改）
              <textarea
                rows={5}
                value={f.content}
                onChange={e => set('content', e.target.value)}
                placeholder="这个项目具体要做什么？大概分几块？写个大概就行"
              />
            </label>
          </div>
        )}

        {/* 第 4 步：使用对象 + 确认 */}
        {step === 3 && (
          <div className="wiz-body">
            <label>
              使用对象（选填，这个项目是给谁用的）
              <input value={f.audience} onChange={e => set('audience', e.target.value)} placeholder="例如：社团新成员 / 全班同学" />
            </label>
            <div className="wiz-summary">
              <p>🏷️ <b>{f.name}</b>{f.description && <span className="muted">（{f.description}）</span>}</p>
              <p className="small">📅 {f.startDate} ~ {f.dueDate}</p>
              {f.content && <p className="small">📋 {f.content}</p>}
              {f.audience && <p className="small">🎯 {f.audience}</p>}
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="wizard-actions">
          {step > 0 && <button className="btn" onClick={prev}>← 上一步</button>}
          {step < 3 && <button className="btn btn-primary" onClick={next}>下一步 →</button>}
          {step === 3 && <button className="btn btn-primary" onClick={create}>🎉 确认创建</button>}
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}
