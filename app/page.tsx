'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Bot, Check, Clock3, Copy, LockKeyhole, Plus, Send, ShieldCheck, Sparkles, Users } from 'lucide-react'

type Lead = {
  id: string; name: string; email: string; company: string; need: string; budget: string; notes: string
  score: 'hot' | 'warm' | 'cold'; explanation: string; firstMessage: string; createdAt: string
}

const emptyForm = { name: '', email: '', company: '', need: '', budget: '', notes: '' }
const sampleLead = {
  name: 'Maya Chen', email: 'maya@northstarhealth.com', company: 'Northstar Health',
  need: 'We need a secure AI intake assistant for our 12-clinic network. Our team wants to pilot by Q1 and connect it with our existing patient portal.',
  budget: '$40k–$60k annual budget', notes: 'Asked for a technical walkthrough next week. VP of Operations is the decision maker.',
}

export default function Home() {
  const [form, setForm] = useState(emptyForm)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selected, setSelected] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function update(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not score this lead.')
      setLeads((current) => [data.lead, ...current])
      setSelected(data.lead)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyMessage() {
    if (!selected) return
    await navigator.clipboard.writeText(selected.firstMessage)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const hotCount = leads.filter((lead) => lead.score === 'hot').length

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Signal home"><span className="brand-mark"><span /><span /><span /></span><span>signal<span className="brand-dot">.</span></span></a>
        <div className="topbar-center"><span className="live-dot" /> NEAR AI CLOUD <span className="topbar-divider">/</span> PRIVATE INFERENCE</div>
        <a className="deadline" href="https://near.ai" target="_blank" rel="noreferrer"><span>NEAR HACKATHON · 14 NOV, 23:59 UTC</span><ArrowUpRight size={14} /></a>
      </header>

      <div className="page-wrap" id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> LEAD INTELLIGENCE <span className="eyebrow-index">— 01</span></div>
            <h1>Good leads.<br /><em>Clear signals.</em></h1>
            <p className="hero-description">Turn a little context into your next best conversation. Private lead qualification, powered by NEAR AI Cloud.</p>
          </div>
          <div className="hero-aside"><div className="aside-icon"><LockKeyhole size={17} /></div><p>Your lead data is scored with<br /><strong>private AI inference.</strong></p><span className="aside-rule" /></div>
        </section>

        <section className="stats-row" aria-label="Lead overview">
          <div className="stat-item"><span className="stat-icon"><Users size={16} /></span><div><span className="stat-label">TOTAL LEADS</span><strong>{String(leads.length).padStart(2, '0')}</strong></div></div>
          <div className="stat-item"><span className="stat-icon hot-icon"><Sparkles size={16} /></span><div><span className="stat-label">READY TO TALK</span><strong>{String(hotCount).padStart(2, '0')}</strong></div></div>
          <div className="stat-note"><ShieldCheck size={15} /><span>PRIVATE BY DESIGN</span><span className="note-divider">·</span><span>NO DATA STORED ON DISK</span></div>
        </section>

        <section className="workspace-grid">
          <div className="left-column">
            <div className="section-heading"><div><span className="section-kicker">01 / INTAKE</span><h2>Tell us about the lead</h2></div><span className="required-note">* REQUIRED</span></div>
            <form className="lead-form" onSubmit={submit}>
              <div className="form-grid">
                <label className="field"><span>FULL NAME <b>*</b></span><input required maxLength={120} autoComplete="name" placeholder="e.g. Maya Chen" value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
                <label className="field"><span>WORK EMAIL <b>*</b></span><input required type="email" maxLength={254} autoComplete="email" placeholder="maya@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
                <label className="field"><span>COMPANY <b>*</b></span><input required maxLength={160} autoComplete="organization" placeholder="Company name" value={form.company} onChange={(e) => update('company', e.target.value)} /></label>
                <label className="field"><span>BUDGET</span><input maxLength={160} placeholder="e.g. $20k–$50k / year" value={form.budget} onChange={(e) => update('budget', e.target.value)} /></label>
                <label className="field field-wide"><span>WHAT DO THEY NEED? <b>*</b></span><textarea required maxLength={2000} rows={3} placeholder="The challenge, the ideal outcome, and when they need it…" value={form.need} onChange={(e) => update('need', e.target.value)} /></label>
                <label className="field field-wide"><span>EXTRA CONTEXT</span><textarea maxLength={2000} rows={2} placeholder="Decision makers, timing, how they found you…" value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
              </div>
              {error && <p className="error-message" role="alert">{error}</p>}
              <div className="form-footer"><span className="privacy-note"><LockKeyhole size={13} /> Sent securely to NEAR AI Cloud</span><div className="form-actions"><button type="button" className="sample-button" onClick={() => setForm(sampleLead)}><ArrowDownLeft size={14} /> TRY SAMPLE</button><button className="submit-button" type="submit" disabled={loading}>{loading ? <><span className="spinner" /> SCORING…</> : <>QUALIFY LEAD <Send size={14} /></>}</button></div></div>
            </form>

            <div className="results-heading"><div><span className="section-kicker">02 / YOUR PIPELINE</span><h2>Scored leads <span className="count-pill">{leads.length}</span></h2></div><span className="sort-label"><Clock3 size={13} /> MOST RECENT</span></div>
            <div className="lead-list">
              {leads.length === 0 ? <div className="empty-state"><div className="empty-icon"><Bot size={19} /></div><div><strong>Your pipeline starts here</strong><p>Try the sample lead to see a score, reasoning, and a ready-to-send message.</p></div><ArrowUpRight size={16} className="empty-arrow" /></div> : leads.map((lead) => (
                <button key={lead.id} className={`lead-row ${selected?.id === lead.id ? 'lead-row-active' : ''}`} onClick={() => setSelected(lead)}>
                  <span className={`score-dot score-${lead.score}`} /><span className="lead-row-main"><strong>{lead.name}</strong><span>{lead.company} <i>·</i> {lead.email}</span></span><span className={`score-label score-text-${lead.score}`}>{lead.score.toUpperCase()}</span><ArrowUpRight size={15} className="row-arrow" />
                </button>
              ))}
            </div>
          </div>

          <aside className="right-column" aria-live="polite">
            <div className="section-heading result-header"><div><span className="section-kicker">03 / THE READOUT</span><h2>Qualification</h2></div><span className="ai-stamp"><span className="live-dot" /> AI</span></div>
            {selected ? <div className="readout-card">
              <div className={`verdict verdict-${selected.score}`}><span className="verdict-mark">{selected.score === 'hot' ? '↗' : selected.score === 'warm' ? '◷' : '↘'}</span><div><span className="verdict-overline">LEAD TEMPERATURE</span><strong>{selected.score}</strong></div><span className="verdict-spark">✳</span></div>
              <div className="readout-body"><span className="readout-label">WHY THIS SCORE</span><p className="explanation">{selected.explanation}</p><div className="readout-separator" /><div className="message-header"><span className="readout-label">YOUR FIRST MESSAGE</span><span className="draft-tag">DRAFT</span></div><p className="draft-message">{selected.firstMessage}</p><button type="button" className="copy-button" onClick={copyMessage}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'COPIED' : 'COPY MESSAGE'}</button></div>
              <div className="readout-foot"><ShieldCheck size={14} /><span>Generated privately with NEAR AI Cloud</span></div>
            </div> : <div className="readout-empty"><div className="empty-orbit"><span /><Bot size={22} /></div><strong>Waiting for a signal</strong><p>Submit a lead and your AI-powered readout will appear here.</p><div className="readout-empty-line" /></div>}
            <div className="model-note"><span className="model-indicator" /><span>MODEL</span><strong>{process.env.NEXT_PUBLIC_NEAR_AI_MODEL || 'GLM-5.1-FP8'}</strong><span className="model-lock"><LockKeyhole size={12} /> PRIVATE</span></div>
          </aside>
        </section>

        <footer className="footer"><span>© 2026 SIGNAL — BUILT FOR NEAR HACKATHON</span><span>BUSINESS <i>·</i> AGENTS <i>·</i> PRIVACY</span><a href="https://docs.near.ai/cloud/quickstart" target="_blank" rel="noreferrer">NEAR AI CLOUD <ArrowUpRight size={12} /></a></footer>
      </div>
    </main>
  )
}
