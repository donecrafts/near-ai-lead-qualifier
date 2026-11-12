'use client'

import { useState } from 'react'
import { ArrowRight, Check, Clipboard, Copy, Home, LoaderCircle, MapPin, ShieldCheck } from 'lucide-react'
import type { LeadForm, ScoredLead } from '@/lib/lead-types'

const emptyForm: LeadForm = {
  fullName: '',
  email: '',
  phone: '',
  lookingTo: '',
  area: '',
  budget: '',
  timeline: '',
  financing: 'Unknown',
  notes: '',
}

const samples: { label: string; form: LeadForm }[] = [
  {
    label: 'Hot buyer',
    form: {
      fullName: 'Talia Brooks', email: 'talia.brooks@example.com', phone: '206-555-0142', lookingTo: 'Buy',
      area: 'Capitol Hill, Seattle', budget: '$850,000–$950,000', timeline: 'Ready to buy this month', financing: 'Yes',
      notes: 'Pre-approved with a local lender. Wants to tour two-bedroom homes near light rail this weekend.',
    },
  },
  {
    label: 'Warm renter',
    form: {
      fullName: 'Omar Rodriguez', email: 'omar.rodriguez@example.com', phone: '347-555-0188', lookingTo: 'Rent',
      area: 'Park Slope, Brooklyn', budget: '$2,700–$3,100 per month', timeline: 'Moving in about three months', financing: 'Unknown',
      notes: 'Looking for a one-bedroom near the subway. Has not confirmed proof of funds yet.',
    },
  },
  {
    label: 'Cold browser',
    form: {
      fullName: 'Lena Williams', email: 'lena.williams@example.com', phone: '', lookingTo: 'Buy',
      area: 'Somewhere near the coast', budget: '', timeline: 'Just browsing; maybe next year', financing: 'Unknown',
      notes: 'Still exploring options and has not spoken with a lender.',
    },
  },
]

