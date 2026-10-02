// 项目详情页：PRD 功能 3、4、5、6 + Day 7 用户反馈升级（每天多条待办、可加可删、AI 生成草案）
import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  loadData, toggleTodo, editTodoContent, setDayNote,
  addTodoItem, deleteTodoItem, aiFillPlan, calcProgress
} from '../store.js'

export default function ProjectPage() {
  const { id } = useParams()
  const [version, setVersion] = useState(0) // 数据变了就 +1，强制重新读取 localStorage
  const bump = () => setVersion(v => v + 1)

  const project = loadData().projects.find(p => p.id === id)
  if (!project) {
    return (
      <div className="page">
        <p>找不到这个项目</p>
        <Link to="/" className="btn">返回项目栏</Link>
      </div>
    )
  }

  const progress = calcProgress(project)
  const allItems = project.days.flatMap(d => d.items)
  // Day 10 修复②：只统计有内容的条目，空白占位不算任务（与计算进度的口径保持一致）
  const filledItems = allItems.filter(i => (i.content || '').trim() !== '')
  const doneCount = filledItems.filter(i => i.isDone).length

  return (
    <div className="page">
      <Link to="/" className="btn btn-back">← 返回项目栏</Link>

      {/* 项目信息区（PRD 功能 3） */}
      <div className="card detail-head">
        <h1>{project.name}</h1>
        {project.description && <p className="muted">{project.description}</p>}
        <p className="muted small">📅 {project.startDate} ~ {project.dueDate}</p>
        {/* Day 8 问卷向导新增的两个字段：内容方案 / 使用对象（填了才显示） */}
        {project.content && <p className="muted small">📋 {project.content}</p>}
        {project.audience && <p className="muted small">🎯 使用对象：{project.audience}</p>}
        <div className="progress-line">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: progress + '%' }} />
          </div>
          <span className="progress-num">{progress}%</span>
        </div>
        <p className="muted small" style={{ marginTop: 4 }}>共 {filledItems.length} 条待办，已完成 {doneCount} 条</p>

        {/* AI 生成每日安排（Day 7 方案 A：模拟版，下周换真 AI 接口） */}
        <div className="ai-line">
          <button className="btn btn-ai" onClick={() => { aiFillPlan(project.id); bump() }}>
            ✨ 让 AI 帮我排每日安排
          </button>
          <span className="muted small">生成后你可以随便改；不会覆盖你已经写好的内容</span>
        </div>
      </div>

      {/* 按日期分组的每日待办（每天一组，组内多条，可加可删） */}
      <div className="days">
        {project.days.map(d => (
          <DayGroup key={d.id} projectId={project.id} day={d} onDone={bump} />
        ))}
      </div>
    </div>
  )
}

// 一天的分组：日期标题 + 当天完成统计 + 多条待办 + 添加按钮 + 当天说明
function DayGroup({ projectId, day, onDone }) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState(day.note)
  const [adding, setAdding] = useState(false)
  const [addDraft, setAddDraft] = useState('')

  // Day 10 修复②：只数有内容的条目（空白占位不算任务）；修复①：条数为 0 时不再显示「已完成」
  const filled = day.items.filter(i => (i.content || '').trim() !== '')
  const doneCount = filled.filter(i => i.isDone).length
  const allDone = filled.length > 0 && doneCount === filled.length

  return (
    <div className={'card day-card' + (allDone ? ' done' : '')}>
      <div className="day-head">
        <span className="day-title">{day.day}</span>
        <span className="muted small">{filled.length === 0 ? '这天还没安排' : `已完成 ${doneCount} / 共 ${filled.length} 条`}</span>
      </div>

      {/* 这一天的所有待办条目（Day 10 修复①：删空后给出看得见的空状态提示） */}
      <div className="items">
        {day.items.length === 0 && (
          <p className="muted small empty-day">这天还没有待办，点下面的「＋ 添加一条」写点什么</p>
        )}
        {day.items.map(it => (
          <ItemRow key={it.id} projectId={projectId} dayId={day.id} item={it} onDone={onDone} />
        ))}
      </div>

      {/* 添加一条（Day 7 用户反馈） */}
      {adding ? (
        <div className="edit-box">
          <input
            value={addDraft}
            onChange={e => setAddDraft(e.target.value)}
            placeholder="要添加的待办内容"
            onKeyDown={e => {
              if (e.key === 'Enter' && addDraft.trim()) {
                addTodoItem(projectId, day.id, addDraft)
                setAddDraft(''); setAdding(false); onDone()
              }
              if (e.key === 'Escape') { setAdding(false); setAddDraft('') }
            }}
            autoFocus
          />
          <button className="btn btn-mini btn-primary" onClick={() => {
            if (!addDraft.trim()) return
            addTodoItem(projectId, day.id, addDraft)
            setAddDraft(''); setAdding(false); onDone()
          }}>添加</button>
          <button className="btn btn-mini" onClick={() => { setAdding(false); setAddDraft('') }}>取消</button>
        </div>
      ) : (
        <button className="btn btn-mini btn-add" onClick={() => setAdding(true)}>＋ 添加一条</button>
      )}

      {/* 当天说明：一行文字，保存后显示（PRD 功能 4） */}
      {day.note && !editingNote && <p className="note">📝 {day.note}</p>}
      {!editingNote ? (
        <button className="btn btn-mini" onClick={() => { setNoteDraft(day.note); setEditingNote(true) }}>
          {day.note ? '改说明' : '写今日说明'}
        </button>
      ) : (
        <div className="edit-box">
          <input
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            placeholder="今天做了什么，一句话"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setDayNote(projectId, day.id, noteDraft)
                setEditingNote(false); onDone()
              }
            }}
            autoFocus
          />
          <button className="btn btn-mini btn-primary" onClick={() => {
            setDayNote(projectId, day.id, noteDraft)
            setEditingNote(false); onDone()
          }}>保存</button>
        </div>
      )}
    </div>
  )
}

// 单条待办：勾选框 + 文字（可编辑）+ 删除
function ItemRow({ projectId, dayId, item, onDone }) {
  const [editing, setEditing] = useState(false)
  const display = item.content || '待填写'

  return (
    <div className={'item-row' + (item.isDone ? ' item-done' : '')}>
      <label className="check-line">
        <input
          type="checkbox"
          checked={item.isDone}
          onChange={() => { toggleTodo(projectId, dayId, item.id); onDone() }}
        />
        {editing ? null : <span className={item.content ? 'item-text' : 'item-text muted'}>{display}</span>}
      </label>

      {!editing && (
        <span className="item-actions">
          <button className="btn btn-mini" onClick={() => setEditing(true)}>编辑</button>
          <button className="btn btn-mini btn-del" title="删除这条（删到只剩一条会清空成待填写）"
            onClick={() => { deleteTodoItem(projectId, dayId, item.id); onDone() }}>删</button>
        </span>
      )}

      {editing && (
        <span className="edit-box inline">
          <input
            defaultValue={item.content}
            placeholder="这天要推进什么（留空则显示待填写）"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                editTodoContent(projectId, dayId, item.id, e.target.value)
                setEditing(false); onDone()
              }
              if (e.key === 'Escape') setEditing(false)
            }}
            autoFocus
          />
          <button className="btn btn-mini btn-primary" onClick={e => {
            const input = e.target.parentNode.querySelector('input')
            editTodoContent(projectId, dayId, item.id, input.value)
            setEditing(false); onDone()
          }}>保存</button>
        </span>
      )}
    </div>
  )
}
