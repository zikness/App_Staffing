import { Component, ErrorInfo, FormEvent, ReactNode, useEffect, useState } from "react"

type View = "Mi espacio" | "Talento" | "Solicitudes" | "Historial" | "Pool" | "Seguimiento"
type RequestStatus = "Abierta" | "Cubierta" | "Cerrada" | "Cancelada"
type PersonStatus = "En liberación" | "Disponible" | "Reservado" | "En entrevista" | "Preasignado" | "Asignado"
type Request = { id: string; title: string; project: string; client: string; profile: string; seniority: string; required: string[]; desired: string[]; vacancies: number; covered: number; start: string; owner: string; description: string; status: RequestStatus; created: string }
type Person = { id: string; name: string; specialty: string; seniority: string; skills: string[]; status: PersonStatus; available: string; project?: string; experience: string; notes: string }
type Reservation = { id: string; personId: string; requestId: string; expires: string; notes: string; created: string; status: "Activa" | "Cancelada" | "Expirada" | "Asignada"; reason?: string }
type Interview = { id: string; personId: string; requestId: string; date: string; interviewer: string; notes: string; result: "Pendiente" | "Continúa" | "No continúa"; comment?: string; next?: string }
type Release = { id: string; personId: string; project: string; date: string; notes: string; status: "Prevista" | "Confirmada" }
type Assignment = { id: string; personId: string; requestId: string; project: string; start: string; end?: string }
type Event = { id: string; date: string; action: string; detail: string; personId?: string; requestId?: string; reason?: string }
type Data = { requests: Request[]; people: Person[]; reservations: Reservation[]; interviews: Interview[]; releases: Release[]; assignments: Assignment[]; events: Event[] }
type Modal = null | { type: "request"; request?: Request } | { type: "reserve"; personId: string; requestId?: string } | { type: "interview"; personId: string; requestId?: string } | { type: "result"; interviewId: string } | { type: "assign"; personId: string; requestId?: string } | { type: "release"; personId: string } | { type: "close"; requestId: string }

const now = () => new Date().toISOString()
const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const future = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return localDate(d) }
const seed: Data = {
  requests: [
    { id: "REQ-2025-047", title: "Arquitectura cloud para Core", project: "Transformación Core", client: "Banco Norte", profile: "Arquitecto/a Cloud", seniority: "Senior", required: ["AWS", "Kubernetes", "Terraform", "FinOps"], desired: ["Azure"], vacancies: 2, covered: 0, start: future(20), owner: "Elena Martín", description: "Liderar la modernización de la plataforma core.", status: "Abierta", created: "2025-03-11T09:05:00.000Z" },
    { id: "REQ-2025-048", title: "Research B2B", project: "Portal Empresas", client: "Financia", profile: "UX Researcher", seniority: "Semi Senior", required: ["Research", "B2B", "Figma"], desired: ["Entrevistas"], vacancies: 1, covered: 0, start: future(32), owner: "Carlos Vega", description: "Investigación continua para el nuevo portal.", status: "Abierta", created: "2025-03-12T11:30:00.000Z" },
    { id: "REQ-2025-049", title: "Data Engineer Global", project: "Data Hub Global", client: "Retail Uno", profile: "Data Engineer", seniority: "Senior", required: ["Python", "Spark", "Databricks", "SQL"], desired: ["Azure"], vacancies: 1, covered: 0, start: future(45), owner: "Sofía Herrera", description: "Construcción del lakehouse global.", status: "Abierta", created: "2025-03-13T10:15:00.000Z" },
  ],
  people: [
    { id: "P-001", name: "Laura Prieto", specialty: "Cloud Solutions Architect", seniority: "Senior", skills: ["AWS", "Kubernetes", "Terraform"], status: "Disponible", available: future(2), experience: "9 años en plataformas cloud y modernización bancaria.", notes: "Preferencia híbrida en Madrid." },
    { id: "P-002", name: "Álvaro Santos", specialty: "Cloud Platform Engineer", seniority: "Senior", skills: ["AWS", "EKS", "FinOps"], status: "En liberación", available: future(12), project: "Plataforma Delta", experience: "7 años en ingeniería de plataforma.", notes: "Liberación pendiente de confirmación." },
    { id: "P-003", name: "Nuria Campos", specialty: "DevOps & Cloud Lead", seniority: "Lead", skills: ["Terraform", "Azure", "Kubernetes"], status: "Disponible", available: future(5), experience: "11 años liderando equipos DevOps.", notes: "Disponible para proyectos de larga duración." },
    { id: "P-004", name: "Marta Gil", specialty: "UX Researcher", seniority: "Semi Senior", skills: ["Research", "B2B", "Figma", "Entrevistas"], status: "Asignado", available: future(90), project: "Experiencia Pyme", experience: "5 años en investigación de producto B2B.", notes: "Asignación vigente." },
    { id: "P-005", name: "Diego Mora", specialty: "Data Engineer", seniority: "Senior", skills: ["Python", "Spark", "SQL", "Databricks"], status: "Disponible", available: future(1), experience: "8 años en arquitecturas de datos.", notes: "Certificación Databricks." },
  ],
  reservations: [],
  interviews: [],
  releases: [{ id: "L-001", personId: "P-002", project: "Plataforma Delta", date: future(12), notes: "Cierre de transición pendiente.", status: "Prevista" }],
  assignments: [{ id: "A-001", personId: "P-004", requestId: "REQ-2024-021", project: "Experiencia Pyme", start: future(-20), end: future(60) }],
  events: [
    { id: "E-001", date: "2025-03-13T10:15:00.000Z", action: "Solicitud creada", detail: "Data Engineer Global", requestId: "REQ-2025-049" },
    { id: "E-002", date: "2025-03-12T11:30:00.000Z", action: "Solicitud creada", detail: "Research B2B", requestId: "REQ-2025-048" },
    { id: "E-003", date: "2025-03-11T09:05:00.000Z", action: "Solicitud creada", detail: "Arquitectura cloud para Core", requestId: "REQ-2025-047" },
  ],
}

const DATA_KEY = "staffing-workspace-v2"
const SESSION_KEY = "staffing-workspace-session"
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null
const validDate = (value: unknown, fallback = now()) => typeof value === "string" && !Number.isNaN(new Date(value).getTime()) ? value : fallback
const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []

