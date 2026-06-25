/**
 * docker-manager-card.js
 * Lovelace custom card for Docker Manager integration
 * https://github.com/jeanphic/ha-docker-manager-card
 * @version 1.5.0
 */

const CARD_VERSION = "1.7.1";

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const TRANSLATIONS = {
  en: { running:"Running", stopped:"Stopped", paused:"Paused", restarting:"Restarting", dead:"Dead", created:"Created", removing:"Removing", stop:"Stop", start:"Start", restart:"Restart", check_update:"Check for update", update_now:"Update now", up_to_date:"Up to date", checking:"Checking…", never_checked:"Never checked", last_checked:"Last checked", update_available:"update available", cpu:"CPU", memory:"Memory", memory_pct:"Memory %", net_up:"Net ↑", net_down:"Net ↓", health:"Health", started:"Started", image:"Image", step_pull:"Pulling image…", step_stop:"Stopping…", step_remove:"Removing…", step_create:"Creating…", step_start:"Starting…", step_done:"Update complete", no_entity:"Entity not found" },
  fr: { running:"En cours", stopped:"Arrêté", paused:"En pause", restarting:"Redémarrage", dead:"Mort", created:"Créé", removing:"Suppression", stop:"Arrêter", start:"Démarrer", restart:"Redémarrer", check_update:"Vérifier", update_now:"Mettre à jour", up_to_date:"À jour", checking:"Vérification…", never_checked:"Jamais vérifié", last_checked:"Dernière vérification", update_available:"mise à jour disponible", cpu:"CPU", memory:"Mémoire", memory_pct:"Mémoire %", net_up:"Réseau ↑", net_down:"Réseau ↓", health:"Santé", started:"Démarré le", image:"Image", step_pull:"Téléchargement…", step_stop:"Arrêt…", step_remove:"Suppression…", step_create:"Création…", step_start:"Démarrage…", step_done:"Mise à jour terminée", no_entity:"Entité introuvable" },
  de: { running:"Läuft", stopped:"Gestoppt", paused:"Pausiert", restarting:"Neustart", dead:"Tot", created:"Erstellt", removing:"Wird entfernt", stop:"Stoppen", start:"Starten", restart:"Neustart", check_update:"Prüfen", update_now:"Aktualisieren", up_to_date:"Aktuell", checking:"Prüfe…", never_checked:"Nie geprüft", last_checked:"Zuletzt geprüft", update_available:"Update verfügbar", cpu:"CPU", memory:"Speicher", memory_pct:"Speicher %", net_up:"Netz ↑", net_down:"Netz ↓", health:"Status", started:"Gestartet", image:"Image", step_pull:"Image laden…", step_stop:"Stoppe…", step_remove:"Entferne…", step_create:"Erstelle…", step_start:"Starte…", step_done:"Aktualisierung abgeschlossen", no_entity:"Entität nicht gefunden" },
  es: { running:"Ejecutando", stopped:"Detenido", paused:"En pausa", restarting:"Reiniciando", dead:"Muerto", created:"Creado", removing:"Eliminando", stop:"Detener", start:"Iniciar", restart:"Reiniciar", check_update:"Verificar", update_now:"Actualizar", up_to_date:"Al día", checking:"Verificando…", never_checked:"Nunca verificado", last_checked:"Última verificación", update_available:"actualización disponible", cpu:"CPU", memory:"Memoria", memory_pct:"Memoria %", net_up:"Red ↑", net_down:"Red ↓", health:"Salud", started:"Iniciado", image:"Imagen", step_pull:"Descargando…", step_stop:"Deteniendo…", step_remove:"Eliminando…", step_create:"Creando…", step_start:"Iniciando…", step_done:"Actualización completada", no_entity:"Entidad no encontrada" },
  nl: { running:"Actief", stopped:"Gestopt", paused:"Gepauzeerd", restarting:"Herstart", dead:"Dood", created:"Aangemaakt", removing:"Verwijderen", stop:"Stoppen", start:"Starten", restart:"Herstarten", check_update:"Controleren", update_now:"Bijwerken", up_to_date:"Up-to-date", checking:"Controleren…", never_checked:"Nooit gecontroleerd", last_checked:"Laatste controle", update_available:"update beschikbaar", cpu:"CPU", memory:"Geheugen", memory_pct:"Geheugen %", net_up:"Net ↑", net_down:"Net ↓", health:"Status", started:"Gestart", image:"Image", step_pull:"Image laden…", step_stop:"Stoppen…", step_remove:"Verwijderen…", step_create:"Aanmaken…", step_start:"Starten…", step_done:"Bijwerken voltooid", no_entity:"Entiteit niet gevonden" },
};

