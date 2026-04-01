import { useState, useRef, useEffect } from "react";

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0C0C14; --surface: #13131F; --border: #1F1F30; --border2: #2A2A3E;
      --text: #E2E2F0; --muted: #6B6B90; --faint: #2A2A40;
      --amber: #F5A623; --amber-dim: #3A2A0A;
    }
    body { background: var(--bg); }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { opacity: .25; transform: scale(.8); } 50% { opacity: 1; transform: scale(1); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .agent-btn { width: 100%; background: none; border: none; border-left: 2px solid transparent; padding: 12px 16px; cursor: pointer; transition: background .15s, border-color .15s; text-align: left; }
    .agent-btn:hover { background: rgba(255,255,255,.03); }
    .agent-btn.active { border-left-color: var(--accent-color); background: rgba(255,255,255,.05); }
    .send-btn { width: 40px; height: 40px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; transition: background .15s, transform .1s, opacity .15s; }
    .send-btn:not(:disabled):hover { transform: scale(1.06); }
    .send-btn:not(:disabled):active { transform: scale(.96); }
    .bubble { max-width: 76%; animation: fadeUp .25s ease both; line-height: 1.75; font-size: 14px; font-family: 'DM Sans', sans-serif; }
    .config-input { width: 100%; background: var(--bg); border: 1px solid var(--border2); border-radius: 8px; padding: 10px 12px; color: var(--text); font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color .15s; }
    .config-input:focus { border-color: var(--amber); }
    .tag { display: inline-flex; align-items: center; gap: 5px; border-radius: 6px; padding: 3px 10px; font-size: 10px; font-family: 'Syne', sans-serif; font-weight: 600; letter-spacing: .06em; }
    textarea:focus { outline: none; }
    textarea { resize: none; }
  `}</style>
);

const OLIVIA_SHEET_ID = "1Sn1uvZEO6vdgRk79Y0i8th8NQKRddepL1tcVQtBopLY";
const STRATY_SHEET_ID = "1K8DwyXxY8JkYTPurwGCuiQgLhUDxY1jat4u0mszg-hc";
const CRM_BASE        = "https://mahfebuoqcjzdonhlgkv.supabase.co/functions/v1/crm-api";
const SHEETS_BASE     = "https://sheets.googleapis.com/v4/spreadsheets";
const PROXY_URL       = "https://mahfebuoqcjzdonhlgkv.supabase.co/functions/v1/anthropic-proxy";

const AGENTS = [
  {
    id: "tere", name: "Tere", emoji: "👩‍💼", color: "#5BADDF", bg: "#0D1E2E",
    role: "Secretaria Ejecutiva", badge: "Gmail · Calendar",
    intro: "Hola, soy Tere. Puedo revisar tu agenda, enviar correos y organizar tu día.",
    system: `Eres Tere, la secretaria ejecutiva personal. Tienes acceso a Gmail y Google Calendar de tu jefe.\nPuedes: agendar reuniones, revisar eventos, buscar y redactar correos.\nEres organizada, proactiva y discreta. Confirmas antes de ejecutar acciones irreversibles. Respondes en español.`,
    mcpServers: [
      { type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" },
      { type: "url", url: "https://gcal.mcp.claude.com/mcp", name: "gcal" },
    ],
    tools: null,
  },
  {
    id: "debby", name: "Debby", emoji: "⌨️", color: "#3DD6C8", bg: "#091E1C",
    role: "Senior Developer", badge: "Código · GitHub",
    intro: "Soy Debby. Código, arquitectura, debugging — dime qué necesitas.",
    system: `Eres Debby, senior engineer full-stack. Dominas React, Node, Python, SQL, APIs REST y cloud.\nCódigo limpio, bien documentado. Explicas decisiones técnicas, señalas problemas y das opciones en trade-offs.\nDirecta y pragmática. Respondes en español.`,
    mcpServers: null, tools: null,
  },
  {
    id: "nexxus", name: "NEXXUS", emoji: "📋", color: "#F5A623", bg: "#1E1506",
    role: "CRM de Ventas", badge: "CRM · Calendar",
    intro: "Listo para gestionar tu pipeline. ¿Qué necesitas revisar o actualizar hoy?",
    system: `Eres NEXXUS, agente CRM de ventas. Tienes acceso al CRM y a Google Calendar.\nGestionas prospectos, proyectos, destajos, actividades, avances y seguimientos.\nUsa las herramientas para datos reales — no inventes. Confirma antes de crear o modificar registros.\nPreciso, comercial, orientado a resultados. Respondes en español.`,
    mcpServers: [{ type: "url", url: "https://gcal.mcp.claude.com/mcp", name: "gcal" }],
    tools: "crm",
  },
  {
    id: "olivia", name: "Olivia", emoji: "🐱", color: "#E8C49A", bg: "#1C1510",
    role: "Gastos del Hogar", badge: "B&M · Sheets",
    intro: "Miau 🐾 Soy Olivia. Cuido la bitácora del hogar. ¿Qué quieres consultar o registrar?",
    system: `Eres Olivia, una gata blanca elegante que administra las finanzas del hogar 🐱.\nTienes acceso a la bitácora B&M en Google Sheets. Consultas registros, analizas por categoría y registras pagos.\nMuéstrate organizada y clara. Usa un emoji de gato ocasionalmente 🐾.\nConfirma antes de registrar. Si falta configuración, avisa con gracia. Respondes en español.`,
    mcpServers: null, tools: "sheets_olivia",
  },
  {
    id: "straty", name: "STRATY", emoji: "💼", color: "#5EE87A", bg: "#0B1A0D",
    role: "Gastos del Negocio", badge: "Finanzas · Sheets",
    intro: "STRATY online. Listo para analizar y registrar gastos del negocio.",
    system: `Eres STRATY, agente de control financiero del negocio.\nTienes acceso a la bitácora empresarial en Google Sheets. Consultas, analizas por categoría/proveedor y registras movimientos.\nAnalítico, preciso, orientado a insights accionables. Confirma antes de registrar.\nSi falta Sheet ID o API key, avisa claramente. Respondes en español.`,
    mcpServers: null, tools: "sheets_straty",
  },
];

const CRM_TOOLS = [
  { name: "list_prospects",     description: "Lista todos los prospectos",     input_schema: { type: "object", properties: {} } },
  { name: "get_prospect",       description: "Detalle de un prospecto por ID", input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "create_prospect",    description: "Crea un nuevo prospecto",        input_schema: { type: "object", properties: { nombre: { type: "string" }, empresa: { type: "string" }, email: { type: "string" }, telefono: { type: "string" }, notas: { type: "string" } }, required: ["nombre"] } },
  { name: "list_projects",      description: "Lista todos los proyectos",      input_schema: { type: "object", properties: {} } },
  { name: "list_seguimientos",  description: "Lista seguimientos",             input_schema: { type: "object", properties: { tipo: { type: "string" } } } },
  { name: "create_seguimiento", description: "Crea un seguimiento",            input_schema: { type: "object", properties: { prospecto_id: { type: "string" }, tipo: { type: "string" }, descripcion: { type: "string" }, fecha: { type: "string" } }, required: ["descripcion"] } },
];

const SHEETS_TOOLS = [
  { name: "read_sheet",     description: "Lee registros de la bitácora",    input_schema: { type: "object", properties: {} } },
  { name: "append_payment", description: "Registra un pago en la bitácora", input_schema: { type: "object", properties: { fecha: { type: "string" }, quien: { type: "string" }, tipo: { type: "string", enum: ["Gasto","Ingreso","Ahorro LP","Ahorro CP"] }, categoria: { type: "string" }, monto: { type: "number" }, comentarios: { type: "string" } }, required: ["fecha","tipo","categoria","monto"] } },
];

function Dots({ color }) {
  return (
    <span style={{ display:"inline-flex", gap:5, alignItems:"center", padding:"2px 0" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:7, height:7, borderRadius:"50%", background:color,
          display:"inline-block", animation:`pulse 1.2s ${i*.22}s infinite ease-in-out` }} />
      ))}
    </span>
  );
}

function Spinner({ color }) {
  return <span style={{ display:"inline-block", width:13, height:13,
    border:`2px solid ${color}30`, borderTopColor:color, borderRadius:"50%",
    animation:"spin .8s linear infinite" }} />;
}

function ConfigModal({ config, onSave, onClose }) {
  const [form, setForm] = useState({ ...config });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, backdropFilter:"blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#16162A", border:"1px solid #2A2A40",
        borderRadius:16, padding:28, width:440, maxWidth:"94vw", boxShadow:"0 24px 80px rgba(0,0,0,.6)" }}>
        <p style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#E2E2F0", marginBottom:4 }}>
          Configuración de API Keys
        </p>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#6B6B90", marginBottom:22 }}>
          Se guardan en tu navegador — no tienes que volver a ingresarlas.
        </p>
        {[
          { label:"API Key · Anthropic (Claude)",              key:"anthropicKey", ph:"sk-ant-...",                 type:"password" },
          { label:"API Key · NEXXUS CRM",                      key:"nexusKey",     ph:"Tu CRM_API_KEY de Supabase", type:"password" },
          { label:"API Key · Google Sheets (Olivia & STRATY)", key:"sheetsKey",    ph:"AIza...",                   type:"password" },
        ].map(({ label, key, ph, type }) => (
          <div key={key} style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontFamily:"'Syne',sans-serif", fontSize:10,
              fontWeight:600, letterSpacing:".08em", color:"#6B6B90", marginBottom:6, textTransform:"uppercase" }}>
              {label}
            </label>
            <input className="config-input" type={type} value={form[key]||""} onChange={set(key)} placeholder={ph} />
          </div>
        ))}
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button onClick={onClose} style={{ flex:1, background:"none", border:"1px solid #2A2A40",
            borderRadius:10, padding:"11px 0", color:"#6B6B90", fontFamily:"'Syne',sans-serif",
            fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ flex:2, background:"#F5A623", border:"none",
            borderRadius:10, padding:"11px 0", color:"#0C0C14", fontFamily:"'Syne',sans-serif",
            fontSize:12, fontWeight:700, cursor:"pointer" }}>Guardar configuración</button>
        </div>
      </div>
    </div>
  );
}

export default function OpenClaw() {
  const [config,     setConfig]    = useState({ anthropicKey:"", nexusKey:"", sheetsKey:"" });
  const [showConfig, setShowConfig]= useState(false);
  const [active,     setActive]    = useState(null);
  const [histories,  setHistories] = useState({});
  const [input,      setInput]     = useState("");
  const [loading,    setLoading]   = useState(false);
  const [status,     setStatus]    = useState("");
  const bottomRef = useRef(null);
  const taRef     = useRef(null);

  useEffect(() => {
    try { const s = localStorage.getItem("oc3"); if (s) setConfig(JSON.parse(s)); } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [histories, loading]);

  const saveConfig = c => {
    setConfig(c);
    try { localStorage.setItem("oc3", JSON.stringify(c)); } catch {}
    setShowConfig(false);
  };

  const callCRM = async (name, inp) => {
    const h = { "x-api-key": config.nexusKey };
    try {
      const G = qs => fetch(`${CRM_BASE}?${qs}`, { headers:h }).then(r=>r.json());
      const P = (qs,body) => fetch(`${CRM_BASE}?${qs}`, { method:"POST", headers:{...h,"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(r=>r.json());
      if (name==="list_prospects")     return G("resource=prospects");
      if (name==="get_prospect")       return G(`resource=prospects&id=${inp.id}`);
      if (name==="create_prospect")    return P("resource=prospects", inp);
      if (name==="list_projects")      return G("resource=projects");
      if (name==="list_seguimientos")  return G("resource=seguimientos");
      if (name==="create_seguimiento") return P("resource=seguimientos", inp);
    } catch(e) { return { error:e.message }; }
  };

  const callSheets = async (name, inp, sheetId, sheetName) => {
    if (!config.sheetsKey) return { error:"Falta la API Key de Google Sheets — configúrala en ⚙" };
    if (!sheetId)          return { error:"Falta el Sheet ID" };
    const key = config.sheetsKey;
    try {
      if (name==="read_sheet") {
        const r = await fetch(`${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${key}`);
        if (!r.ok) { const e=await r.json(); return { error:e?.error?.message||`Error ${r.status}` }; }
        return r.json();
      }
      if (name==="append_payment") {
        const row = [inp.fecha, inp.quien||"", inp.tipo, inp.categoria, inp.monto, inp.comentarios||""];
        const r = await fetch(`${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&key=${key}`,
          { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ values:[row] }) });
        if (!r.ok) return { error:"Escritura requiere OAuth. Registra manualmente: "+JSON.stringify(row) };
        return { success:true, row };
      }
    } catch(e) { return { error:e.message }; }
  };

  const send = async () => {
    if (!input.trim()||loading||!active) return;
    const userMsg = { role:"user", content:input.trim() };
    const newHist = [...(histories[active.id]||[]), userMsg];
    setHistories(p=>({...p,[active.id]:newHist}));
    setInput(""); setLoading(true); setStatus("Pensando…");
    try {
      let msgs=newHist.map(m=>({role:m.role,content:m.content}));
      let tools=null, sid=OLIVIA_SHEET_ID, sname="BITACORA_PAGOS";
      if (active.tools==="crm")           tools=CRM_TOOLS;
      if (active.tools==="sheets_olivia") tools=SHEETS_TOOLS;
      if (active.tools==="sheets_straty") { tools=SHEETS_TOOLS; sid=STRATY_SHEET_ID; sname="BITACORA_PAGOS_NEGOCIO"; }
      let finalText="";
      for (let i=0;i<6;i++) {
        const body={model:"claude-sonnet-4-20250514",max_tokens:1000,system:active.system,messages:msgs};
        if (active.mcpServers) body.mcp_servers=active.mcpServers;
        if (tools)             body.tools=tools;
        if (i>0) setStatus("Ejecutando herramientas…");
        const res=await fetch(PROXY_URL, {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":config.anthropicKey,"anthropic-version":"2023-06-01"},
          body:JSON.stringify(body)
        });
        const data=await res.json();
        const toolUse=(data.content||[]).filter(b=>b.type==="tool_use");
        const texts=(data.content||[]).filter(b=>b.type==="text");
        if (toolUse.length) {
          msgs.push({role:"assistant",content:data.content});
          const results=[];
          for (const tu of toolUse) {
            const r=active.tools==="crm"?await callCRM(tu.name,tu.input):await callSheets(tu.name,tu.input,sid,sname);
            results.push({type:"tool_result",tool_use_id:tu.id,content:JSON.stringify(r)});
          }
          msgs.push({role:"user",content:results});
        } else { finalText=texts.map(b=>b.text).join("")||"Sin respuesta."; break; }
      }
      setHistories(p=>({...p,[active.id]:[...newHist,{role:"assistant",content:finalText}]}));
    } catch(e) {
      setHistories(p=>({...p,[active.id]:[...(histories[active?.id]||[]),{role:"assistant",content:`⚠️ ${e.message}`}]}));
    }
    setLoading(false); setStatus("");
  };

  const handleKey = e => { if (e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };
  const msgs = histories[active?.id]||[];
  const configured = config.anthropicKey||config.nexusKey||config.sheetsKey;

  return (
    <>
      <FontLoader />
      <div style={{fontFamily:"'DM Sans',sans-serif",background:"var(--bg)",minHeight:"100vh",display:"flex",flexDirection:"column",color:"var(--text)"}}>
        <header style={{height:52,display:"flex",alignItems:"center",padding:"0 20px",background:"var(--surface)",borderBottom:"1px solid var(--border)",gap:12,flexShrink:0}}>
          <span style={{fontSize:20}}>🦾</span>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:"var(--amber)",letterSpacing:".06em"}}>Asistentes Bruno</span>
          <span style={{fontSize:11,color:"var(--faint)",fontFamily:"'Syne',sans-serif",fontWeight:600,letterSpacing:".12em",marginLeft:2}}>v2</span>
          <div style={{marginLeft:"auto"}}>
            <button onClick={()=>setShowConfig(true)} style={{display:"flex",alignItems:"center",gap:6,background:configured?"var(--amber-dim)":"none",border:`1px solid ${configured?"var(--amber)":"var(--border2)"}`,borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,color:configured?"var(--amber)":"var(--muted)",letterSpacing:".08em"}}>
              {configured?"⚙ Config ✓":"⚙ Config"}
            </button>
          </div>
        </header>

        {showConfig&&<ConfigModal config={config} onSave={saveConfig} onClose={()=>setShowConfig(false)}/>}

        <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 52px)"}}>
          <aside style={{width:210,background:"var(--surface)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
            <div style={{padding:"14px 16px 8px",fontFamily:"'Syne',sans-serif",fontSize:9,fontWeight:700,letterSpacing:".15em",color:"var(--faint)",textTransform:"uppercase"}}>Agentes</div>
            {AGENTS.map((a,i)=>{
              const isActive=active?.id===a.id;
              const hasHist=(histories[a.id]||[]).length>0;
              return(
                <button key={a.id} className={`agent-btn${isActive?" active":""}`}
                  style={{"--accent-color":a.color,animationDelay:`${i*.05}s`,animation:"fadeUp .3s ease both"}}
                  onClick={()=>{setActive(a);setStatus("");}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:20,lineHeight:1}}>{a.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:isActive?a.color:"var(--text)",letterSpacing:".04em",display:"flex",alignItems:"center",gap:6}}>
                        {a.name}
                        {hasHist&&!isActive&&<span style={{width:5,height:5,borderRadius:"50%",background:a.color,display:"inline-block"}}/>}
                      </div>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.role}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {!active?(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:40}}>
                <span style={{fontSize:56,filter:"grayscale(.3)"}}>🦾</span>
                <p style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:"var(--faint)",letterSpacing:".06em"}}>Selecciona un agente</p>
                <p style={{fontSize:13,color:"var(--faint)",opacity:.5}}>para comenzar una conversación</p>
                {!configured&&<button onClick={()=>setShowConfig(true)} style={{marginTop:8,background:"none",border:"1px solid #F5A62340",borderRadius:10,padding:"10px 22px",color:"#F5A62370",fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:".08em"}}>⚙ Configurar API Keys</button>}
              </div>
            ):(
              <>
                <div style={{padding:"12px 22px",borderBottom:"1px solid var(--border)",background:"var(--surface)",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
                  <span style={{fontSize:22}}>{active.emoji}</span>
                  <div>
                    <p style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:active.color,letterSpacing:".05em"}}>{active.name}</p>
                    <p style={{fontSize:11,color:"var(--muted)",marginTop:1}}>{active.role}</p>
                  </div>
                  <div className="tag" style={{background:`${active.color}18`,border:`1px solid ${active.color}30`,color:active.color,marginLeft:4}}>{active.badge}</div>
                  {msgs.length>0&&<button onClick={()=>setHistories(p=>({...p,[active.id]:[]}))} style={{marginLeft:"auto",background:"none",border:"1px solid var(--border2)",borderRadius:7,padding:"4px 12px",color:"var(--muted)",fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:600,cursor:"pointer",letterSpacing:".06em"}}>Limpiar</button>}
                </div>

                <div style={{flex:1,overflowY:"auto",padding:"24px 22px",display:"flex",flexDirection:"column",gap:16}}>
                  {msgs.length===0&&(
                    <div className="bubble" style={{alignSelf:"flex-start",background:active.bg,border:`1px solid ${active.color}25`,borderRadius:"4px 14px 14px 14px",padding:"12px 16px"}}>
                      <p style={{fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600,color:active.color,letterSpacing:".06em",marginBottom:6}}>{active.name}</p>
                      <p style={{color:"var(--text)",opacity:.85}}>{active.intro}</p>
                    </div>
                  )}
                  {msgs.map((m,i)=>{
                    const isUser=m.role==="user";
                    return(
                      <div key={i} className="bubble" style={{alignSelf:isUser?"flex-end":"flex-start",background:isUser?"#1C1C2E":active.bg,border:`1px solid ${isUser?"var(--border2)":`${active.color}25`}`,borderRadius:isUser?"14px 4px 14px 14px":"4px 14px 14px 14px",padding:"12px 16px"}}>
                        <p style={{fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600,color:isUser?"var(--muted)":active.color,letterSpacing:".06em",marginBottom:6}}>{isUser?"Tú":active.name}</p>
                        <p style={{color:"var(--text)",whiteSpace:"pre-wrap",wordBreak:"break-word",opacity:.9}}>{m.content}</p>
                      </div>
                    );
                  })}
                  {loading&&(
                    <div className="bubble" style={{alignSelf:"flex-start",background:active.bg,border:`1px solid ${active.color}25`,borderRadius:"4px 14px 14px 14px",padding:"12px 16px"}}>
                      <p style={{fontSize:11,fontFamily:"'Syne',sans-serif",fontWeight:600,color:active.color,letterSpacing:".06em",marginBottom:8}}>{active.name}</p>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <Dots color={active.color}/>
                        {status&&<span style={{fontSize:11,color:"var(--muted)",display:"flex",alignItems:"center",gap:6}}><Spinner color={active.color}/> {status}</span>}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef}/>
                </div>

                <div style={{padding:"14px 22px",borderTop:"1px solid var(--border)",background:"var(--surface)",flexShrink:0}}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-end",background:"#0C0C18",border:"1px solid var(--border2)",borderRadius:12,padding:"8px 8px 8px 14px"}}>
                    <textarea ref={taRef} rows={1} disabled={loading} value={input}
                      onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
                      placeholder={`Escribe a ${active.name}…`}
                      style={{flex:1,background:"none",border:"none",outline:"none",color:"var(--text)",fontSize:14,fontFamily:"'DM Sans',sans-serif",lineHeight:1.6,minHeight:26,maxHeight:120,resize:"none",opacity:loading?.4:1}}/>
                    <button className="send-btn" onClick={send} disabled={!input.trim()||loading}
                      style={{background:!input.trim()||loading?"var(--faint)":active.color,color:!input.trim()||loading?"var(--muted)":"#0C0C14",opacity:!input.trim()||loading?.5:1}}>↑</button>
                  </div>
                  <p style={{fontSize:10,color:"var(--faint)",marginTop:7,letterSpacing:".04em"}}>Enter para enviar &nbsp;·&nbsp; Shift + Enter para nueva línea</p>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