function normalizeData(value: unknown): Data {
  if (!isRecord(value)) return seed
  const requests = Array.isArray(value.requests) ? value.requests.filter(isRecord).map((r, index): Request => ({
    id: typeof r.id === "string" ? r.id : `REQ-REC-${index + 1}`,
    title: typeof r.title === "string" ? r.title : typeof r.profile === "string" ? r.profile : "Solicitud recuperada",
    project: typeof r.project === "string" ? r.project : "Proyecto sin especificar",
    client: typeof r.client === "string" ? r.client : "Cliente sin especificar",
    profile: typeof r.profile === "string" ? r.profile : "Perfil sin especificar",
    seniority: typeof r.seniority === "string" ? r.seniority : "Sin especificar",
    required: stringArray(r.required ?? r.skills),
    desired: stringArray(r.desired),
    vacancies: typeof r.vacancies === "number" && r.vacancies > 0 ? Math.floor(r.vacancies) : 1,
    covered: typeof r.covered === "number" && r.covered >= 0 ? Math.floor(r.covered) : 0,
    start: validDate(r.start ?? r.date, future(14)),
    owner: typeof r.owner === "string" ? r.owner : "Staffing Demo",
    description: typeof r.description === "string" ? r.description : "",
    status: ["Abierta", "Cubierta", "Cerrada", "Cancelada"].includes(String(r.status)) ? r.status as RequestStatus : "Abierta",
    created: validDate(r.created),
  })) : seed.requests
  const people = Array.isArray(value.people) ? value.people.filter(isRecord).map((p, index): Person => ({
    id: typeof p.id === "string" ? p.id : `P-REC-${index + 1}`,
    name: typeof p.name === "string" ? p.name : "Persona recuperada",
    specialty: typeof p.specialty === "string" ? p.specialty : "Sin especialidad",
    seniority: typeof p.seniority === "string" ? p.seniority : "Sin especificar",
    skills: stringArray(p.skills),
    status: ["En liberación", "Disponible", "Reservado", "En entrevista", "Preasignado", "Asignado"].includes(String(p.status)) ? p.status as PersonStatus : "Disponible",
    available: validDate(p.available, future(1)),
    project: typeof p.project === "string" ? p.project : undefined,
    experience: typeof p.experience === "string" ? p.experience : "Sin información de experiencia.",
    notes: typeof p.notes === "string" ? p.notes : "",
  })) : seed.people
  const records = (key: keyof Data) => Array.isArray(value[key]) ? value[key]!.filter(isRecord) : []
  return {
    requests,
    people,
    reservations: records("reservations").filter((r) => typeof r.personId === "string" && typeof r.requestId === "string").map((r, index): Reservation => ({
      id: typeof r.id === "string" ? r.id : `R-REC-${index + 1}`, personId: String(r.personId), requestId: String(r.requestId),
      expires: validDate(r.expires, future(1)), notes: typeof r.notes === "string" ? r.notes : "", created: validDate(r.created),
      status: ["Activa", "Cancelada", "Expirada", "Asignada"].includes(String(r.status)) ? r.status as Reservation["status"] : "Cancelada",
      reason: typeof r.reason === "string" ? r.reason : undefined,
    })),
    interviews: records("interviews").filter((i) => typeof i.personId === "string" && typeof i.requestId === "string").map((i, index): Interview => ({
      id: typeof i.id === "string" ? i.id : `I-REC-${index + 1}`, personId: String(i.personId), requestId: String(i.requestId),
      date: validDate(i.date, future(1)), interviewer: typeof i.interviewer === "string" ? i.interviewer : "Sin especificar",
      notes: typeof i.notes === "string" ? i.notes : "", result: ["Pendiente", "Continúa", "No continúa"].includes(String(i.result)) ? i.result as Interview["result"] : "Pendiente",
      comment: typeof i.comment === "string" ? i.comment : undefined, next: typeof i.next === "string" ? i.next : undefined,
    })),
    releases: records("releases").filter((r) => typeof r.personId === "string").map((r, index): Release => ({
      id: typeof r.id === "string" ? r.id : `L-REC-${index + 1}`, personId: String(r.personId),
      project: typeof r.project === "string" ? r.project : "Proyecto sin especificar", date: validDate(r.date, future(1)),
      notes: typeof r.notes === "string" ? r.notes : "", status: r.status === "Confirmada" ? "Confirmada" : "Prevista",
    })),
    assignments: records("assignments").filter((a) => typeof a.personId === "string" && typeof a.requestId === "string").map((a, index): Assignment => ({
      id: typeof a.id === "string" ? a.id : `A-REC-${index + 1}`, personId: String(a.personId), requestId: String(a.requestId),
      project: typeof a.project === "string" ? a.project : "Proyecto sin especificar", start: validDate(a.start),
      end: typeof a.end === "string" && !Number.isNaN(new Date(a.end).getTime()) ? a.end : undefined,
    })),
    events: records("events").map((e, index): Event => ({
      id: typeof e.id === "string" ? e.id : `E-REC-${index + 1}`, date: validDate(e.date),
      action: typeof e.action === "string" ? e.action : "Evento recuperado", detail: typeof e.detail === "string" ? e.detail : "",
      personId: typeof e.personId === "string" ? e.personId : undefined, requestId: typeof e.requestId === "string" ? e.requestId : undefined,
      reason: typeof e.reason === "string" ? e.reason : undefined,
    })),
  }
}
function load(): Data {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) { localStorage.setItem(DATA_KEY, JSON.stringify(seed)); return seed }
    return normalizeData(JSON.parse(raw))
  } catch { return seed }
}
function loadSession() {
  try { return localStorage.getItem(SESSION_KEY) === "active" } catch { return false }
}
const labelDate = (value: string) => { const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value); return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date) }
const labelTime = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(date) }
const initials = (name: string) => name.split(" ").map((x) => x[0]).join("").slice(0, 2)
const split = (value: string) => value.split(",").map((x) => x.trim()).filter(Boolean)
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

function Icon({ name }: { name: "bell" | "briefcase" | "calendar" | "check" | "clock" | "plus" | "search" | "users" | "x" }) {
  const paths: Record<string, ReactNode> = {
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />, briefcase: <path d="M9 7V5h6v2m-12 4h18M5 7h14a2 2 0 0 1 2 2v9H3V9a2 2 0 0 1 2-2Z" />, calendar: <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />, check: <path d="m5 12 4 4L19 6" />, clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />, plus: <path d="M12 5v14M5 12h14" />, search: <path d="m20 20-4-4m2-6a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />, users: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4m3-10a4 4 0 1 1-8 0 4 4 0 0 1 8 0m13 12v-2a4 4 0 0 0-3-4m0-11a4 4 0 0 1 0 8" />, x: <path d="M18 6 6 18M6 6l12 12" />,
  }
  return <svg aria-hidden="true" className="icon" fill="none" height="18" viewBox="0 0 24 24" width="18"><g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name]}</g></svg>
}
function Button({ children, onClick, kind = "secondary", type = "button", disabled = false, title }: { children: ReactNode; onClick?: () => void; kind?: "primary" | "secondary" | "danger"; type?: "button" | "submit"; disabled?: boolean; title?: string }) {
  return <button className={`button ${kind}`} disabled={disabled} onClick={onClick} title={title} type={type}>{children}</button>
}
function Status({ status, children }: { status?: string; children: ReactNode }) {
  const styleSource = typeof status === "string" ? status : typeof children === "string" ? children : ""
  const styleKey = styleSource.trim().toLowerCase().replaceAll(" ", "-")
  return <span className={`status${styleKey ? ` status-${styleKey}` : ""}`}>{children}</span>
}
function Brand() { return <div className="brand"><span className="ntt-logo"><img src="/ntt-data-logo.svg" alt="NTT DATA" /></span><span className="product-name">Staffing Workspace<small>CONTROL DE TALENTO</small></span></div> }
function Empty({ text }: { text: string }) { return <div className="empty-tab"><span className="empty-icon"><Icon name="search" /></span><strong>Sin resultados</strong><span>{text}</span></div> }
function Search({ value, onChange, placeholder = "Buscar" }: { value: string; onChange: (v: string) => void; placeholder?: string }) { return <label className="search-box"><Icon name="search" /><input aria-label={placeholder} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} value={value} /></label> }

function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState("")
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); if (!f.get("email") || !f.get("password")) return setError("Completa correo y contraseña."); onLogin() }
  return <main className="login-page"><section className="login-card"><div className="login-rule" /><div className="login-content"><Brand /><div className="login-heading"><p className="eyebrow">Bienvenido de nuevo</p><h1>Conecta talento con oportunidades</h1><p>Accede al entorno de demostración de Staffing.</p></div><form className="login-form" onSubmit={submit}><label className="field"><span>Correo corporativo</span><span className="field-control"><input name="email" placeholder="demo@staffing.com" type="email" /></span></label><label className="field"><span>Contraseña</span><span className="field-control"><input name="password" placeholder="Introduce tu contraseña" type="password" /></span></label>{error && <p className="field-error">{error}</p>}<Button kind="primary" type="submit">Ingresar</Button></form><p className="login-support">Demo: cualquier correo y contraseña no vacíos.</p></div></section></main>
}