function getLang(lang) {
  if (!lang) return TRANSLATIONS.en;
  return TRANSLATIONS[lang.split("-")[0].toLowerCase()] || TRANSLATIONS.en;
}

// ---------------------------------------------------------------------------
// Entity discovery
// ---------------------------------------------------------------------------
function discoverEntities(hass, baseEntity) {
  const match = baseEntity.match(/^sensor\.(.+?)_state(?:_\d+)?$/);
  if (!match) return null;
  const states = hass.states;
  if (!states[baseEntity]) return null;
  const prefix = match[1];

  const find = (domain, suffix) => {
    const exact = `${domain}.${prefix}_${suffix}`;
    if (states[exact]) return exact;
    const found = Object.keys(states).find(id =>
      id.startsWith(`${domain}.${prefix}_${suffix}_`) &&
      /^\d+$/.test(id.split("_").pop())
    );
    return found || exact;
  };

  let memMb = find("sensor", "memory");
  let memPct = find("sensor", "memory_2");
  const memState = states[memMb];
  if (memState && memState.attributes.unit_of_measurement === "%") {
    [memMb, memPct] = [memPct, memMb];
  }
  if (!states[memPct]) {
    const found = Object.keys(states).find(id =>
      id.startsWith(`sensor.${prefix}_memory`) &&
      states[id]?.attributes.unit_of_measurement === "%"
    );
    if (found) memPct = found;
  }

  return {
    state: baseEntity, image: find("sensor","image"), cpu: find("sensor","cpu"),
    memory: memMb, memory_pct: memPct,
    net_up: find("sensor","network_up"), net_down: find("sensor","network_down"),
    health: find("sensor","health"), started: find("sensor","started_at"),
    sw: find("switch","container"), restart_btn: find("button","restart"),
    check_btn: find("button","check_for_update"), update: find("update","update"),
  };
}

