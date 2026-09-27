// 项目栏（首页）：PRD 功能 1 + 功能 2
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadData, createProject, calcProgress } from '../store.js'

export default function HomePage() {
  const navigate = useNavigate()
  const [version, setVersion] = useState(0) // 数据变了就 +1，让列表重新渲染
  const [showForm, setShowForm] = useState(false)
  const [errors, setErrors] = useState({}) // 表单校验错误：{字段名: 提示文字}

  const data = loadData()

  // 提交新建表单：先校验（PRD 功能 2 + 异常状态），通过才创建
  function handleSubmit(e) {
    e.preventDefault()
    const f = e.target
    const name = f.name.value.trim()
    const description = f.description.value.trim()
    const startDate = f.startDate.value
    const dueDate = f.dueDate.value

    const errs = {}
    if (!name) errs.name = '这项要填'
    if (!startDate) errs.startDate = '这项要填'
    if (!dueDate) errs.dueDate = '这项要填'
    if (startDate && dueDate && dueDate < startDate) errs.dueDate = '结束日期要晚于开始日期'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return // 有错就不创建

    createProject({ name, description, startDate, dueDate })
    setVersion(v => v + 1) // 刷新列表（新卡片出现在最前面）
    setShowForm(false)
    setErrors({})
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1>我是超强负责人</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(s => !s); setErrors({}) }}>
          + 新建项目
        </button>
      </header>

      {showForm && (
        <form className="card form" onSubmit={handleSubmit} noValidate>
          <label>
            项目名称 *
            <input name="name" placeholder="例如：毕业设计" />
            {errors.name && <span className="err">{errors.name}</span>}
          </label>
          <label>
            项目定位（一句话，选填）
            <input name="description" placeholder="这个项目是为了什么" />
          </label>
          <div className="row">
            <label>
              开始日期 *
              <input type="date" name="startDate" />
              {errors.startDate && <span className="err">{errors.startDate}</span>}
            </label>
            <label>
              结束日期 *
              <input type="date" name="dueDate" />
              {errors.dueDate && <span className="err">{errors.dueDate}</span>}
            </label>
          </div>
          <div className="row">
            <button type="submit" className="btn btn-primary">创建</button>
            <button type="button" className="btn" onClick={() => { setShowForm(false); setErrors({}) }}>取消</button>
          </div>
        </form>
      )}

      {data.projects.length === 0 && !showForm ? (
        // 空状态引导（PRD 异常状态第 1 条）
        <div className="card empty">
          <p>还没有项目，点右上角「+ 新建项目」创建第一个吧</p>
        </div>
      ) : (
        <div className="cards">
          {data.projects.map(p => (
            <div key={p.id} className="card project-card" onClick={() => navigate('/project/' + p.id)}>
              <h3>{p.name}</h3>
              {p.description && <p className="muted">{p.description}</p>}
              <p className="muted small">{p.startDate} ~ {p.dueDate}</p>
              <div className="progress-line">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: calcProgress(p) + '%' }} />
                </div>
                <span className="progress-num">{calcProgress(p)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