function AppContent() {
  const [logged, setLogged] = useState(loadSession)
  const [data, setData] = useState<Data>(load)
  const [view, setView] = useState<View>("Mi espacio")
  const [selectedRequest, setSelectedRequest] = useState(data.requests[0]?.id)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [tab, setTab] = useState("Solicitudes")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [projectFilter, setProjectFilter] = useState("")
  const [seniorityFilter, setSeniorityFilter] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("")
  const [modal, setModal] = useState<Modal>(null)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [readNotices, setReadNotices] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => { try { localStorage.setItem(DATA_KEY, JSON.stringify(data)) } catch { /* La app sigue operativa si el almacenamiento no está disponible. */ } }, [data])
  useEffect(() => {
    const expire = () => setData((d) => {
    const expired = d.reservations.filter((r) => r.status === "Activa" && new Date(r.expires) <= new Date())
    if (!expired.length) return d
      const reservations = d.reservations.map((r) => expired.some((x) => x.id === r.id) ? { ...r, status: "Expirada" as const, reason: "Vencimiento automático" } : r)
      const people = d.people.map((p) => expired.some((x) => x.personId === p.id) && !reservations.some((r) => r.personId === p.id && r.status === "Activa") ? { ...p, status: "Disponible" as const } : p)
      const events = [...expired.map((r) => ({ id: uid("E"), date: now(), action: "Reserva expirada", detail: "Vencimiento automático", personId: r.personId, requestId: r.requestId, reason: "Vencimiento automático" })), ...d.events]
      return { ...d, reservations, people, events }
    })
    expire()
    const timer = window.setInterval(expire, 30_000)
    return () => window.clearInterval(timer)
  }, [])
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3500) }
  const event = (action: string, detail: string, personId?: string, requestId?: string, reason?: string): Event => ({ id: uid("E"), date: now(), action, detail, personId, requestId, reason })
  const patch = (fn: (d: Data) => Data, message?: string) => { setData(fn); if (message) flash(message) }
  const request = data.requests.find((r) => r.id === selectedRequest)
  const person = data.people.find((p) => p.id === selectedPerson)
  const activeReservations = data.reservations.filter((r) => r.status === "Activa")
  const notifications = [
    ...activeReservations.map((r) => ({ text: `Reserva de ${data.people.find((p) => p.id === r.personId)?.name} vence ${labelTime(r.expires)}` })),
    ...data.interviews.filter((i) => i.result === "Pendiente").map((i) => ({ text: `Entrevista pendiente: ${data.people.find((p) => p.id === i.personId)?.name} · ${labelTime(i.date)}` })),
    ...data.releases.filter((r) => r.status === "Prevista").map((r) => ({ text: `Liberación prevista: ${data.people.find((p) => p.id === r.personId)?.name} · ${labelDate(r.date)}` })),
  ]
  if (!logged) return <Login onLogin={() => { try { localStorage.setItem(SESSION_KEY, "active") } catch { /* sesión en memoria */ }; setView("Mi espacio"); setLogged(true) }} />

  const openPerson = (id: string) => { setSelectedPerson(id); setView("Talento"); setSearch("") }
  const openRequest = (id: string) => { setSelectedRequest(id); setView("Solicitudes"); setSearch("") }
  const cancelReservation = (r: Reservation) => {
    const reason = prompt("Motivo de cancelación")
    if (!reason) return
    patch((d) => {
      const reservations = d.reservations.map((x) => x.id === r.id ? { ...x, status: "Cancelada" as const, reason } : x)
      const still = reservations.some((x) => x.personId === r.personId && x.status === "Activa")
      return { ...d, reservations, people: d.people.map((p) => p.id === r.personId && !still ? { ...p, status: "Disponible" } : p), events: [event("Reserva cancelada", reason, r.personId, r.requestId, reason), ...d.events] }
    }, "Reserva cancelada y cola actualizada.")
  }
  return <div className="app-shell">
    <header className="topbar"><div className="topbar-inner"><Brand /><nav className="navigation" aria-label="Navegación principal">{(["Mi espacio", "Talento", "Pool", "Solicitudes", "Seguimiento", "Historial"] as View[]).map((x) => <button className={`nav-item ${view === x ? "active" : ""}`} key={x} onClick={() => { setView(x); setSearch(""); setSelectedPerson(null) }}>{x}</button>)}</nav><div className="user-actions"><div className="popover-wrap"><button aria-label="Notificaciones" className="icon-button notification" onClick={() => { setNoticeOpen(!noticeOpen); setUserOpen(false) }}><Icon name="bell" />{!readNotices && notifications.length > 0 && <span />}</button>{noticeOpen && <div className="popover notifications"><div className="popover-title"><strong>Notificaciones</strong><button className="text-button" onClick={() => setReadNotices(true)}>Marcar leídas</button></div>{notifications.length ? notifications.map((n, i) => <p key={i}>{n.text}</p>) : <p>Sin notificaciones pendientes.</p>}</div>}</div><div className="popover-wrap"><button className="user-menu" onClick={() => { setUserOpen(!userOpen); setNoticeOpen(false) }}><span className="user-avatar">CM</span><span className="user-copy"><strong>Clara Méndez</strong><small>Gestora de staffing</small></span></button>{userOpen && <div className="popover user-pop"><strong>demo@staffing.com</strong><span>Cuenta demo · Staffing</span><Button onClick={() => { try { localStorage.removeItem(SESSION_KEY) } catch { /* sesión en memoria */ }; setLogged(false); setUserOpen(false) }}>Cerrar sesión</Button></div>}</div></div></div></header>
    {toast && <div className="toast" role="status">{toast}</div>}
    <main className="workspace">
      <div className="page-header"><div><p className="date-label">NTT DATA · Staffing · entorno demo</p><h1>{view === "Mi espacio" ? "Tu mesa de trabajo" : view}</h1><p>{view === "Mi espacio" ? "Revisa y gestiona las necesidades de talento activas." : "Datos compartidos y actualizados en todo el espacio."}</p></div><div className="header-actions"><Search onChange={setSearch} placeholder={`Buscar en ${view.toLowerCase()}`} value={search} />{view !== "Historial" && <Button kind="primary" onClick={() => setModal({ type: "request" })}><Icon name="plus" />Nueva solicitud</Button>}</div></div>
      {view === "Mi espacio" && <Overview data={data} navigate={(next) => { setView(next); setSearch("") }} openPerson={openPerson} />}
      {view === "Pool" && <Pool data={data} search={search} openPerson={openPerson} />}
      {view === "Seguimiento" && <FollowUp data={data} search={search} openPerson={openPerson} openRequest={openRequest} />}
      {view === "Mi espacio" && <Dashboard data={data} request={request} search={search} selectedRequest={selectedRequest} setSelectedRequest={setSelectedRequest} tab={tab} setTab={setTab} openAll={() => { setView("Solicitudes"); setStatusFilter("Abierta") }} openPerson={openPerson} reserve={(personId: string) => setModal({ type: "reserve", personId, requestId: request?.id })} />}
      {view === "Solicitudes" && <Requests data={data} search={search} selected={request} select={setSelectedRequest} status={statusFilter} setStatus={setStatusFilter} project={projectFilter} setProject={setProjectFilter} openPerson={openPerson} edit={(r: Request) => setModal({ type: "request", request: r })} close={(r: Request) => setModal({ type: "close", requestId: r.id })} findTalent={(r: Request) => { setSelectedRequest(r.id); setSearch(r.required[0] || ""); setView("Talento") }} reserve={(personId: string, requestId: string) => setModal({ type: "reserve", personId, requestId })} />}
      {view === "Talento" && <Talent data={data} search={search} selected={person} select={setSelectedPerson} seniority={seniorityFilter} setSeniority={setSeniorityFilter} availability={availabilityFilter} setAvailability={setAvailabilityFilter} clear={() => { setSearch(""); setSeniorityFilter(""); setAvailabilityFilter("") }} reserve={(id: string) => setModal({ type: "reserve", personId: id, requestId: selectedRequest })} interview={(id: string) => setModal({ type: "interview", personId: id, requestId: selectedRequest })} result={(id: string) => setModal({ type: "result", interviewId: id })} assign={(id: string) => setModal({ type: "assign", personId: id, requestId: selectedRequest })} release={(id: string) => setModal({ type: "release", personId: id })} confirmRelease={(rel: Release) => patch((d) => ({ ...d, assignments: d.assignments.map((a) => a.personId === rel.personId && (!a.end || a.end > rel.date) ? { ...a, end: rel.date } : a), releases: d.releases.map((x) => x.id === rel.id ? { ...x, status: "Confirmada" } : x), people: d.people.map((p) => p.id === rel.personId ? { ...p, status: "Disponible", available: rel.date, project: undefined } : p), events: [event("Liberación confirmada", rel.project, rel.personId, undefined), ...d.events] }), "Liberación confirmada; la persona está disponible.")} cancelReservation={cancelReservation} />}
      {view === "Historial" && <History data={data} search={search} openPerson={openPerson} openRequest={openRequest} />}
    </main>
    {modal && <ModalView modal={modal} data={data} close={() => setModal(null)} patch={patch} event={event} flash={flash} openRequest={openRequest} />}
  </div>
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Staffing Workspace no pudo cargarse", error, info) }
  render() {
    if (this.state.failed) return <main className="login-page"><section className="login-card load-error"><div className="login-rule" /><div className="login-content"><Brand /><div className="login-heading"><p className="eyebrow">Error de carga</p><h1>No pudimos abrir Staffing Workspace</h1><p>Los datos guardados no se han eliminado. Reintenta la carga para recuperar tu espacio.</p></div><Button kind="primary" onClick={() => window.location.reload()}>Reintentar</Button></div></section></main>
    return this.props.children
  }
}

