/**
 * docker-manager-card.js
 * Lovelace custom card for Docker Manager integration
 * https://github.com/jeanphic/ha-docker-manager-card
 * @version 1.4.0
 */

const CARD_VERSION = "1.4.6";

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const TRANSLATIONS = {
  en: { running:"Running", stopped:"Stopped", paused:"Paused", restarting:"Restarting", dead:"Dead", created:"Created", stop:"Stop", start:"Start", restart:"Restart", check_update:"Check for update", update_now:"Update now", up_to_date:"Up to date", checking:"Checking…", never_checked:"Never checked", last_checked:"Last checked", update_available:"update available", cpu:"CPU", memory:"Memory", memory_pct:"Memory %", net_up:"Net ↑", net_down:"Net ↓", health:"Health", started:"Started", image:"Image", step_pull:"Pulling image…", step_stop:"Stopping…", step_remove:"Removing…", step_create:"Creating…", step_start:"Starting…", step_done:"Update complete", no_entity:"Entity not found" },
  fr: { running:"En cours", stopped:"Arrêté", paused:"En pause", restarting:"Redémarrage", dead:"Mort", created:"Créé", stop:"Arrêter", start:"Démarrer", restart:"Redémarrer", check_update:"Vérifier", update_now:"Mettre à jour", up_to_date:"À jour", checking:"Vérification…", never_checked:"Jamais vérifié", last_checked:"Dernière vérification", update_available:"mise à jour disponible", cpu:"CPU", memory:"Mémoire", memory_pct:"Mémoire %", net_up:"Réseau ↑", net_down:"Réseau ↓", health:"Santé", started:"Démarré le", image:"Image", step_pull:"Téléchargement…", step_stop:"Arrêt…", step_remove:"Suppression…", step_create:"Création…", step_start:"Démarrage…", step_done:"Mise à jour terminée", no_entity:"Entité introuvable" },
  de: { running:"Läuft", stopped:"Gestoppt", paused:"Pausiert", restarting:"Neustart", dead:"Tot", created:"Erstellt", stop:"Stoppen", start:"Starten", restart:"Neustart", check_update:"Prüfen", update_now:"Aktualisieren", up_to_date:"Aktuell", checking:"Prüfe…", never_checked:"Nie geprüft", last_checked:"Zuletzt geprüft", update_available:"Update verfügbar", cpu:"CPU", memory:"Speicher", memory_pct:"Speicher %", net_up:"Netz ↑", net_down:"Netz ↓", health:"Status", started:"Gestartet", image:"Image", step_pull:"Image laden…", step_stop:"Stoppe…", step_remove:"Entferne…", step_create:"Erstelle…", step_start:"Starte…", step_done:"Aktualisierung abgeschlossen", no_entity:"Entität nicht gefunden" },
  es: { running:"Ejecutando", stopped:"Detenido", paused:"En pausa", restarting:"Reiniciando", dead:"Muerto", created:"Creado", stop:"Detener", start:"Iniciar", restart:"Reiniciar", check_update:"Verificar", update_now:"Actualizar", up_to_date:"Al día", checking:"Verificando…", never_checked:"Nunca verificado", last_checked:"Última verificación", update_available:"actualización disponible", cpu:"CPU", memory:"Memoria", memory_pct:"Memoria %", net_up:"Red ↑", net_down:"Red ↓", health:"Salud", started:"Iniciado", image:"Imagen", step_pull:"Descargando…", step_stop:"Deteniendo…", step_remove:"Eliminando…", step_create:"Creando…", step_start:"Iniciando…", step_done:"Actualización completada", no_entity:"Entidad no encontrada" },
  nl: { running:"Actief", stopped:"Gestopt", paused:"Gepauzeerd", restarting:"Herstart", dead:"Dood", created:"Aangemaakt", stop:"Stoppen", start:"Starten", restart:"Herstarten", check_update:"Controleren", update_now:"Bijwerken", up_to_date:"Up-to-date", checking:"Controleren…", never_checked:"Nooit gecontroleerd", last_checked:"Laatste controle", update_available:"update beschikbaar", cpu:"CPU", memory:"Geheugen", memory_pct:"Geheugen %", net_up:"Net ↑", net_down:"Net ↓", health:"Status", started:"Gestart", image:"Image", step_pull:"Image laden…", step_stop:"Stoppen…", step_remove:"Verwijderen…", step_create:"Aanmaken…", step_start:"Starten…", step_done:"Bijwerken voltooid", no_entity:"Entiteit niet gevonden" },
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
    entity_health:"health", entity_started:"started", entity_image:"image",
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
// Styles — expose CSS variables for card_mod customization
// ---------------------------------------------------------------------------
const STYLES = `
  :host {
    display: block;
    /* Base variables — override with card_mod */
    --dmc-bg:            rgba(var(--rgb-primary-text-color), 0.25) !important;
    --dmc-text:          var(--primary-text-color, #212121);
    --dmc-text2:         var(--secondary-text-color, #757575);
    --dmc-border:        var(--divider-color, rgba(0,0,0,0.12));
    --dmc-bg2:           var(--secondary-background-color, #f5f5f5);
    --dmc-radius:        var(--ha-card-border-radius, 12px);
    /* Button color variables */
    --dmc-btn-stop-bg:        rgba(30,40,60,1);
    --dmc-btn-stop-color:     var(--primary-text-color);
    --dmc-btn-stop-border:    rgba(30,40,60,1);
    --dmc-btn-start-bg:       rgba(30,40,60,1);
    --dmc-btn-start-color:    #3B6D11;
    --dmc-btn-start-border:   rgba(30,40,60,1);
    --dmc-btn-restart-bg:     rgba(30,40,60,1);
    --dmc-btn-restart-color:  var(--dmc-text);
    --dmc-btn-restart-border: var(--dmc-border);
    --dmc-btn-check-bg:       rgba(30,40,60,1);
    --dmc-btn-check-color:    var(--dmc-text);
    --dmc-btn-check-border:   rgba(30,40,60,1);
    --dmc-btn-update-bg:      #E6F1FB;
    --dmc-btn-update-color:   #185FA5;
    --dmc-btn-update-border:  #85B7EB;
    --dmc-btn-uptd-bg:        rgba(30,40,60,1);
    --dmc-btn-uptd-color:     #3B6D11;
    --dmc-btn-uptd-border:    rgba(30,40,60,1);
	/* Couleurs dynamiques des icônes */
	--dmc-icon-running:    #43A047;
	--dmc-icon-stopped:    #E53935;
	--dmc-icon-paused:     #FB8C00;
	--dmc-icon-restarting: #3949AB;
	--dmc-icon-dead:       #757575;
	
	/* Bordure de carte */
	--dmc-border-running:    #6495ED;
	--dmc-border-stopped:    #DC143C;
	--dmc-border-paused:     #FB8C00;
	--dmc-border-restarting: #3949AB;
	--dmc-border-dead:       #757575;
	
	/* Seuils CPU/Mémoire */
	--dmc-metric-ok:      #00C853;
	--dmc-metric-warning: #FF9100;
	--dmc-metric-danger:  #D50000;
  }
  ha-card { overflow: hidden; font-family: var(--primary-font-family, Roboto, sans-serif); border-radius: var(--dmc-radius); }
  .card   { background: var(--dmc-bg); border-left: 5px solid transparent; }
  .card.running { border-left-color: var(--dmc-border-running); }
  .card.stopped { border-left-color: var(--dmc-border-stopped); }
  .card.paused { border-left-color: var(--dmc-border-paused); }
  .card.restarting { border-left-color: var(--dmc-border-restarting); }
  .card.dead { border-left-color: var(--dmc-border-dead); }
  .hdr    { display:flex; align-items:center; gap:12px; padding:14px 16px 0; cursor:pointer; user-select:none; }
  .ico    { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .restarting-spin { animation: dmc-spin 1s linear infinite; }
  
  @keyframes dmc-spin {
	from { transform: rotate(0deg); }
	to   { transform: rotate(360deg); }
  }
  .cname  { font-size:15px; font-weight:500; color:var(--dmc-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cimage { font-size:11px; color:var(--dmc-text2); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .badge  { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:500; padding:3px 8px; border-radius:20px; flex-shrink:0; }
  .dot    { width:6px; height:6px; border-radius:50%; background:currentColor; }
  .badge.running    { background:#EAF3DE; color:#3B6D11; }
  .badge.stopped    { background:#FCEBEB; color:#A32D2D; }
  .badge.paused     { background:#FAEEDA; color:#854F0B; }
  .badge.restarting { background:#E8EAF6; color:#3949AB; }
  .badge.dead       { background:#EEEEEE; color:#616161; }
  .chevbtn { margin-left:auto; background:none; border:none; cursor:pointer; color:var(--dmc-text2); padding:4px; display:flex; align-items:center; flex-shrink:0; }
  .chev    { transition:transform .2s; }
  .chev.open { transform:rotate(180deg); }
  .ctrls   { display:flex; align-items:center; gap:6px; padding:10px 16px 14px; }
  .btn     { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; padding:5px 10px; border-radius:6px; border:1px solid var(--dmc-border); background:var(--dmc-bg); color:var(--dmc-text); cursor:pointer; transition:filter 0.15s; white-space:nowrap; }
  .btn:hover:not([disabled]) { filter:brightness(0.92); }
  .btn[disabled]  { opacity:0.55; cursor:not-allowed; }
  /* Individual button styles using CSS variables */
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
// Card
// ---------------------------------------------------------------------------
class DockerManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config   = {};
    this._hass     = null;
    this._expanded = false;
    this._updState = "idle";
    this._stepLbl  = "";
    this._lang     = null;
    this._ids      = null;
    this._initialized = false;
    // Sync card_mod styles injected on host element into shadow DOM
    this._styleObserver = new MutationObserver(() => this._syncCardModStyles());
    this._styleObserver.observe(this, { childList: true, subtree: false });
  }

  connectedCallback() { this._syncCardModStyles(); }
  disconnectedCallback() { this._styleObserver?.disconnect(); }

  _syncCardModStyles() {
    const forwarded = this.shadowRoot.getElementById("dmc-cardmod");
    if (forwarded) {
      forwarded.textContent = [...this.querySelectorAll("style")]
        .map(s => s.textContent).join("\n");
    }
  }

  setConfig(config) {
    if (!config.entity) throw new Error("docker-manager-card: 'entity' is required");
    this._config = config;
    if (config.language) this._lang = getLang(config.language);
    this._ids = null;
    this._initialized = false;
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

  t(k) { return (this._lang || TRANSLATIONS.en)[k] || k; }
  _s(id) {
    if (!id || !this._hass) return null;
    const e = this._hass.states[id];
    return e ? e.state : null;
  }
  _fmt(v) {
    return (!v || v === "unavailable" || v === "unknown") ? "—" : v;
  }
  _name() {
    if (this._config.name) return this._config.name;
    const m = this._config.entity.match(/^sensor\.(.+?)_state/);
    return m ? m[1].replace(/_/g, " ") : this._config.entity;
  }
  _call(domain, service, data) {
    this._hass?.callService(domain, service, data);
  }

  // ---- Initial full render (called once) ----
  _initDOM(ids) {
    const root = this.shadowRoot;
    root.innerHTML = `
      <style id="dmc-styles">${STYLES}</style>
      <style id="dmc-cardmod"></style>
      <ha-card>
        <div class="card">
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
    this._bindEvents(ids);
    this._setStaticLabels();
  }

  _setStaticLabels() {
    const r = this.shadowRoot;
    const set = (id, val) => { const el = r.getElementById(id); if (el) el.textContent = val; };
    set("l-cpu",     this.t("cpu"));
    set("l-mem",     this.t("memory"));
    set("l-memp",    this.t("memory_pct"));
    set("l-netu",    this.t("net_up"));
    set("l-netd",    this.t("net_down"));
    set("l-hlth",    this.t("health"));
    set("l-started", this.t("started"));
    set("l-image",   this.t("image"));
    // Static button labels
    const rst = r.getElementById("rst");
    if (rst) rst.innerHTML = `<ha-icon icon="mdi:restart"></ha-icon>${this.t("restart")}`;
    // Name
    const cname = r.getElementById("cname");
    if (cname) cname.textContent = this._name();
    // Icon
    const ico = r.getElementById("ico");
    if (ico) {
      ico.innerHTML = this._config.icon
        ? `<ha-icon icon="${this._config.icon}" style="--mdc-icon-size:22px;color:white"></ha-icon>`
        : WHALE;
    }
  }

  // ---- Differential update (called on every hass update) ----
  _render() {
    if (!this._config.entity || !this._hass) return;

    const ids = this._ids;
    if (!ids) {
      // Show error
      this.shadowRoot.innerHTML = `<style>${STYLES}</style><style id="dmc-cardmod"></style><ha-card><div class="card"><div class="err">${this.t("no_entity")}: ${this._config.entity}</div></div></ha-card>`;
      this._syncCardModStyles();
      return;
    }

    // First render: build DOM structure
    if (!this._initialized) {
      this._initDOM(ids);
    }

    const r = this.shadowRoot;
    const set = (id, val) => { const el = r.getElementById(id); if (el && el.textContent !== String(val)) el.textContent = val; };
    const setHTML = (id, val) => { const el = r.getElementById(id); if (el && el.innerHTML !== val) el.innerHTML = val; };
    const setClass = (id, cls) => { const el = r.getElementById(id); if (el && el.className !== cls) el.className = cls; };
    const setAttr = (id, attr, val) => { const el = r.getElementById(id); if (el) el[attr] = val; };

    const rawState = this._s(ids.state) || "unknown";
	const state = rawState.toLowerCase().trim();
	console.log("Docker state =", state);
	const style = getComputedStyle(this);
	
	const stateColors = {
	  running: style.getPropertyValue("--dmc-icon-running").trim(),
      stopped: style.getPropertyValue("--dmc-icon-stopped").trim(),
      paused: style.getPropertyValue("--dmc-icon-paused").trim(),
      restarting: style.getPropertyValue("--dmc-icon-restarting").trim(),
      dead: style.getPropertyValue("--dmc-icon-dead").trim(),
    };
	
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
    const updateAvail = this._s(ids.update) === "on";
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

    // --- Update DOM nodes (no full re-render) ---

    // Badge
    setClass("badge", `badge ${state}`);
    set("badge-lbl", this.t(state) || state);

	// Dynamic icon color
	const ico = r.getElementById("ico");

	if (ico) {
		ico.style.background =
			stateColors[state] || stateColors.dead;

		const iconEl = ico.querySelector("ha-icon");

		if (iconEl) {
			iconEl.classList.toggle(
				"restarting-spin",
				state === "restarting"
			);	
		}
	}
	
	//Card border-color
	const card = r.querySelector(".card");

	if (card) {
		card.classList.remove(
			"running",
			"stopped",
			"paused",
			"restarting",
			"dead"
		);

		card.classList.add(
			["running","stopped","paused","restarting","dead"]
				.includes(state)
				? state
				: "dead"
		);
	}

	// CPU & Memory color
	const metricColor = (value) => {
		const v = parseFloat(value);

		if (isNaN(v))
			return "";

		if (v >= 80)	
			return style.getPropertyValue("--dmc-metric-danger").trim();

		if (v >= 50)
			return style.getPropertyValue("--dmc-metric-warning").trim();

		return style.getPropertyValue("--dmc-metric-ok").trim();
	};
	
    // Image
    set("cimage", image);

    // Expand state
    const det = r.getElementById("det");
    if (det) {
      const cls = `det${this._expanded ? " open" : ""}`;
      if (det.className !== cls) det.className = cls;
    }
    const chev = r.getElementById("chev");
    if (chev) {
      const cls = `chev${this._expanded ? " open" : ""}`;
      if (chev.className !== cls) chev.className = cls;
    }

    // Start/Stop button
    const ss = r.getElementById("ss");
    if (ss) {
      const ssCls = isRunning ? "btn danger" : "btn success";
      const ssHTML = `<ha-icon icon="${isRunning ? "mdi:stop" : "mdi:play"}"></ha-icon>${isRunning ? this.t("stop") : this.t("start")}`;
      if (ss.className !== ssCls) ss.className = ssCls;
      if (ss.innerHTML !== ssHTML) ss.innerHTML = ssHTML;
      ss._isRunning = isRunning;
    }

    // Action button
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
      act.disabled = aDis;
      act._updateAvail = updateAvail;
      act._neverChecked = neverChecked;
    }

    // Stats
    set("v-cpu",  cpu);  setHTML("u-cpu",  cpu  !== "—" ? "%" : "");
    set("v-mem",  memMb); setHTML("u-mem",  memMb !== "—" ? " MB" : "");
    set("v-memp", memPct); setHTML("u-memp", memPct !== "—" ? "%" : "");
	const cpuEl = r.getElementById("v-cpu");
	const memPctEl = r.getElementById("v-memp");
	if (cpuEl)
		cpuEl.style.color = metricColor(cpu);
	if (memPctEl)
		memPctEl.style.color = metricColor(memPct);
    set("v-netu", netUp); setHTML("u-netu", netUp !== "—" ? " kB/s" : "");
    set("v-netd", netDown); setHTML("u-netd", netDown !== "—" ? " kB/s" : "");
    set("v-hlth", health);
    set("v-started", startedStr);
    set("v-image", image || "—");
    set("updtxt", lastCheckStr);
  }

  _bindEvents(ids) {
    const r = this.shadowRoot;

    const toggle = () => { this._expanded = !this._expanded; this._render(); };
    r.getElementById("tog")?.addEventListener("click", e => { e.stopPropagation(); toggle(); });
    r.getElementById("hdr")?.addEventListener("click", toggle);

    r.getElementById("ss")?.addEventListener("click", () => {
      const isRunning = r.getElementById("ss")?._isRunning;
      this._call("switch", isRunning ? "turn_off" : "turn_on", { entity_id: ids.sw });
    });

    r.getElementById("rst")?.addEventListener("click", () => {
      this._call("button", "press", { entity_id: ids.restart_btn });
    });

    r.getElementById("act")?.addEventListener("click", async () => {
      const act = r.getElementById("act");
      const updateAvail = act?._updateAvail;
      const neverChecked = act?._neverChecked;
      if (act?.disabled) return;

      if (updateAvail && !neverChecked) {
        this._updState = "updating";
        this._call("update", "install", { entity_id: ids.update });
        const steps = [[1500,"step_pull"],[1800,"step_pull"],[1200,"step_stop"],[1200,"step_remove"],[1200,"step_create"],[1200,"step_start"]];
        for (const [ms, key] of steps) {
          this._stepLbl = this.t(key); this._render();
          await new Promise(r => setTimeout(r, ms));
        }
        this._stepLbl = this.t("step_done"); this._render();
        await new Promise(r => setTimeout(r, 2500));
        this._updState = "idle"; this._stepLbl = ""; this._render();
      } else {
        this._updState = "checking"; this._render();
        this._call("button", "press", { entity_id: ids.check_btn });
        await new Promise(r => setTimeout(r, 5000));
        const afterCheck = this._hass?.states[ids.update]?.state;
        if (afterCheck !== "on") {
          this._updState = "just_checked"; this._render();
          await new Promise(r => setTimeout(r, 3000));
        }
        this._updState = "idle"; this._render();
      }
    });
  }

  getCardSize() { return this._expanded ? 5 : 2; }

  static getStubConfig() {
    return { entity: "sensor.mycontainer_state" };
  }
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