const csvColumns = {
  fullName: ['fullname', 'yourname', 'respondentname', 'name'],
  email: ['emailaddress', 'email'],
  phone: ['phonenumber', 'mobile', 'phone'],
  lookingTo: ['lookingto', 'lookingfor', 'buyrent', 'transactiontype'],
  area: ['areaorneighbourhood', 'areaorneighborhood', 'neighbourhood', 'neighborhood', 'location', 'area'],
  budget: ['budgetorpricerange', 'pricerange', 'budget', 'price'],
  timeline: ['timeline', 'timeframe', 'movein'],
  financing: ['mortgagepreapprovedorproofoffunds', 'preapproved', 'proofoffunds', 'financing'],
  notes: ['notes', 'additionaldetails', 'message', 'details'],
} as const

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function getCsvFields(text: string): LeadForm {
  const rows = parseCsv(text)
  if (!rows.length) throw new Error('Paste a Google Forms CSV or a single Sheets row first.')

  const headers = rows[0].map(normalizeHeader)
  const hasHeader = headers.some((header) => csvColumns.fullName.some((name) => header === name || header.includes(name)))
    && headers.some((header) => csvColumns.email.some((name) => header === name || header.includes(name)))

  let values: Record<keyof LeadForm, string>
  if (hasHeader) {
    const record = rows[1]
    if (!record) throw new Error('The CSV has a header but no lead row.')
    const findIndex = (aliases: readonly string[]) => headers.findIndex((header) => aliases.some((name) => header === name || header.includes(name)))
    const valueAt = (field: keyof LeadForm) => {
      const column = findIndex(csvColumns[field])
      return column >= 0 ? record[column] || '' : ''
    }
    values = {
      fullName: valueAt('fullName'), email: valueAt('email'), phone: valueAt('phone'),
      lookingTo: valueAt('lookingTo'), area: valueAt('area'), budget: valueAt('budget'),
      timeline: valueAt('timeline'), financing: valueAt('financing'), notes: valueAt('notes'),
    }
  } else {
    const record = rows[0]
    values = {
      fullName: record[0] || '', email: record[1] || '', phone: record[2] || '',
      lookingTo: record[3] || '', area: record[4] || '', budget: record[5] || '',
      timeline: record[6] || '', financing: record[7] || '', notes: record.slice(8).join(', '),
    }
  }

  const looking = values.lookingTo.toLowerCase()
  const lookingTo: LeadForm['lookingTo'] = looking.includes('rent') || looking.includes('lease') ? 'Rent'
    : looking.includes('sell') || looking.includes('list') ? 'Sell'
      : looking.includes('buy') || looking.includes('purchase') ? 'Buy' : ''
  const financingValue = values.financing.toLowerCase()
  const financing: LeadForm['financing'] = financingValue.startsWith('y') ? 'Yes'
    : financingValue.startsWith('n') ? 'No' : 'Unknown'

  if (!values.fullName || !values.email) throw new Error('The pasted data needs a name and email column (or name and email as the first two cells).')
  return { ...emptyForm, ...values, lookingTo, financing }
}

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function LeadQualifier() {
  const [form, setForm] = useState<LeadForm>(emptyForm)
  const [pasteText, setPasteText] = useState('')
  const [pasteStatus, setPasteStatus] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [leads, setLeads] = useState<ScoredLead[]>([])
  const [selected, setSelected] = useState<ScoredLead | null>(null)
  const [scoring, setScoring] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function update(field: keyof LeadForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function scoreLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setScoring(true)
    setError('')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not score this lead.')
      setLeads((current) => [data.lead as ScoredLead, ...current])
      setSelected(data.lead as ScoredLead)
    } catch (caught) {
      setError(messageFor(caught, 'Something went wrong. Please try again.'))
    } finally {
      setScoring(false)
    }
  }

  async function fillFromPaste() {
    const trimmedPaste = pasteText.trim()
    if (!trimmedPaste) {
      setPasteError('Paste a lead message first.')
      setPasteStatus('')
      return
    }

    setExtracting(true)
    setPasteError('')
    setPasteStatus('')
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedPaste }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not read that paste.')
      setForm(data.fields as LeadForm)
      setPasteStatus('Fields filled. Review and edit them before scoring.')
    } catch (caught) {
      setPasteError(messageFor(caught, 'Could not read that paste. Please try again.'))
    } finally {
      setExtracting(false)
    }
  }

  function fillFromSheets() {
    setPasteError('')
    setPasteStatus('')
    try {
      setForm(getCsvFields(pasteText))
      setPasteStatus('First lead filled from the CSV. Review and edit before scoring.')
    } catch (caught) {
      setPasteError(messageFor(caught, 'Could not read that row. Check the pasted CSV.'))
    }
  }

  async function copyMessage() {
    if (!selected) return
    try {
      await navigator.clipboard.writeText(selected.firstMessage)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Clipboard access was blocked. Select and copy the message instead.')
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="NearSignal home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>NearSignal</span>
        </a>
        <p className="tagline">Know which buyers and renters to call first.</p>
      </header>

      <div className="page-wrap" id="top">
        <section className="intro">
          <div>
            <h1>NearSignal for <span>Real Estate</span></h1>
          </div>
          <p className="intro-note"><ShieldCheck size={17} /> Private scoring powered by NEAR AI Cloud</p>
        </section>

        <section className="workspace-grid" aria-label="Lead qualification workspace">
          <div className="intake-card">
            <div className="card-heading">
              <div><h2>New lead</h2><p>Paste a message or enter details below.</p></div>
              <span className="step-icon"><Home size={18} /></span>
            </div>

            <section className="paste-section" aria-labelledby="paste-heading">
              <label id="paste-heading" htmlFor="lead-paste">Paste a lead</label>
              <p>Paste a form response, email, WhatsApp or DM message</p>
              <textarea
                id="lead-paste"
                className="paste-box"
                rows={5}
                maxLength={12000}
                placeholder="Hi, I’m looking for a two-bedroom in Park Slope around $3,000/month. Hoping to move this summer…"
                value={pasteText}
                onChange={(event) => { setPasteText(event.target.value); setPasteError(''); setPasteStatus('') }}
              />
              <div className="paste-actions">
                <button type="button" className="button button-primary button-small" onClick={fillFromPaste} disabled={extracting || scoring}>
                  {extracting ? <><LoaderCircle className="spin" size={15} /> Reading paste…</> : <>Fill from paste <ArrowRight size={15} /></>}
                </button>
                <button type="button" className="button button-quiet button-small" onClick={fillFromSheets} disabled={extracting || scoring}>
                  <Clipboard size={14} /> Paste a row from Sheets / CSV
                </button>
              </div>
              {pasteError && <p className="feedback feedback-error" role="alert">{pasteError}</p>}
              {pasteStatus && <p className="feedback feedback-success" role="status">{pasteStatus}</p>}
            </section>

            <div className="sample-section">
              <span className="field-label">Sample leads</span>
              <div className="sample-actions">
                {samples.map((sample) => (
                  <button key={sample.label} type="button" className="sample-button" onClick={() => { setForm(sample.form); setError(''); setPasteStatus('Sample loaded. Review the details, then score the lead.') }}>
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={scoreLead} className="lead-form">
              <div className="form-grid">
                <label className="field">
                  <span>Full name <b>*</b></span>
                  <input required maxLength={120} autoComplete="name" placeholder="e.g. Talia Brooks" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} />
                </label>
                <label className="field">
                  <span>Email <b>*</b></span>
                  <input required type="email" maxLength={254} autoComplete="email" placeholder="name@example.com" value={form.email} onChange={(event) => update('email', event.target.value)} />
                </label>
                <label className="field">
                  <span>Phone <small>Optional</small></span>
                  <input type="tel" maxLength={50} autoComplete="tel" placeholder="(206) 555-0123" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
                </label>
                <label className="field">
                  <span>Looking to <b>*</b></span>
                  <select required value={form.lookingTo} onChange={(event) => update('lookingTo', event.target.value)}>
                    <option value="">Choose one</option><option value="Buy">Buy</option><option value="Rent">Rent</option><option value="Sell">Sell</option>
                  </select>
                </label>
                <label className="field">
                  <span>Area or neighbourhood</span>
                  <input maxLength={160} placeholder="e.g. Capitol Hill, Seattle" value={form.area} onChange={(event) => update('area', event.target.value)} />
                </label>
                <label className="field">
                  <span>Budget or price range</span>
                  <input maxLength={160} placeholder="e.g. $850k–$950k" value={form.budget} onChange={(event) => update('budget', event.target.value)} />
                </label>
                <label className="field">
                  <span>Timeline</span>
                  <input maxLength={120} placeholder="e.g. this month, 3 months, just browsing" value={form.timeline} onChange={(event) => update('timeline', event.target.value)} />
                </label>
                <label className="field">
                  <span>Mortgage pre-approved or proof of funds</span>
                  <select value={form.financing} onChange={(event) => update('financing', event.target.value)}>
                    <option value="Yes">Yes</option><option value="No">No</option><option value="Unknown">Unknown</option>
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Notes</span>
                  <textarea maxLength={2000} rows={3} placeholder="Anything else that helps you follow up well…" value={form.notes} onChange={(event) => update('notes', event.target.value)} />
                </label>
              </div>

              {error && <p className="feedback feedback-error" role="alert">{error}</p>}
              <div className="form-footer">
                <p className="privacy-note">Your pipeline stays in this tab and clears when you refresh.</p>
                <button type="submit" className="button button-primary score-button" disabled={scoring || extracting}>
                  {scoring ? <><LoaderCircle className="spin" size={16} /> Scoring…</> : <>Score this lead <ArrowRight size={16} /> </>}
                </button>
              </div>
              {scoring && <p className="loading-note" role="status" aria-live="polite">Scoring with NEAR AI Cloud. This can take up to a minute; keep this tab open.</p>}
            </form>
          </div>

          <aside className="result-column" aria-live="polite" aria-label="Lead qualification result">
            <div className="result-heading"><h2>Qualification</h2><span>NEAR AI CLOUD</span></div>
            {selected ? (
              <article className="result-card">
                <div className="result-topline">
                  <div><p className="result-name">{selected.fullName}</p><p className="result-context">{selected.lookingTo} · {selected.area || 'Area not specified'}</p></div>
                  <span className={`score-badge score-${selected.score}`}>{selected.score}</span>
                </div>
                <p className="result-explanation">{selected.explanation}</p>
                <div className="reason-section"><h3>Why this score</h3><ul>{selected.reasons.map((reason, index) => <li key={`${selected.id}-${index}`}>{reason}</li>)}</ul></div>
                <div className="draft-section"><div className="draft-heading"><h3>Suggested first message</h3><button type="button" className="copy-button" onClick={copyMessage}>{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy message</>}</button></div><p className="draft-message">{selected.firstMessage}</p></div>
              </article>
            ) : (
              <div className="result-empty"><div className="empty-mark"><Home size={20} /></div><h3>Your readout will appear here</h3><p>Score a lead to see its temperature, reasons, and a tailored first message.</p></div>
            )}
          </aside>
        </section>

        <section className="pipeline-section" aria-labelledby="pipeline-heading">
          <div className="pipeline-heading"><div><h2 id="pipeline-heading">Pipeline</h2><p>{leads.length ? `${leads.length} ${leads.length === 1 ? 'lead' : 'leads'} scored in this tab` : 'Your scored leads appear here for this session only.'}</p></div><span className="pipeline-count">{leads.length}</span></div>
          <div className="table-scroll" role="region" aria-label="Scored leads table" tabIndex={0}>
            <table>
              <thead><tr><th scope="col">Name</th><th scope="col">Looking to</th><th scope="col">Area</th><th scope="col">Budget</th><th scope="col">Score</th></tr></thead>
              <tbody>
                {leads.length === 0 ? <tr><td className="table-empty" colSpan={5}>No leads scored yet. Try one of the sample leads to begin.</td></tr> : leads.map((lead) => (
                  <tr key={lead.id} className={selected?.id === lead.id ? 'selected-row' : ''}>
                    <td><button type="button" className="table-name" onClick={() => { setSelected(lead); setCopied(false) }}>{lead.fullName}</button></td>
                    <td>{lead.lookingTo}</td><td><span className="area-cell"><MapPin size={13} />{lead.area || '—'}</span></td><td>{lead.budget || '—'}</td>
                    <td><span className={`score-badge score-${lead.score}`}>{lead.score}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="footer"><span>Built at NEAR Hackathon</span><span><ShieldCheck size={14} /> Private scoring powered by NEAR AI Cloud</span></footer>
      </div>
    </main>
  )
}