export default function App() {
  return <AppErrorBoundary><AppContent /></AppErrorBoundary>
}

function Dashboard({ data, request, search, selectedRequest, setSelectedRequest, tab, setTab, openAll, openPerson, reserve }: any) {
  const rows = tab === "Solicitudes" ? data.requests.filter((r: Request) => r.status === "Abierta" && `${r.title} ${r.project} ${r.profile}`.toLowerCase().includes(search.toLowerCase())) : tab === "Liberaciones" ? data.releases.filter((r: Release) => r.status === "Prevista") : data.reservations.filter((r: Reservation) => r.status === "Activa")
  return <section className="workbench"><aside className="inbox"><div className="panel-title"><div><h2>Pendientes</h2><span>{rows.length} elementos por revisar</span></div><span className="count">{rows.length}</span></div><div className="tabs">{["Solicitudes", "Liberaciones", "Reservas"].map((x) => <button className={`tab ${tab === x ? "active" : ""}`} key={x} onClick={() => setTab(x)}>{x}</button>)}</div><div className="request-list">{rows.map((row: any) => tab === "Solicitudes" ? <button className={`request-row ${row.id === selectedRequest ? "selected" : ""}`} key={row.id} onClick={() => setSelectedRequest(row.id)}><span className="request-main"><strong>{row.project}</strong><span>{row.profile}</span></span><span className="request-meta"><span>{labelDate(row.start)}</span><Status>{row.status}</Status></span></button> : tab === "Liberaciones" ? <button className="request-row" key={row.id} onClick={() => openPerson(row.personId)}><span className="request-main"><strong>{data.people.find((p: Person) => p.id === row.personId)?.name}</strong><span>{row.project}</span></span><span className="request-meta"><span>{labelDate(row.date)}</span><Status>{row.status}</Status></span></button> : <button className="request-row" key={row.id} onClick={() => openPerson(row.personId)}><span className="request-main"><strong>{data.people.find((p: Person) => p.id === row.personId)?.name}</strong><span>{data.requests.find((r: Request) => r.id === row.requestId)?.title}</span></span><span className="request-meta"><span>Vence {labelTime(row.expires)}</span><Status>Activa</Status></span></button>)}{!rows.length && <Empty text="No hay elementos en esta bandeja." />}</div>{tab === "Solicitudes" && <div className="inbox-footer"><button className="text-button" onClick={openAll}>Ver todas las solicitudes →</button></div>}</aside>{request ? <RequestDetail data={data} request={request} openPerson={openPerson} reserve={reserve} /> : <Empty text="Selecciona una solicitud." />}</section>
}

function RequestDetail({ data, request, openPerson, reserve }: { data: Data; request: Request; openPerson: (id: string) => void; reserve: (id: string) => void }) {
  const candidates = data.people.map((p) => ({ p, match: request.required.filter((s) => p.skills.includes(s)).length })).sort((a, b) => b.match - a.match).slice(0, 3)
  return <article className="detail"><div className="detail-header"><div><div className="detail-kicker"><Status status={request.status}>{request.status}</Status><span>{request.id}</span></div><h2>{request.profile}</h2><p>{request.project} · {request.client}</p></div></div><div className="request-facts"><div className="fact"><span className="fact-icon"><Icon name="briefcase" /></span><span><small>Proyecto</small><strong>{request.project}</strong></span></div><div className="fact skills-fact"><span className="fact-icon"><Icon name="check" /></span><span><small>Requeridas</small><span className="inline-skills">{request.required.map((s) => <span className="skill" key={s}>{s}</span>)}</span></span></div><div className="fact"><span className="fact-icon"><Icon name="calendar" /></span><span><small>Vacantes</small><strong>{request.covered} de {request.vacancies} cubiertas</strong></span></div><div className="fact"><span className="fact-icon owner-initials">{initials(request.owner)}</span><span><small>Responsable</small><strong>{request.owner}</strong></span></div></div><section className="suggestions"><div className="section-heading"><div><h3>Perfiles sugeridos</h3><p>Coincidencia explícita de habilidades</p></div></div><div className="candidate-list">{candidates.map(({ p, match }) => <div className="candidate-row" key={p.id}><div className="avatar avatar-blue">{initials(p.name)}</div><button className="person-link" onClick={() => openPerson(p.id)}><strong>{p.name}</strong><span>{p.specialty}</span></button><div className="candidate-skills"><Status status="neutral">{match} de {request.required.length} requeridas</Status></div><div className="availability">{p.status}</div><Button disabled={p.status === "Asignado"} onClick={() => reserve(p.id)} title={p.status === "Asignado" ? `No disponible: asignado a ${p.project}` : ""}>Reservar</Button></div>)}</div></section><section className="activity-section"><div className="section-heading"><h3>Actividad reciente</h3></div><div className="timeline">{data.events.filter((e) => e.requestId === request.id).slice(0, 5).map((e) => <div className="timeline-item" key={e.id}><span>{e.action}: {e.detail}</span><time>{labelTime(e.date)}</time></div>)}</div></section></article>
}