function applyOverrides(ids, config) {
  const map = {
    entity_state:"state", entity_image:"image", entity_cpu:"cpu",
    entity_memory:"memory", entity_memory_pct:"memory_pct",
    entity_net_up:"net_up", entity_net_down:"net_down",
    entity_health:"health", entity_started:"started",
    entity_switch:"sw", entity_restart:"restart_btn",
    entity_check_update:"check_btn", entity_update:"update",
  };
  const result = { ...ids };
  for (const [k, v] of Object.entries(map)) {
    if (config[k]) result[v] = config[k];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const STYLES = `
  :host {
    display: block;
    --dmc-bg:            #cecece40;
    --dmc-text:          var(--primary-text-color, #212121);
    --dmc-text2:         var(--secondary-text-color, #757575);
    --dmc-border:        var(--divider-color, rgba(0,0,0,0.12));
    --dmc-bg2:           var(--secondary-background-color, #f5f5f5);
    --dmc-radius:        var(--ha-card-border-radius, 12px);
    /* Button colors — harmonised with #cecece40 background */
    --dmc-btn-stop-bg:        rgba(192,57,43,0.13);
    --dmc-btn-stop-color:     #e57373;
    --dmc-btn-stop-border:    rgba(229,115,115,0.4);
    --dmc-btn-start-bg:       rgba(39,174,96,0.13);
    --dmc-btn-start-color:    #81c784;
    --dmc-btn-start-border:   rgba(129,199,132,0.4);
    --dmc-btn-restart-bg:     rgba(255,255,255,0.09);
    --dmc-btn-restart-color:  #cfd8dc;
    --dmc-btn-restart-border: rgba(255,255,255,0.19);
    --dmc-btn-check-bg:       rgba(255,255,255,0.09);
    --dmc-btn-check-color:    #cfd8dc;
    --dmc-btn-check-border:   rgba(255,255,255,0.19);
    --dmc-btn-update-bg:      rgba(21,101,192,0.27);
    --dmc-btn-update-color:   #90caf9;
    --dmc-btn-update-border:  rgba(144,202,249,0.4);
    --dmc-btn-uptd-bg:        rgba(39,174,96,0.2);
    --dmc-btn-uptd-color:     #a5d6a7;
    --dmc-btn-uptd-border:    rgba(165,214,167,0.4);
    /* State icon colors */
    --dmc-icon-running:    #64b5f6;
    --dmc-icon-stopped:    #ef5350;
    --dmc-icon-paused:     #ffa726;
    --dmc-icon-restarting: #7986cb;
    --dmc-icon-dead:       #78909c;
    --dmc-icon-created:    #78909c;
    --dmc-icon-removing:   #ffa726;
    /* State border colors */
    --dmc-border-running:    #64b5f6;
    --dmc-border-stopped:    #ef5350;
    --dmc-border-paused:     #ffa726;
    --dmc-border-restarting: #7986cb;
    --dmc-border-dead:       #78909c;
    --dmc-border-created:    #78909c;
    --dmc-border-removing:   #ffa726;
    /* Metric thresholds */
    --dmc-metric-ok:      #80cbc4;
    --dmc-metric-warning: #ffb74d;
    --dmc-metric-danger:  #ef5350;
  }
  ha-card { overflow: hidden; font-family: var(--primary-font-family, Roboto, sans-serif); border-radius: var(--dmc-radius); }
  .card { background: var(--dmc-bg); border-left: 5px solid transparent; transition: border-left-color 0.3s; }
  .card.running    { border-left-color: var(--dmc-border-running); }
  .card.stopped    { border-left-color: var(--dmc-border-stopped); }
  .card.paused     { border-left-color: var(--dmc-border-paused); }
  .card.restarting { border-left-color: var(--dmc-border-restarting); }
  .card.dead       { border-left-color: var(--dmc-border-dead); }
  .card.created    { border-left-color: var(--dmc-border-created); }
  .card.removing   { border-left-color: var(--dmc-border-removing); }
  .hdr    { display:flex; align-items:center; gap:12px; padding:12px 14px 0; cursor:pointer; user-select:none; }
  .ico    { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition: background 0.3s; }
  @keyframes dmc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .ico.restarting-spin { animation: dmc-spin 1s linear infinite; }
  .cname  { font-size:15px; font-weight:500; color:var(--dmc-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cimage { font-size:11px; color:var(--dmc-text2); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .badge  { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:500; padding:3px 8px; border-radius:20px; flex-shrink:0; }
  .dot    { width:6px; height:6px; border-radius:50%; background:currentColor; }
  .badge.running    { background:#EAF3DE; color:#3B6D11; }
  .badge.stopped    { background:#FCEBEB; color:#A32D2D; }
  .badge.paused     { background:#FAEEDA; color:#854F0B; }
  .badge.restarting { background:#E8EAF6; color:#3949AB; }
  .badge.dead       { background:#EEEEEE; color:#616161; }
  .badge.created    { background:#EEEEEE; color:#616161; }
  .badge.removing   { background:#FFF3E0; color:#E65100; }
  .chevbtn { margin-left:auto; background:none; border:none; cursor:pointer; color:var(--dmc-text2); padding:4px; display:flex; align-items:center; flex-shrink:0; }
  .chev    { transition:transform .2s; }
  .chev.open { transform:rotate(180deg); }
  .ctrls   { display:flex; align-items:center; gap:6px; padding:8px 14px 12px; }
  .btn     { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; padding:5px 10px; border-radius:6px; border:1px solid var(--dmc-border); background:var(--dmc-bg); color:var(--dmc-text); cursor:pointer; transition:filter 0.15s; white-space:nowrap; }
  .btn:hover:not([disabled]) { filter:brightness(0.92); }
  .btn[disabled]  { opacity:0.55; cursor:not-allowed; }
  .btn.danger  { background:var(--dmc-btn-stop-bg);    color:var(--dmc-btn-stop-color);    border-color:var(--dmc-btn-stop-border); }
  .btn.success { background:var(--dmc-btn-start-bg);   color:var(--dmc-btn-start-color);   border-color:var(--dmc-btn-start-border); }
  .btn.rst     { background:var(--dmc-btn-restart-bg); color:var(--dmc-btn-restart-color); border-color:var(--dmc-btn-restart-border); }
  .btn.chk     { background:var(--dmc-btn-check-bg);   color:var(--dmc-btn-check-color);   border-color:var(--dmc-btn-check-border); }
  .btn.upnow   { background:var(--dmc-btn-update-bg);  color:var(--dmc-btn-update-color);  border-color:var(--dmc-btn-update-border); }
  .btn.uptd    { background:var(--dmc-btn-uptd-bg);    color:var(--dmc-btn-uptd-color);    border-color:var(--dmc-btn-uptd-border); pointer-events:none; }
  .btn.busy    { background:var(--dmc-bg2); color:var(--dmc-text2); pointer-events:none; }
  .btn.ml      { margin-left:auto; }
  ha-icon { --mdc-icon-size:16px; }
  .sep  { border:none; border-top:1px solid var(--dmc-border); margin:0; }
  .det  { display:none; flex-direction:column; }
  .det.open { display:flex; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px 16px; }
  .gc   { background:var(--dmc-bg2); border-radius:8px; padding:8px 10px; }
  .gl   { font-size:11px; color:var(--dmc-text2); margin-bottom:3px; }
  .gv   { font-size:15px; font-weight:500; color:var(--dmc-text); }
  .gu   { font-size:11px; color:var(--dmc-text2); font-weight:400; }
  .infos { display:flex; flex-direction:column; gap:8px; padding:0 16px 12px; border-top:1px solid var(--dmc-border); padding-top:10px; }
  .irow  { display:flex; justify-content:space-between; align-items:center; font-size:12px; }
  .ilbl  { color:var(--dmc-text2); display:flex; align-items:center; gap:5px; }
  .ival  { color:var(--dmc-text); font-weight:500; font-size:12px; max-width:60%; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .updtxt { padding:8px 16px 12px; font-size:11px; color:var(--dmc-text2); border-top:1px solid var(--dmc-border); }
  .err { padding:16px; color:var(--error-color,red); font-size:13px; }
`;

const WHALE = `<svg viewBox="0 0 24 18" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fff"><rect x="0" y="0" width="4" height="3" rx="0.5"/><rect x="5" y="0" width="4" height="3" rx="0.5"/><rect x="10" y="0" width="4" height="3" rx="0.5"/><rect x="0" y="4" width="4" height="3" rx="0.5"/><rect x="5" y="4" width="4" height="3" rx="0.5"/><rect x="10" y="4" width="4" height="3" rx="0.5"/><rect x="15" y="4" width="4" height="3" rx="0.5"/><rect x="5" y="8" width="4" height="3" rx="0.5"/><path d="M22,9 C21.5,7 20,6.5 19,7 C18.5,5 17,4 15.5,4.5 C15,3 13.5,2.5 12,3 L12,15 C13,16 20,16 22,13 C23,11.5 22.5,10 22,9 Z"/></svg>`;

// ---------------------------------------------------------------------------
// Card element
// ---------------------------------------------------------------------------
class DockerManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config      = {};
    this._hass        = null;
    this._expanded    = false;
    this._updState    = "idle";
    this._stepLbl     = "";
    this._lang        = null;
    this._ids         = null;
    this._initialized = false;
    this._localState  = null; // temporary state override (e.g. "restarting")
    this._styleObserver = new MutationObserver(() => this._syncCardModStyles());
    this._styleObserver.observe(this, { childList: true, subtree: false });
  }

  connectedCallback()    { this._syncCardModStyles(); }
  disconnectedCallback() { this._styleObserver?.disconnect(); }

  _syncCardModStyles() {
    const el = this.shadowRoot.getElementById("dmc-cardmod");
    if (el) el.textContent = [...this.querySelectorAll("style")].map(s => s.textContent).join("\n");
  }

  setConfig(config) {
    if (!config.entity) throw new Error("docker-manager-card: 'entity' is required");
    this._config      = config;
    this._ids         = null;
    this._initialized = false;
    if (config.language) this._lang = getLang(config.language);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._lang) this._lang = getLang(hass.language);
    if (!this._ids) {
      const disc = discoverEntities(hass, this._config.entity);
      this._ids = disc ? applyOverrides(disc, this._config) : null;
    }
    this._render();
  }

  t(k)    { return (this._lang || TRANSLATIONS.en)[k] || k; }
  _s(id)  { if (!id || !this._hass) return null; const e = this._hass.states[id]; return e ? e.state : null; }
  _fmt(v) { return (!v || v === "unavailable" || v === "unknown") ? "—" : v; }
  _name() {
    if (this._config.name) return this._config.name;
    const m = this._config.entity.match(/^sensor\.(.+?)_state/);
    return m ? m[1].replace(/_/g, " ") : this._config.entity;
  }
  _call(domain, service, data) { this._hass?.callService(domain, service, data); }

  // Normalize state: Docker returns "exited" but we display as "stopped"
  _normalizeState(raw) {
    const s = (raw || "unknown").toLowerCase().trim();
    return s === "exited" ? "stopped" : s;
  }

  // Color for metric value (CPU %, Memory %)
  _metricColor(value) {
    const v = parseFloat(value);
    if (isNaN(v)) return "";
    const style = getComputedStyle(this);
    if (v >= 80) return style.getPropertyValue("--dmc-metric-danger").trim();
    if (v >= 50) return style.getPropertyValue("--dmc-metric-warning").trim();
    return style.getPropertyValue("--dmc-metric-ok").trim();
  }

  // Icon background color based on state
  _stateColor(state) {
    const style = getComputedStyle(this);
    const key = `--dmc-icon-${state}`;
    return style.getPropertyValue(key).trim() || style.getPropertyValue("--dmc-icon-dead").trim();
  }

  // ---- Build DOM once ----
  _initDOM(ids) {
    this.shadowRoot.innerHTML = `
      <style id="dmc-styles">${STYLES}</style>
      <style id="dmc-cardmod"></style>
      <ha-card>
        <div class="card" id="card">
          <div class="hdr" id="hdr">
            <div class="ico" id="ico"></div>
            <div style="flex:1;min-width:0">
              <div class="cname" id="cname"></div>
              <div class="cimage" id="cimage"></div>
            </div>
            <span class="badge" id="badge"><span class="dot"></span><span id="badge-lbl"></span></span>
            <button class="chevbtn" id="tog" aria-label="toggle">
              <ha-icon icon="mdi:chevron-down" class="chev" id="chev"></ha-icon>
            </button>
          </div>
          <div class="ctrls">
            <button class="btn" id="ss"></button>
            <button class="btn rst" id="rst"></button>
            <button class="btn ml" id="act"></button>
          </div>
          <div class="det" id="det">
            <hr class="sep">
            <div class="grid">
              <div class="gc"><div class="gl" id="l-cpu"></div><div class="gv"><span id="v-cpu">—</span><span class="gu" id="u-cpu"></span></div></div>
              <div class="gc"><div class="gl" id="l-mem"></div><div class="gv"><span id="v-mem">—</span><span class="gu" id="u-mem"></span></div></div>
              <div class="gc"><div class="gl" id="l-memp"></div><div class="gv"><span id="v-memp">—</span><span class="gu" id="u-memp"></span></div></div>
              <div class="gc"><div class="gl" id="l-netu"></div><div class="gv"><span id="v-netu">—</span><span class="gu" id="u-netu"></span></div></div>
              <div class="gc"><div class="gl" id="l-netd"></div><div class="gv"><span id="v-netd">—</span><span class="gu" id="u-netd"></span></div></div>
              <div class="gc"><div class="gl" id="l-hlth"></div><div class="gv" id="v-hlth" style="font-size:13px">—</div></div>
            </div>
            <div class="infos">
              <div class="irow">
                <span class="ilbl"><ha-icon icon="mdi:clock-outline"></ha-icon><span id="l-started"></span></span>
                <span class="ival" id="v-started">—</span>
              </div>
              <div class="irow">
                <span class="ilbl"><ha-icon icon="mdi:layers"></ha-icon><span id="l-image"></span></span>
                <span class="ival" id="v-image">—</span>
              </div>
            </div>
            <div class="updtxt" id="updtxt"></div>
          </div>
        </div>
      </ha-card>
    `;
    this._initialized = true;
    this._syncCardModStyles();
    this._setStaticLabels();
    this._bindEvents(ids);
  }

  _setStaticLabels() {
    const r   = this.shadowRoot;
    const set = (id, val) => { const el = r.getElementById(id); if (el) el.textContent = val; };
    set("l-cpu",     this.t("cpu"));
    set("l-mem",     this.t("memory"));
    set("l-memp",    this.t("memory_pct"));
    set("l-netu",    this.t("net_up"));
    set("l-netd",    this.t("net_down"));
    set("l-hlth",    this.t("health"));
    set("l-started", this.t("started"));
    set("l-image",   this.t("image"));
    set("cname",     this._name());
    const rst = r.getElementById("rst");
    if (rst) rst.innerHTML = `<ha-icon icon="mdi:restart"></ha-icon>${this.t("restart")}`;
    const ico = r.getElementById("ico");
    if (ico) ico.innerHTML = this._config.icon
      ? `<ha-icon icon="${this._config.icon}" style="--mdc-icon-size:22px;color:white"></ha-icon>`
      : WHALE;
  }

  // ---- Differential update ----
  _render() {
    if (!this._config.entity || !this._hass) return;

    const ids = this._ids;
    if (!ids) {
      this.shadowRoot.innerHTML = `<style>${STYLES}</style><style id="dmc-cardmod"></style><ha-card><div class="card"><div class="err">${this.t("no_entity")}: ${this._config.entity}</div></div></ha-card>`;
      this._syncCardModStyles();
      return;
    }

    if (!this._initialized) this._initDOM(ids);

    const r        = this.shadowRoot;
    const set      = (id, val) => { const el = r.getElementById(id); if (el && el.textContent !== String(val)) el.textContent = val; };
    const setHTML  = (id, val) => { const el = r.getElementById(id); if (el && el.innerHTML !== val) el.innerHTML = val; };
    const setCls   = (id, cls) => { const el = r.getElementById(id); if (el && el.className !== cls) el.className = cls; };

    const rawState   = this._s(ids.state) || "unknown";
    // Use local state override if set (e.g. briefly show "restarting" on button click)
    const state      = this._localState || this._normalizeState(rawState);
    const image      = this._s(ids.image) || "";
    const cpu        = this._fmt(this._s(ids.cpu));
    const memMb      = this._fmt(this._s(ids.memory));
    const memPct     = this._fmt(this._s(ids.memory_pct));
    const netUp      = this._fmt(this._s(ids.net_up));
    const netDown    = this._fmt(this._s(ids.net_down));
    const health     = this._fmt(this._s(ids.health));
    const started    = this._s(ids.started);
    const isRunning  = state === "running";
    const updAttrs   = this._hass.states[ids.update]?.attributes || {};
    const lastCheck  = updAttrs.last_check || null;
    const updateAvail  = this._s(ids.update) === "on";
    const neverChecked = !lastCheck;

    // Started
    let startedStr = "—";
    if (started && !["unavailable","unknown","none","null"].includes(started)) {
      try { startedStr = new Date(started).toLocaleString(); } catch { startedStr = started; }
    }

    // Last check label
    let lastCheckStr = this.t("never_checked");
    if (lastCheck) {
      try {
        lastCheckStr = `${this.t("last_checked")}: ${new Date(lastCheck).toLocaleString()}`;
        if (updateAvail) lastCheckStr += ` — ${this.t("update_available")}`;
      } catch { lastCheckStr = lastCheck; }
    }

    // --- Badge ---
    setCls("badge", `badge ${state}`);
    set("badge-lbl", this.t(state) || state);

    // --- Card border ---
    const card = r.getElementById("card");
    if (card) {
      const validStates = ["running","stopped","paused","restarting","dead","created","removing"];
      const cardCls = `card ${validStates.includes(state) ? state : "dead"}`;
      if (card.className !== cardCls) card.className = cardCls;
    }

    // --- Icon background color + spin animation ---
    const ico = r.getElementById("ico");
    if (ico) {
      ico.style.background = this._stateColor(state);
      ico.classList.toggle("restarting-spin", state === "restarting");
    }

    // --- Image ---
    set("cimage", image);

    // --- Expand / collapse ---
    const det  = r.getElementById("det");
    const chev = r.getElementById("chev");
    if (det)  { const c = `det${this._expanded ? " open" : ""}`;  if (det.className  !== c) det.className  = c; }
    if (chev) { const c = `chev${this._expanded ? " open" : ""}`; if (chev.className !== c) chev.className = c; }

    // --- Start/Stop button ---
    const ss = r.getElementById("ss");
    if (ss) {
      const ssCls  = isRunning ? "btn danger" : "btn success";
      const ssHTML = `<ha-icon icon="${isRunning ? "mdi:stop" : "mdi:play"}"></ha-icon>${isRunning ? this.t("stop") : this.t("start")}`;
      if (ss.className !== ssCls) ss.className = ssCls;
      if (ss.innerHTML !== ssHTML) ss.innerHTML = ssHTML;
      ss._isRunning = isRunning;
    }

    // --- Action button (check / update) ---
    let aCls = "btn chk ml", aIco = "mdi:magnify", aLbl = this.t("check_update"), aDis = false;
    if (this._updState === "checking") {
      aCls = "btn busy ml"; aIco = "mdi:loading"; aLbl = this.t("checking"); aDis = true;
    } else if (this._updState === "updating") {
      aCls = "btn busy ml"; aIco = "mdi:loading"; aLbl = this._stepLbl || this.t("step_pull"); aDis = true;
    } else if (this._updState === "just_checked") {
      aCls = "btn uptd ml"; aIco = "mdi:check"; aLbl = this.t("up_to_date"); aDis = true;
    } else if (updateAvail) {
      aCls = "btn upnow ml"; aIco = "mdi:download"; aLbl = this.t("update_now");
    }
    const act = r.getElementById("act");
    if (act) {
      const aHTML = `<ha-icon icon="${aIco}"></ha-icon>${aLbl}`;
      if (act.className !== aCls) act.className = aCls;
      if (act.innerHTML !== aHTML) act.innerHTML = aHTML;
      act.disabled      = aDis;
      act._updateAvail  = updateAvail;
      act._neverChecked = neverChecked;
    }

    // --- Stats ---
    set("v-cpu",  cpu);   setHTML("u-cpu",  cpu   !== "—" ? "%" : "");
    set("v-mem",  memMb); setHTML("u-mem",  memMb  !== "—" ? " MB" : "");
    set("v-memp", memPct); setHTML("u-memp", memPct !== "—" ? "%" : "");
    set("v-netu", netUp);  setHTML("u-netu", netUp  !== "—" ? " kB/s" : "");
    set("v-netd", netDown); setHTML("u-netd", netDown !== "—" ? " kB/s" : "");
    set("v-hlth", health);
    set("v-started", startedStr);
    set("v-image",   image || "—");
    set("updtxt",    lastCheckStr);

    // Metric color (CPU & Memory %)
    const cpuEl  = r.getElementById("v-cpu");
    const mPctEl = r.getElementById("v-memp");
    if (cpuEl)  cpuEl.style.color  = this._metricColor(cpu);
    if (mPctEl) mPctEl.style.color = this._metricColor(memPct);
  }

  _bindEvents(ids) {
    const r = this.shadowRoot;

    const toggle = () => { this._expanded = !this._expanded; this._render(); };
    r.getElementById("tog")?.addEventListener("click", e => { e.stopPropagation(); toggle(); });
    r.getElementById("hdr")?.addEventListener("click", toggle);

    r.getElementById("ss")?.addEventListener("click", async () => {
      const isRunning = r.getElementById("ss")?._isRunning;
      const targetState = isRunning ? "stopped" : "running";

      // Show immediate feedback
      this._localState = targetState;
      this._render();
      this._call("switch", isRunning ? "turn_off" : "turn_on", { entity_id: ids.sw });

      // Poll until real HA state matches target (or 30s timeout)
      const maxWait = 30000;
      const pollInterval = 1500;
      const started = Date.now();

      const poll = async () => {
        if (Date.now() - started > maxWait) {
          // Timeout — release local override, show real state
          this._localState = null;
          this._render();
          return;
        }
        const realState = this._normalizeState(this._s(ids.state) || "unknown");
        if (realState === targetState) {
          // Target reached — release local override
          this._localState = null;
          this._render();
        } else {
          await new Promise(res => setTimeout(res, pollInterval));
          poll();
        }
      };

      // Start polling after a short initial delay (give HA time to react)
      await new Promise(res => setTimeout(res, 1000));
      poll();
    });

    r.getElementById("rst")?.addEventListener("click", async () => {
      // Show restarting immediately — Docker's real "restarting" state
      // is too brief (<1s) for the coordinator to capture
      this._localState = "restarting";
      this._render();
      this._call("button", "press", { entity_id: ids.restart_btn });

      // Wait for container to stop first (state != running), then come back up
      // Timeout safety: 30s max
      const maxWait = 30000;
      const started = Date.now();
      let wentDown = false;

      const poll = async () => {
        if (Date.now() - started > maxWait) {
          this._localState = null;
          this._render();
          return;
        }
        const realState = this._normalizeState(this._s(ids.state) || "unknown");
        if (!wentDown && realState !== "running") {
          wentDown = true;
        }
        if (wentDown && realState === "running") {
          // Container is back up — release override
          this._localState = null;
          this._render();
        } else {
          await new Promise(res => setTimeout(res, 1500));
          poll();
        }
      };

      await new Promise(res => setTimeout(res, 800));
      poll();
    });

    r.getElementById("act")?.addEventListener("click", async () => {
      const act = r.getElementById("act");
      if (act?.disabled) return;
      const updateAvail  = act?._updateAvail;
      const neverChecked = act?._neverChecked;

      if (updateAvail && !neverChecked) {
        this._updState = "updating";
        this._call("update", "install", { entity_id: ids.update });
        const steps = [
          [1500,"step_pull"],[1800,"step_pull"],[1200,"step_stop"],
          [1200,"step_remove"],[1200,"step_create"],[1200,"step_start"],
        ];
        for (const [ms, key] of steps) {
          this._stepLbl = this.t(key); this._render();
          await new Promise(res => setTimeout(res, ms));
        }
        this._stepLbl = this.t("step_done"); this._render();
        await new Promise(res => setTimeout(res, 2500));
        this._updState = "idle"; this._stepLbl = ""; this._render();
      } else {
        this._updState = "checking"; this._render();
        this._call("button", "press", { entity_id: ids.check_btn });
        await new Promise(res => setTimeout(res, 5000));
        const afterCheck = this._hass?.states[ids.update]?.state;
        if (afterCheck !== "on") {
          this._updState = "just_checked"; this._render();
          await new Promise(res => setTimeout(res, 3000));
        }
        this._updState = "idle"; this._render();
      }
    });
  }

  getCardSize() { return this._expanded ? 5 : 2; }
  static getStubConfig() { return { entity: "sensor.mycontainer_state" }; }
}

customElements.define("docker-manager-card", DockerManagerCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "docker-manager-card",
  name: "Docker Manager Card",
  description: "Monitor and control a Docker container",
  preview: false,
  documentationURL: "https://github.com/jeanphic/ha-docker-manager-card",
});

console.info(
  `%c DOCKER-MANAGER-CARD %c v${CARD_VERSION} `,
  "background:#1A73E8;color:white;padding:2px 4px;border-radius:3px 0 0 3px;font-weight:bold",
  "background:#424242;color:white;padding:2px 4px;border-radius:0 3px 3px 0"
);
