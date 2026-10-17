import { useEffect, useState } from 'react'
import './App.css'

const POMODORO_SECONDS = 25 * 60
const API_URL = 'http://127.0.0.1:8000'

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')

  return `${minutes}:${remainingSeconds}`
}

function App() {
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [tasks, setTasks] = useState([])
  const [taskTitle, setTaskTitle] = useState('')
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [taskError, setTaskError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadTasks() {
      try {
        const response = await fetch(`${API_URL}/tasks`)

        if (!response.ok) {
          throw new Error('Görevler yüklenemedi.')
        }

        const data = await response.json()

        if (isMounted) {
          setTasks(data.map((task) => ({ ...task, tag: task.tag || 'Görev' })))
          setTaskError('')
        }
      } catch (error) {
        if (isMounted) {
          setTaskError(error.message || 'Backend ile bağlantı kurulamadı.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingTasks(false)
        }
      }
    }

    loadTasks()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isRunning) return undefined

    const timer = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          setIsRunning(false)
          return POMODORO_SECONDS
        }

        return currentSeconds - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isRunning])

  const completedTasks = tasks.filter((task) => task.completed).length
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0

  async function addTask(event) {
    event.preventDefault()
    const title = taskTitle.trim()

    if (!title || isSubmittingTask) return

    setIsSubmittingTask(true)
    setTaskError('')

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error('Görev eklenemedi.')
      }

      const createdTask = await response.json()

      setTasks((currentTasks) => [
        ...currentTasks,
        { ...createdTask, tag: createdTask.tag || 'Yeni görev' },
      ])
      setTaskTitle('')
    } catch (error) {
      setTaskError(error.message || 'Backend ile bağlantı kurulamadı.')
    } finally {
      setIsSubmittingTask(false)
    }
  }

  function toggleTask(id) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function resetTimer() {
    setIsRunning(false)
    setSecondsLeft(POMODORO_SECONDS)
  }

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">◒</span>
            <span>focus / flow</span>
          </div>
          <span className="date-label">SATURDAY, OCTOBER 17</span>
        </header>

        <section className="hero-grid">
          <article className="timer-card">
            <div>
              <span className="eyebrow">CURRENT SESSION</span>
              <h1>Deep work</h1>
            </div>

            <div className="timer-wrap">
              <div className="timer-ring">
                <div className="timer-content">
                  <span className="timer-value">{formatTime(secondsLeft)}</span>
                  <span className="timer-status">{isRunning ? 'IN PROGRESS' : 'READY TO FOCUS'}</span>
                </div>
              </div>
            </div>

            <div className="timer-controls">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setIsRunning((running) => !running)}
              >
                <span aria-hidden="true">{isRunning ? 'Ⅱ' : '▶'}</span>
                {isRunning ? 'Durdur' : 'Başlat'}
              </button>
              <button type="button" className="button button-secondary" onClick={resetTimer}>
                <span aria-hidden="true">↻</span>
                Sıfırla
              </button>
            </div>
          </article>

          <aside className="summary-card">
            <span className="eyebrow">TODAY&apos;S RHYTHM</span>
            <div className="progress-circle" style={{ '--progress': `${progress * 3.6}deg` }}>
              <div>
                <strong>{progress}%</strong>
                <span>complete</span>
              </div>
            </div>
            <div className="summary-line">
              <span>Tasks completed</span>
              <strong>{completedTasks} / {tasks.length}</strong>
            </div>
          </aside>
        </section>

        <section className="tasks-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR WORKSPACE</span>
              <h2>Görevler</h2>
            </div>
            <span className="task-total">{tasks.length} TASKS</span>
          </div>

          <form className="task-form" onSubmit={addTask}>
            <input
              type="text"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Bugün neye odaklanacaksın?"
              aria-label="Yeni görev"
            />
            <button type="submit" className="button button-add" disabled={isSubmittingTask}>
              {isSubmittingTask ? 'Ekleniyor...' : 'Görev Ekle'} <span aria-hidden="true">+</span>
            </button>
          </form>

          {taskError && <p className="task-error" role="alert">{taskError}</p>}

          <div className="task-list">
            {isLoadingTasks && <p className="task-message">Görevler yükleniyor...</p>}
            {!isLoadingTasks && !taskError && tasks.length === 0 && (
              <p className="task-message">Henüz görev bulunmuyor.</p>
            )}
            {!isLoadingTasks && tasks.map((task) => (
              <label className={`task-row ${task.completed ? 'is-complete' : ''}`} key={task.id}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <span className="custom-check" aria-hidden="true">✓</span>
                <span className="task-details">
                  <span className="task-title">{task.title}</span>
                  <span className="task-tag">{task.tag}</span>
                </span>
                <span className="task-arrow" aria-hidden="true">↗</span>
              </label>
            ))}
          </div>
        </section>

        <footer className="footer-note">
          <span>ONE SESSION AT A TIME</span>
          <span>●</span>
          <span>MAKE IT COUNT</span>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        :root {
          font-family: 'Space Grotesk', sans-serif;
          color: #f3f1e9;
          background: #0b0e13;
        }

        * { box-sizing: border-box; }
        body { margin: 0; min-width: 320px; background: #0b0e13; }
        button, input { font: inherit; }
        button { cursor: pointer; }

        .app-shell {
          min-height: 100vh;
          padding: 32px 22px 50px;
          background:
            radial-gradient(circle at 11% 6%, rgba(112, 225, 193, .12), transparent 26rem),
            radial-gradient(circle at 91% 68%, rgba(246, 166, 255, .08), transparent 25rem),
            #0b0e13;
        }

        .page-container { width: min(960px, 100%); margin: 0 auto; }
        .topbar, .section-heading, .summary-line, .footer-note { display: flex; align-items: center; }
        .topbar { justify-content: space-between; margin-bottom: 54px; }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: -.04em; }
        .brand-mark { color: #70e1c1; font-size: 20px; line-height: 1; }
        .date-label, .eyebrow, .task-total, .task-tag, .footer-note, .timer-status { font-family: 'DM Mono', monospace; }
        .date-label, .eyebrow, .task-total, .footer-note { color: #747b8b; font-size: 10px; letter-spacing: .13em; }

        .hero-grid { display: grid; grid-template-columns: 1.16fr .84fr; gap: 20px; }
        .timer-card, .summary-card, .tasks-card { border: 1px solid #252b36; border-radius: 18px; background: rgba(18, 22, 30, .88); }
        .timer-card { min-height: 410px; padding: 31px 34px; display: flex; flex-direction: column; justify-content: space-between; }
        h1, h2 { margin: 10px 0 0; letter-spacing: -.05em; }
        h1 { font-size: 22px; font-weight: 600; }
        h2 { font-size: 21px; font-weight: 600; }
        .timer-wrap { display: grid; place-items: center; margin: 12px 0; }
        .timer-ring { width: min(246px, 68vw); aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; background: conic-gradient(#70e1c1 0 72%, #26313a 72% 100%); box-shadow: 0 0 50px rgba(112, 225, 193, .09); }
        .timer-ring::before { content: ''; position: absolute; width: min(214px, 59vw); aspect-ratio: 1; border-radius: 50%; background: #12161e; }
        .timer-content { position: relative; display: grid; justify-items: center; gap: 10px; }
        .timer-value { font: 500 clamp(44px, 8vw, 72px)/1 'DM Mono', monospace; letter-spacing: -.08em; }
        .timer-status { color: #70e1c1; font-size: 10px; letter-spacing: .12em; }
        .timer-controls { display: flex; gap: 10px; }
        .button { border: 1px solid transparent; border-radius: 9px; padding: 12px 17px; font-size: 13px; font-weight: 700; transition: .18s ease; }
        .button span { margin-right: 8px; }
        .button-primary, .button-add { color: #09110f; background: #70e1c1; }
        .button-primary:hover, .button-add:hover { background: #8cebd1; transform: translateY(-1px); }
        .button-secondary { border-color: #343b49; color: #d8dbe2; background: #1a1f28; }
        .button-secondary:hover { border-color: #70e1c1; }
        .summary-card { padding: 29px; display: flex; flex-direction: column; justify-content: space-between; }
        .progress-circle { position: relative; display: grid; place-items: center; width: 164px; aspect-ratio: 1; margin: 35px auto; border-radius: 50%; background: conic-gradient(#f6a6ff var(--progress), #2c303c 0); }
        .progress-circle::before { content: ''; position: absolute; inset: 10px; border-radius: 50%; background: #12161e; }
        .progress-circle div { position: relative; display: grid; justify-items: center; }
        .progress-circle strong { font: 500 32px 'DM Mono', monospace; }
        .progress-circle span { margin-top: 4px; color: #858b9b; font-size: 11px; }
        .summary-line { justify-content: space-between; border-top: 1px solid #252b36; padding-top: 15px; color: #858b9b; font-size: 13px; }
        .summary-line strong { color: #f3f1e9; font: 500 14px 'DM Mono', monospace; }
        .tasks-card { margin-top: 20px; padding: 29px 32px 12px; }
        .section-heading { justify-content: space-between; margin-bottom: 22px; }
        .task-form { display: flex; gap: 10px; margin-bottom: 17px; }
        .task-form input { flex: 1; min-width: 0; border: 1px solid #343b49; border-radius: 9px; outline: none; padding: 12px 15px; color: #f3f1e9; background: #0e1218; }
        .task-form input::placeholder { color: #697080; }
        .task-form input:focus { border-color: #70e1c1; }
        .button-add { white-space: nowrap; }
        .task-row { position: relative; display: flex; align-items: center; gap: 13px; min-height: 68px; border-top: 1px solid #252b36; cursor: pointer; }
        .task-row input { position: absolute; opacity: 0; pointer-events: none; }
        .custom-check { width: 19px; height: 19px; display: grid; place-items: center; border: 1px solid #526070; border-radius: 5px; color: transparent; font-size: 12px; transition: .18s ease; }
        .task-row:hover .custom-check { border-color: #70e1c1; }
        .task-row input:checked + .custom-check { border-color: #70e1c1; color: #08110e; background: #70e1c1; }
        .task-details { flex: 1; min-width: 0; display: grid; gap: 5px; }
        .task-title { overflow: hidden; color: #e7e8ed; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
        .is-complete .task-title { color: #717988; text-decoration: line-through; }
        .task-tag { color: #858b9b; font-size: 10px; }
        .task-arrow { color: #657080; font-size: 20px; }
        .footer-note { justify-content: center; gap: 13px; padding-top: 30px; }
        .footer-note span:nth-child(2) { color: #70e1c1; font-size: 7px; }

        @media (max-width: 700px) {
          .app-shell { padding: 24px 16px 40px; }
          .topbar { margin-bottom: 35px; }
          .date-label { font-size: 8px; }
          .hero-grid { grid-template-columns: 1fr; }
          .timer-card { min-height: 390px; padding: 25px; }
          .summary-card { min-height: 300px; padding: 25px; }
          .tasks-card { padding: 25px 18px 10px; }
          .task-form { align-items: stretch; flex-direction: column; }
          .button-add { padding: 12px; }
        }
      `}</style>
    </main>
  )
}

export default App