function FilterBar({ children }: { children: ReactNode }) { return <div className="filter-bar">{children}</div> }
function Requests({ data, search, selected, select, status, setStatus, project, setProject, openPerson, edit, close, findTalent, reserve }: any) {
  const list = data.requests.filter((r: Request) => `${r.title} ${r.project} ${r.profile}`.toLowerCase().includes(search.toLowerCase()) && (!status || r.status === status) && (!project || r.project === project)).sort((a: Request, b: Request) => b.created.localeCompare(a.created))
  return <><FilterBar><select aria-label="Estado" onChange={(e) => setStatus(e.target.value)} value={status}><option value="">Todos los estados</option>{["Abierta", "Cubierta", "Cerrada", "Cancelada"].map((x) => <option key={x}>{x}</option>)}</select><select aria-label="Proyecto" onChange={(e) => setProject(e.target.value)} value={project}><option value="">Todos los proyectos</option>{[...new Set(data.requests.map((r: Request) => r.project))].map((x: any) => <option key={x}>{x}</option>)}</select><button className="text-button" onClick={() => { setStatus(""); setProject("") }}>Limpiar filtros</button></FilterBar><section className="split-view"><aside className="entity-list">{list.map((r: Request) => <button className={`entity-row ${selected?.id === r.id ? "selected" : ""}`} key={r.id} onClick={() => select(r.id)}><span><strong>{r.title}</strong><small>{r.project} · {r.profile}</small></span><Status>{r.status}</Status></button>)}{!list.length && <Empty text="Ajusta la búsqueda o limpia los filtros." />}</aside><article className="record-panel">{selected ? <><div className="record-head"><div><span className="eyebrow">{selected.id}</span><h2>{selected.title}</h2><p>{selected.client} · {selected.project}</p></div><Status>{selected.status}</Status></div><div className="action-row"><Button onClick={() => edit(selected)}>Editar</Button><Button onClick={() => findTalent(selected)}>Buscar candidatos</Button><Button disabled={selected.status !== "Abierta"} kind="danger" onClick={() => close(selected)}>Cerrar / cancelar</Button></div><div className="detail-grid"><div><small>Perfil</small><strong>{selected.profile} · {selected.seniority}</strong></div><div><small>Incorporación</small><strong>{labelDate(selected.start)}</strong></div><div><small>Responsable</small><strong>{selected.owner}</strong></div><div><small>Vacantes cubiertas</small><strong>{selected.covered} de {selected.vacancies}</strong></div></div><h3>Requisitos</h3><div className="inline-skills">{selected.required.map((s: string) => <span className="skill" key={s}>{s}</span>)}</div><p className="description">{selected.description}</p><h3>Candidatos y actividad</h3>{data.reservations.filter((x: Reservation) => x.requestId === selected.id).map((x: Reservation) => <button className="linked-record" key={x.id} onClick={() => openPerson(x.personId)}>{data.people.find((p: Person) => p.id === x.personId)?.name}<Status>{x.status}</Status></button>)}{!data.reservations.some((x: Reservation) => x.requestId === selected.id) && <p className="muted">Aún no hay candidatos vinculados.</p>}<div className="timeline">{data.events.filter((e: Event) => e.requestId === selected.id).slice(0, 8).map((e: Event) => <div className="timeline-item" key={e.id}><span>{e.action}: {e.detail}</span><time>{labelTime(e.date)}</time></div>)}</div></> : <Empty text="Selecciona una solicitud." />}</article></section></>
}

function Talent({ data, search, selected, select, seniority, setSeniority, availability, setAvailability, clear, reserve, interview, result, assign, release, confirmRelease, cancelReservation }: any) {
  const list = data.people.filter((p: Person) => `${p.name} ${p.specialty} ${p.skills.join(" ")}`.toLowerCase().includes(search.toLowerCase()) && (!seniority || p.seniority === seniority) && (!availability || p.status === availability))
  return <><FilterBar><select aria-label="Seniority" onChange={(e) => setSeniority(e.target.value)} value={seniority}><option value="">Todo seniority</option>{["Semi Senior", "Senior", "Lead"].map((x) => <option key={x}>{x}</option>)}</select><select aria-label="Disponibilidad" onChange={(e) => setAvailability(e.target.value)} value={availability}><option value="">Toda disponibilidad</option>{["En liberación", "Disponible", "Reservado", "En entrevista", "Preasignado", "Asignado"].map((x) => <option key={x}>{x}</option>)}</select><button className="text-button" onClick={clear}>Limpiar filtros</button></FilterBar><section className="split-view"><aside className="entity-list">{list.map((p: Person) => <button className={`entity-row ${selected?.id === p.id ? "selected" : ""}`} key={p.id} onClick={() => select(p.id)}><span><strong>{p.name}</strong><small>{p.specialty} · {p.skills.join(", ")}</small></span><Status>{p.status}</Status></button>)}{!list.length && <Empty text="No hay talento que coincida con estos filtros." />}</aside><article className="record-panel">{selected ? <><div className="profile-head"><div className="avatar avatar-blue large">{initials(selected.name)}</div><div><h2>{selected.name}</h2><p>{selected.specialty} · {selected.seniority}</p></div><Status>{selected.status}</Status></div><div className="action-row"><Button disabled={selected.status === "Asignado"} onClick={() => reserve(selected.id)} title={selected.status === "Asignado" ? `Asignado a ${selected.project}` : ""}>Reservar</Button><Button disabled={!["Reservado", "Disponible"].includes(selected.status)} onClick={() => interview(selected.id)}>Programar entrevista</Button><Button disabled={!["Reservado", "En entrevista", "Preasignado", "Disponible"].includes(selected.status)} onClick={() => assign(selected.id)}>Preasignar / asignar</Button><Button disabled={selected.status !== "Asignado"} onClick={() => release(selected.id)}>Programar liberación</Button></div><div className="detail-grid"><div><small>Experiencia</small><strong>{selected.experience}</strong></div><div><small>Disponibilidad</small><strong>{labelDate(selected.available)}</strong></div><div><small>Proyecto actual</small><strong>{selected.project || "Sin proyecto"}</strong></div><div><small>Observaciones</small><strong>{selected.notes}</strong></div></div><h3>Habilidades</h3><div className="inline-skills">{selected.skills.map((s: string) => <span className="skill" key={s}>{s}</span>)}</div><h3>Reservas e entrevistas</h3>{data.reservations.filter((r: Reservation) => r.personId === selected.id).map((r: Reservation, index: number, all: Reservation[]) => { const active = all.filter((x) => x.status === "Activa").sort((a, b) => a.created.localeCompare(b.created)); const pos = active.findIndex((x) => x.id === r.id); return <div className="linked-record" key={r.id}><span>{data.requests.find((x: Request) => x.id === r.requestId)?.title || r.requestId}<small>{r.status === "Activa" ? (pos === 0 ? "Prioritaria" : `En espera · posición ${pos + 1}`) : r.status} · vence {labelTime(r.expires)}</small></span>{r.status === "Activa" && <Button onClick={() => cancelReservation(r)}>Cancelar</Button>}</div>})}{data.interviews.filter((i: Interview) => i.personId === selected.id).map((i: Interview) => <div className="linked-record" key={i.id}><span>Entrevista con {i.interviewer}<small>{labelTime(i.date)} · {i.result}</small></span><Button disabled={i.result !== "Pendiente"} onClick={() => result(i.id)}>Registrar resultado</Button></div>)}<h3>Liberaciones</h3>{data.releases.filter((r: Release) => r.personId === selected.id).map((r: Release) => <div className="linked-record" key={r.id}><span>{r.project}<small>{labelDate(r.date)} · {r.status}</small></span>{r.status === "Prevista" && <Button onClick={() => confirmRelease(r)}>Confirmar liberación</Button>}</div>)}<h3>Historial</h3><div className="timeline">{data.events.filter((e: Event) => e.personId === selected.id).slice(0, 8).map((e: Event) => <div className="timeline-item" key={e.id}><span>{e.action}: {e.detail}</span><time>{labelTime(e.date)}</time></div>)}</div></> : <Empty text="Selecciona una persona para ver su perfil." />}</article></section></>
}

function History({ data, search, openPerson, openRequest }: { data: Data; search: string; openPerson: (id: string) => void; openRequest: (id: string) => void }) {
  const [action, setAction] = useState(""); const [date, setDate] = useState("")
  const rows = data.events.filter((e) => `${e.action} ${e.detail} ${e.reason || ""}`.toLowerCase().includes(search.toLowerCase()) && (!action || e.action === action) && (!date || localDate(new Date(e.date)) === date))
  return <><FilterBar><select aria-label="Acción" onChange={(e) => setAction(e.target.value)} value={action}><option value="">Todas las acciones</option>{[...new Set(data.events.map((e) => e.action))].map((x) => <option key={x}>{x}</option>)}</select><input aria-label="Fecha" onChange={(e) => setDate(e.target.value)} type="date" value={date} /><button className="text-button" onClick={() => { setAction(""); setDate("") }}>Limpiar filtros</button></FilterBar><section className="history-table"><div className="history-head"><span>Fecha y hora</span><span>Acción</span><span>Detalle / motivo</span><span>Registros vinculados</span><span>Usuario</span></div>{rows.map((e) => <div className="history-row" key={e.id}><time>{labelTime(e.date)}</time><strong>{e.action}</strong><span>{e.detail}{e.reason && ` · ${e.reason}`}</span><span>{e.personId && <button className="text-button" onClick={() => openPerson(e.personId!)}>Persona</button>}{e.requestId && <button className="text-button" onClick={() => openRequest(e.requestId!)}>Solicitud</button>}</span><span>Clara Méndez</span></div>)}{!rows.length && <Empty text="No hay eventos con estos filtros." />}</section></>
}

function ModalView({ modal, data, close, patch, event, flash, openRequest }: { modal: Exclude<Modal, null>; data: Data; close: () => void; patch: (fn: (d: Data) => Data, message?: string) => void; event: any; flash: (s: string) => void; openRequest: (id: string) => void }) {
  const [error, setError] = useState("")
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); const f = new FormData(e.currentTarget)
    if (modal.type === "request") {
      const vacancies = Number(f.get("vacancies")); if (!Number.isInteger(vacancies) || vacancies < 1) return setError("Vacantes debe ser un entero positivo.")
      const required = split(String(f.get("required"))); if (!required.length) return setError("Añade al menos una habilidad obligatoria.")
      const base = { title: String(f.get("title")), project: String(f.get("project")), client: String(f.get("client")), profile: String(f.get("profile")), seniority: String(f.get("seniority")), required, desired: split(String(f.get("desired"))), vacancies, start: String(f.get("start")), owner: String(f.get("owner")), description: String(f.get("description")) }
      if (modal.request && vacancies < modal.request.covered) return setError("Las vacantes no pueden ser menores que las ya cubiertas.")
      if (modal.request) patch((d) => ({ ...d, requests: d.requests.map((r) => r.id === modal.request!.id ? { ...r, ...base } : r), events: [event("Solicitud editada", `Antes: ${modal.request!.title} / ${modal.request!.vacancies}; ahora: ${base.title} / ${base.vacancies}`, undefined, modal.request!.id), ...d.events] }), "Solicitud actualizada.")
      else { const id = `REQ-${new Date().getFullYear()}-${String(data.requests.length + 50).padStart(3, "0")}`; patch((d) => ({ ...d, requests: [{ ...base, id, covered: 0, status: "Abierta", created: now() }, ...d.requests], events: [event("Solicitud creada", base.title, undefined, id), ...d.events] }), "Solicitud creada."); openRequest(id) }
    }
    if (modal.type === "reserve") {
      const requestId = String(f.get("requestId")); const expires = String(f.get("expires")); const person = data.people.find((p) => p.id === modal.personId)
      if (!data.requests.some((r) => r.id === requestId && r.status === "Abierta" && r.covered < r.vacancies)) return setError("Selecciona una solicitud con vacantes abiertas.")
      if (Number.isNaN(new Date(expires).getTime()) || new Date(expires) <= new Date()) return setError("El vencimiento debe ser futuro.")
      if (person?.status === "Asignado") return setError(`Acción bloqueada: ${person.name} ya está asignado a ${person.project}.`)
      if (data.reservations.some((r) => r.personId === modal.personId && r.requestId === requestId && r.status === "Activa")) return setError("Ya existe una reserva activa para esta persona y solicitud.")
      patch((d) => ({ ...d, reservations: [...d.reservations, { id: uid("R"), personId: modal.personId, requestId, expires: new Date(expires).toISOString(), notes: String(f.get("notes")), created: now(), status: "Activa" }], people: d.people.map((p) => p.id === modal.personId ? { ...p, status: "Reservado" } : p), events: [event("Reserva creada", "Reserva activa", modal.personId, requestId), ...d.events] }), "Reserva creada; no implica asignación.")
    }
    if (modal.type === "interview") {
      const requestId = String(f.get("requestId"));
      if (!data.requests.some((r) => r.id === requestId && r.status === "Abierta")) return setError("Selecciona una solicitud abierta.")
      if (Number.isNaN(new Date(String(f.get("date"))).getTime()) || new Date(String(f.get("date"))) <= new Date()) return setError("La entrevista debe tener una fecha futura.")
      patch((d) => ({ ...d, interviews: [...d.interviews, { id: uid("I"), personId: modal.personId, requestId, date: new Date(String(f.get("date"))).toISOString(), interviewer: String(f.get("interviewer")), notes: String(f.get("notes")), result: "Pendiente" }], people: d.people.map((p) => p.id === modal.personId ? { ...p, status: "En entrevista" } : p), events: [event("Entrevista programada", String(f.get("interviewer")), modal.personId, requestId), ...d.events] }), "Entrevista programada.")
    }
    if (modal.type === "result") {
      const interview = data.interviews.find((i) => i.id === modal.interviewId)!; const result = String(f.get("result")) as Interview["result"]; patch((d) => ({ ...d, interviews: d.interviews.map((i) => i.id === interview.id ? { ...i, result, comment: String(f.get("comment")), next: String(f.get("next")) } : i), people: d.people.map((p) => p.id === interview.personId ? { ...p, status: result === "Continúa" ? "Preasignado" : result === "No continúa" ? "Disponible" : p.status } : p), events: [event("Resultado de entrevista", `${result}: ${String(f.get("comment"))}`, interview.personId, interview.requestId), ...d.events] }), "Resultado registrado.")
    }
    if (modal.type === "release") {
      patch((d) => ({ ...d, releases: [...d.releases, { id: uid("L"), personId: modal.personId, project: String(f.get("project")), date: String(f.get("date")), notes: String(f.get("notes")), status: "Prevista" }], people: d.people.map((p) => p.id === modal.personId ? { ...p, status: "En liberación" } : p), events: [event("Liberación programada", `${String(f.get("project"))} · ${String(f.get("date"))}`, modal.personId), ...d.events] }), "Liberación programada; no se confirmará automáticamente.")
    }
    if (modal.type === "close") {
      const status = String(f.get("status")) as "Cerrada" | "Cancelada"; const reason = String(f.get("reason")); patch((d) => ({ ...d, requests: d.requests.map((r) => r.id === modal.requestId ? { ...r, status } : r), events: [event(`Solicitud ${status.toLowerCase()}`, reason, undefined, modal.requestId, reason), ...d.events] }), `Solicitud ${status.toLowerCase()}.`)
    }
    if (modal.type === "assign") {
      const requestId = String(f.get("requestId")); const req = data.requests.find((r) => r.id === requestId); const person = data.people.find((p) => p.id === modal.personId)!; const start = String(f.get("start")); const end = String(f.get("end")); const pre = f.get("mode") === "pre"
      if (end && end < start) return setError("El término no puede ser anterior al inicio.")
      if (!req || req.status !== "Abierta" || req.covered >= req.vacancies) return setError("Acción bloqueada: la solicitud no tiene vacantes abiertas.")
      const priority = activeQueue(data, modal.personId)[0]; if (priority && priority.requestId !== requestId) return setError(`Prioridad bloqueante: la reserva prioritaria pertenece a ${data.requests.find((r) => r.id === priority.requestId)?.title}. Cancélala con motivo antes de continuar.`)
      const conflict = data.assignments.find((a) => a.personId === modal.personId && (!a.end || a.end >= start) && (!end || a.start <= end)); if (conflict) return setError(`Conflicto con ${conflict.project} (${labelDate(conflict.start)}${conflict.end ? `–${labelDate(conflict.end)}` : "–sin término"}).`)
      if (pre) patch((d) => ({ ...d, people: d.people.map((p) => p.id === person.id ? { ...p, status: "Preasignado" } : p), events: [event("Preasignación", req.title, person.id, req.id), ...d.events] }), "Persona preasignada.")
      else patch((d) => { const reservations = d.reservations.map((r) => r.personId === person.id && r.status === "Activa" ? { ...r, status: r.requestId === req.id ? "Asignada" as const : "Cancelada" as const, reason: r.requestId === req.id ? undefined : `Cierre por asignación incompatible a ${req.project}` } : r); const covered = req.covered + 1; return { ...d, assignments: [...d.assignments, { id: uid("A"), personId: person.id, requestId: req.id, project: req.project, start, end: end || undefined }], reservations, people: d.people.map((p) => p.id === person.id ? { ...p, status: "Asignado", project: req.project, available: end || p.available } : p), requests: d.requests.map((r) => r.id === req.id ? { ...r, covered, status: covered >= r.vacancies ? "Cubierta" : r.status } : r), events: [event("Asignación confirmada", `${req.project} desde ${start}${end ? ` hasta ${end}` : ""}`, person.id, req.id), ...d.events] } }, "Asignación confirmada y reservas competidoras cerradas.")
    }
    close()
  }
  const title = modal.type === "request" ? (modal.request ? "Editar solicitud" : "Nueva solicitud") : modal.type === "reserve" ? "Nueva reserva" : modal.type === "interview" ? "Programar entrevista" : modal.type === "result" ? "Registrar resultado" : modal.type === "assign" ? "Preasignar o asignar" : modal.type === "release" ? "Programar liberación" : "Cerrar solicitud"
  return <div className="modal-backdrop" onMouseDown={close}><section aria-modal="true" className="modal modal-wide" onMouseDown={(e) => e.stopPropagation()} role="dialog"><div className="modal-header"><div><p className="eyebrow">Staffing</p><h2>{title}</h2></div><button aria-label="Cerrar" className="icon-button" onClick={close}><Icon name="x" /></button></div><form className="form-grid" onSubmit={submit}><ModalFields modal={modal} data={data} />{error && <p className="field-error form-full">{error}</p>}<div className="modal-actions form-full"><Button onClick={close}>Cancelar</Button><Button kind="primary" type="submit">Guardar</Button></div></form></section></div>
}
function activeQueue(data: Data, personId: string) { return data.reservations.filter((r) => r.personId === personId && r.status === "Activa").sort((a, b) => a.created.localeCompare(b.created)) }
function F({ label, name, type = "text", value, required = true, children }: { label: string; name: string; type?: string; value?: string | number; required?: boolean; children?: ReactNode }) { return <label className="field"><span>{label}</span>{children || <input defaultValue={value} name={name} required={required} type={type} />}</label> }
function ModalFields({ modal, data }: { modal: Exclude<Modal, null>; data: Data }) {
  if (modal.type === "request") { const r = modal.request; return <><F label="Título" name="title" value={r?.title} /><F label="Proyecto" name="project" value={r?.project} /><F label="Cliente" name="client" value={r?.client} /><F label="Perfil" name="profile" value={r?.profile} /><F label="Seniority" name="seniority" value={r?.seniority} /><F label="Habilidades obligatorias (separadas por comas)" name="required" value={r?.required.join(", ")} /><F label="Habilidades deseables" name="desired" required={false} value={r?.desired.join(", ")} /><F label="Vacantes" name="vacancies" type="number" value={r?.vacancies || 1} /><F label="Incorporación" name="start" type="date" value={r?.start || future(14)} /><F label="Responsable" name="owner" value={r?.owner} /><F label="Descripción" name="description" value={r?.description} /></> }
  if (modal.type === "reserve") return <><F label="Persona" name="person" value={data.people.find((p) => p.id === modal.personId)?.name} /><F label="Solicitud abierta" name="requestId"><select defaultValue={modal.requestId} name="requestId" required>{data.requests.filter((r) => r.status === "Abierta").map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></F><F label="Vencimiento" name="expires" type="datetime-local" value={`${future(3)}T18:00`} /><F label="Observaciones" name="notes" required={false} /></>
  if (modal.type === "interview") return <><F label="Solicitud" name="requestId"><select defaultValue={modal.requestId} name="requestId">{data.requests.filter((r) => r.status === "Abierta").map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></F><F label="Fecha y hora" name="date" type="datetime-local" value={`${future(2)}T10:00`} /><F label="Entrevistador" name="interviewer" value="Elena Martín" /><F label="Notas" name="notes" required={false} /></>
  if (modal.type === "result") return <><F label="Resultado" name="result"><select name="result"><option>Pendiente</option><option>Continúa</option><option>No continúa</option></select></F><F label="Comentario" name="comment" /><F label="Próximo paso" name="next" required={false} /></>
  if (modal.type === "release") { const p = data.people.find((x) => x.id === modal.personId); return <><F label="Proyecto" name="project" value={p?.project || ""} /><F label="Fecha prevista" name="date" type="date" value={future(14)} /><F label="Observaciones" name="notes" required={false} /></> }
  if (modal.type === "close") return <><F label="Acción" name="status"><select name="status"><option>Cerrada</option><option>Cancelada</option></select></F><F label="Motivo" name="reason" /></>
  return <><F label="Modo" name="mode"><select name="mode"><option value="pre">Preasignar</option><option value="assign">Confirmar asignación</option></select></F><F label="Solicitud" name="requestId"><select defaultValue={modal.requestId} name="requestId">{data.requests.filter((r) => r.status === "Abierta").map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</select></F><F label="Proyecto" name="project" value={data.requests.find((r) => r.id === modal.requestId)?.project} /><F label="Inicio" name="start" type="date" value={future(7)} /><F label="Término opcional" name="end" required={false} type="date" /></>
}

const stages: PersonStatus[] = ["En liberación", "Disponible", "Reservado", "En entrevista", "Preasignado", "Asignado"]
const liveReservations = (data: Data) => data.reservations.filter(r => r.status === "Activa" && new Date(r.expires).getTime() > Date.now())
function Overview({ data, navigate, openPerson }: { data: Data; navigate: (view: View) => void; openPerson: (id: string) => void }) {
  const reservations = liveReservations(data)
  const expiring = reservations.filter(r => new Date(r.expires).getTime() - Date.now() < 48 * 3600000)
  const conflicts = data.people.filter(p => reservations.filter(r => r.personId === p.id).length > 1)
  const stats: { title: string; value: number; detail: string; view: View }[] = [
    { title: "Personas en pool", value: data.people.length, detail: `${data.people.filter(p => p.status === "Disponible").length} disponibles`, view: "Pool" },
    { title: "Vacantes abiertas", value: data.requests.filter(r => r.status === "Abierta").reduce((n, r) => n + Math.max(0, r.vacancies - r.covered), 0), detail: "Demanda pendiente de cobertura", view: "Solicitudes" },
    { title: "Reservas activas", value: reservations.length, detail: `${expiring.length} vencen en las próximas 48 h`, view: "Seguimiento" },
    { title: "Liberaciones previstas", value: data.releases.filter(r => r.status === "Prevista").length, detail: `${conflicts.length} personas con reservas en competencia`, view: "Seguimiento" },
  ]
  return <><section className="metrics" aria-label="Resumen operativo">{stats.map(s => <button key={s.title} className="metric" onClick={() => navigate(s.view)}><span>{s.title}</span><strong>{s.value}</strong><small>{s.detail}</small><span className="metric-arrow">↗</span></button>)}</section><section className="overview-panels"><div className="overview-card"><div className="overview-heading"><h2>Pipeline de staffing</h2><span>Estado actual · {data.people.length} personas</span></div><div className="stage-grid">{stages.map(stage => { const count = data.people.filter(p => p.status === stage).length; return <div key={stage}><span>{stage}</span><strong>{count}</strong><progress value={count} max={Math.max(1, data.people.length)} aria-label={stage} /></div> })}</div></div><div className="overview-card"><div className="overview-heading"><h2>Requieren atención</h2><button className="text-button" onClick={() => navigate("Seguimiento")}>Ver seguimiento →</button></div>{expiring.length === 0 && conflicts.length === 0 ? <p className="muted">Sin reservas por vencer en 48 h ni conflictos de prioridad.</p> : <div className="attention-list">{conflicts.slice(0, 2).map(p => <button key={p.id} onClick={() => openPerson(p.id)}><span className="alert-dot" /><span><strong>{p.name}</strong><small>Revisar reservas en competencia</small></span><span>→</span></button>)}{expiring.slice(0, 2).map(r => <button key={r.id} onClick={() => openPerson(r.personId)}><span className="alert-dot" /><span><strong>{data.people.find(p => p.id === r.personId)?.name}</strong><small>Reserva vence {labelTime(r.expires)}</small></span><span>→</span></button>)}</div>}</div></section></>
}
function Pool({ data, search, openPerson }: { data: Data; search: string; openPerson: (id: string) => void }) {
  const [status, setStatus] = useState("")
  const [seniority, setSeniority] = useState("")
  const list = data.people.filter(p => `${p.name} ${p.id} ${p.specialty} ${p.skills.join(" ")} ${p.project || ""}`.toLowerCase().includes(search.toLowerCase()) && (!status || p.status === status) && (!seniority || p.seniority === seniority))
  const exportCsv = () => {
    const cell = (v: string) => '"' + (/^[\s]*[=+@-]/.test(v) ? "'" + v : v).replaceAll('"', '""') + '"'
    const rows = [["ID", "Profesional", "Perfil", "Seniority", "Habilidades", "Estado", "Disponibilidad", "Proyecto", "Experiencia"], ...list.map(p => [p.id, p.name, p.specialty, p.seniority, p.skills.join(", "), p.status, p.available, p.project || "", p.experience])]
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8;" }))
    const a = document.createElement("a"); a.href = url; a.download = `staffing-pool-${localDate(new Date())}.csv`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <><div className="pool-toolbar"><FilterBar><select aria-label="Estado del pool" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option>{stages.map(s => <option key={s}>{s}</option>)}</select><select aria-label="Seniority del pool" value={seniority} onChange={e => setSeniority(e.target.value)}><option value="">Todo seniority</option>{[...new Set(data.people.map(p => p.seniority))].map(s => <option key={s}>{s}</option>)}</select><button className="text-button" onClick={() => { setStatus(""); setSeniority("") }}>Limpiar filtros</button></FilterBar><span>{list.length} de {data.people.length} perfiles</span><Button onClick={exportCsv}>Exportar CSV</Button></div><div className="pool-table-wrap"><table className="pool-table"><thead><tr>{["Profesional", "Perfil / seniority", "Habilidades", "Estado", "Disponibilidad", "Proyecto actual", "Reservas activas"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{list.map(p => <tr key={p.id}><td><button className="pool-person" onClick={() => openPerson(p.id)}><span className="avatar avatar-blue">{initials(p.name)}</span><span><strong>{p.name}</strong><small>{p.id}</small></span></button></td><td>{p.specialty}<small>{p.seniority}</small></td><td>{p.skills.join(" · ")}</td><td><Status>{p.status}</Status></td><td>{labelDate(p.available)}</td><td>{p.project || "Sin proyecto"}</td><td>{liveReservations(data).filter(r => r.personId === p.id).length}</td></tr>)}</tbody></table>{!list.length && <Empty text="No hay perfiles con estos filtros." />}</div><p className="table-caption">Exporta los perfiles filtrados. Selecciona una persona para reservar, entrevistar o gestionar su asignación.</p></>
}
function FollowUp({ data, search, openPerson, openRequest }: { data: Data; search: string; openPerson: (id: string) => void; openRequest: (id: string) => void }) {
  const [kind, setKind] = useState("Todos")
  type Item = { id: string; type: string; personId: string; requestId?: string; date: string; detail: string }
  const reservations = liveReservations(data)
  const items: Item[] = [
    ...reservations.map(r => ({ id: r.id, type: "Reserva", personId: r.personId, requestId: r.requestId, date: r.expires, detail: `Prioridad ${activeQueue(data, r.personId).findIndex(x => x.id === r.id) + 1} · ${data.requests.find(x => x.id === r.requestId)?.title || r.requestId}` })),
    ...data.interviews.filter(i => i.result === "Pendiente").map(i => ({ id: i.id, type: "Entrevista", personId: i.personId, requestId: i.requestId, date: i.date, detail: `Entrevista con ${i.interviewer}` })),
    ...data.releases.filter(r => r.status === "Prevista").map(r => ({ id: r.id, type: "Liberación", personId: r.personId, date: r.date, detail: r.project })),
  ]
  const conflicts = data.people.filter(p => reservations.filter(r => r.personId === p.id).length > 1)
  const matches = (p: Person) => `${p.name} ${p.specialty}`.toLowerCase().includes(search.toLowerCase())
  const visible = items.filter(i => (kind === "Todos" || kind === i.type) && `${data.people.find(p => p.id === i.personId)?.name} ${i.detail}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.date.localeCompare(b.date))
  return <><div className="context-note"><Icon name="clock" /><div><strong>Seguimiento operativo</strong><span>Reservas, entrevistas y liberaciones pendientes. La prioridad se conserva por orden de llegada; las cancelaciones requieren un motivo.</span></div></div><section className="overview-card conflict-section"><div className="overview-heading"><h2>Conflictos de prioridad</h2><span>{conflicts.length} personas con varias reservas</span></div>{conflicts.filter(matches).map(p => <div className="conflict-item" key={p.id}><button className="text-button" onClick={() => openPerson(p.id)}>{p.name} →</button><div>{activeQueue(data, p.id).filter(r => new Date(r.expires).getTime() > Date.now()).map((r, index) => <button key={r.id} onClick={() => openRequest(r.requestId)}><strong>{index + 1}. {data.requests.find(x => x.id === r.requestId)?.title || r.requestId}</strong><small>Creada {labelTime(r.created)} · vence {labelTime(r.expires)}</small></button>)}</div><Button onClick={() => openPerson(p.id)}>Gestionar reservas</Button></div>)}{!conflicts.filter(matches).length && <p className="muted">No hay conflictos que coincidan con la búsqueda.</p>}</section><FilterBar><select aria-label="Tipo de seguimiento" value={kind} onChange={e => setKind(e.target.value)}>{["Todos", "Reserva", "Entrevista", "Liberación"].map(k => <option key={k}>{k}</option>)}</select><span className="muted">{visible.length} pendientes</span></FilterBar><div className="follow-list">{visible.map(i => <article className="follow-row" key={i.id}><span className={`follow-icon ${i.type}`}><Icon name={i.type === "Entrevista" ? "calendar" : i.type === "Reserva" ? "clock" : "users"} /></span><div><small>{i.type}</small><button className="text-button" onClick={() => openPerson(i.personId)}>{data.people.find(p => p.id === i.personId)?.name || i.personId}</button><p>{i.detail}</p></div><time>{i.date.length === 10 ? labelDate(i.date) : labelTime(i.date)}</time>{i.requestId && <Button onClick={() => openRequest(i.requestId!)}>Ver solicitud</Button>}<Button onClick={() => openPerson(i.personId)}>Ver perfil</Button></article>)}{!visible.length && <Empty text="No hay acciones pendientes con estos filtros." />}</div></>
}
