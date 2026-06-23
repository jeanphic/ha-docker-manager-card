/**
 * docker-manager-card.js
 * Lovelace custom card for Docker Manager integration
 * https://github.com/jeanphic/ha-docker-manager-card
 * @version 1.2.0
 */

const CARD_VERSION = "1.2.1";

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
  const match = baseEntity.match(/^sensor\.(.+)_state$/);
  if (!match) return null;
  const prefix = match[1];
  const states = hass.states;

  // Find memory MB vs % — check unit_of_measurement
  const memId  = `sensor.${prefix}_memory`;
  const mem2Id = `sensor.${prefix}_memory_2`;
  let memMb = memId, memPct = mem2Id;

  const memState = states[memId];
  if (memState && memState.attributes.unit_of_measurement === "%") {
    memMb = mem2Id; memPct = memId;
  }
  if (!states[memPct]) {
    const found = Object.keys(states).find(id =>
      id.startsWith(`sensor.${prefix}_memory`) &&
      states[id].attributes.unit_of_measurement === "%"
    );
    if (found) memPct = found;
  }

  return {
    state:       `sensor.${prefix}_state`,
    image:       `sensor.${prefix}_image`,
    cpu:         `sensor.${prefix}_cpu`,
    memory:      memMb,
    memory_pct:  memPct,
    net_up:      `sensor.${prefix}_network_up`,
    net_down:    `sensor.${prefix}_network_down`,
    health:      `sensor.${prefix}_health`,
    started:     `sensor.${prefix}_started_at`,
    sw:          `switch.${prefix}_container`,
    restart_btn: `button.${prefix}_restart`,
    check_btn:   `button.${prefix}_check_for_update`,
    update:      `update.${prefix}_update`,
  };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const STYLES = `
  :host {
    display: block;
    --dmc-bg: var(--card-background-color, #fff);
    --dmc-text: var(--primary-text-color, #212121);
    --dmc-text2: var(--secondary-text-color, #757575);
    --dmc-border: var(--divider-color, rgba(0,0,0,0.12));
    --dmc-bg2: var(--secondary-background-color, #f5f5f5);
  }
  ha-card {
    overflow: hidden;
    font-family: var(--primary-font-family, Roboto, sans-serif);
  }
  .card {
    background: transparent;
    overflow: hidden;
    font-family: var(--primary-font-family, Roboto, sans-serif);
  }
  .hdr { display:flex; align-items:center; gap:12px; padding:14px 16px 0; cursor:pointer; user-select:none; }
  .ico { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .cname { font-size:15px; font-weight:500; color:var(--dmc-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cimage { font-size:11px; color:var(--dmc-text2); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:500; padding:3px 8px; border-radius:20px; flex-shrink:0; }
  .dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
  .running  { background:#EAF3DE; color:#3B6D11; }
  .stopped  { background:#FCEBEB; color:#A32D2D; }
  .paused   { background:#FAEEDA; color:#854F0B; }
  .restarting { background:#E8EAF6; color:#3949AB; }
  .dead     { background:#EEEEEE; color:#616161; }
  .chevbtn { margin-left:auto; background:none; border:none; cursor:pointer; color:var(--dmc-text2); padding:4px; display:flex; align-items:center; flex-shrink:0; }
  .chev { transition:transform .2s; }
  .chev.open { transform:rotate(180deg); }
  .ctrls { display:flex; align-items:center; gap:6px; padding:10px 16px 14px; }
  .btn { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; padding:5px 10px; border-radius:6px; border:1px solid var(--dmc-border); background:var(--dmc-bg); color:var(--dmc-text); cursor:pointer; transition:filter 0.15s; white-space:nowrap; }
  .btn:hover:not([disabled]) { filter:brightness(0.92); }
  .btn[disabled] { opacity:0.55; cursor:not-allowed; }
  .btn.danger { border-color:#F09595; color:#A32D2D; }
  .btn.success { border-color:#97C459; color:#3B6D11; }
  .btn.upnow { background:#E6F1FB; border-color:#85B7EB; color:#185FA5; }
  .btn.uptd { background:#EAF3DE; border-color:#C0DD97; color:#3B6D11; pointer-events:none; }
  .btn.busy { background:var(--dmc-bg2); color:var(--dmc-text2); pointer-events:none; }
  .btn.ml { margin-left:auto; }
  ha-icon { --mdc-icon-size:16px; }
  .sep { border:none; border-top:1px solid var(--dmc-border); margin:0; }
  .det { display:none; flex-direction:column; }
  .det.open { display:flex; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px 16px; }
  .gc { background:var(--dmc-bg2); border-radius:8px; padding:8px 10px; }
  .gl { font-size:11px; color:var(--dmc-text2); margin-bottom:3px; }
  .gv { font-size:15px; font-weight:500; color:var(--dmc-text); }
  .gu { font-size:11px; color:var(--dmc-text2); font-weight:400; }
  .infos { display:flex; flex-direction:column; gap:8px; padding:0 16px 12px; border-top:1px solid var(--dmc-border); padding-top:10px; }
  .irow { display:flex; justify-content:space-between; align-items:center; font-size:12px; }
  .ilbl { color:var(--dmc-text2); display:flex; align-items:center; gap:5px; }
  .ival { color:var(--dmc-text); font-weight:500; font-size:12px; max-width:60%; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
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
    this._updState = "idle"; // idle | checking | just_checked | updating
    this._stepLbl  = "";
    this._lang     = null;
    this._ids      = null;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("docker-manager-card: 'entity' is required (e.g. sensor.mycontainer_state)");
    this._config = config;
    if (config.language) this._lang = getLang(config.language);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._lang) this._lang = getLang(hass.language);
    if (!this._ids)  this._ids  = discoverEntities(hass, this._config.entity);
    this._render();
  }

  t(k) { return (this._lang || TRANSLATIONS.en)[k] || k; }

  _s(id) {
    if (!id || !this._hass) return null;
    const e = this._hass.states[id];
    return e ? e.state : null;
  }
  _a(id, attr) {
    if (!id || !this._hass) return null;
    const e = this._hass.states[id];
    return e ? (e.attributes[attr] ?? null) : null;
  }
  _call(domain, service, data) {
    this._hass && this._hass.callService(domain, service, data);
  }
  _name() {
    if (this._config.name) return this._config.name;
    const m = this._config.entity.match(/^sensor\.(.+)_state$/);
    return m ? m[1].replace(/_/g, " ") : this._config.entity;
  }
  _fmt(v) {
    return (v === null || v === undefined || v === "unavailable" || v === "unknown") ? "—" : v;
  }

  _render() {
    if (!this._config.entity || !this._hass) return;

    const root = this.shadowRoot;
    const ids  = this._ids || discoverEntities(this._hass, this._config.entity);

    if (!ids) {
      root.innerHTML = `<style>${STYLES}</style><ha-card><div class="card"><div class="err">${this.t("no_entity")}: ${this._config.entity}</div></div></ha-card>`;
      return;
    }

    const state    = this._s(ids.state) || "unknown";
    const image    = this._s(ids.image) || "";
    const cpu      = this._fmt(this._s(ids.cpu));
    const memMb    = this._fmt(this._s(ids.memory));
    const memPct   = this._fmt(this._s(ids.memory_pct));
    const netUp    = this._fmt(this._s(ids.net_up));
    const netDown  = this._fmt(this._s(ids.net_down));
    const health   = this._fmt(this._s(ids.health));
    const started  = this._s(ids.started);

    const isRunning   = state === "running";
    const updateState = this._s(ids.update);
    const updateAttrs = this._hass.states[ids.update]?.attributes || {};
    const lastCheck   = updateAttrs.last_check || null;
    const updateAvail = updateState === "on";
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

    // Action button
    let aCls = "btn ml", aIco = "mdi:magnify", aLbl = this.t("check_update"), aDis = false;
    if (this._updState === "checking") {
      aCls = "btn busy ml"; aIco = "mdi:loading"; aLbl = this.t("checking"); aDis = true;
    } else if (this._updState === "updating") {
      aCls = "btn busy ml"; aIco = "mdi:loading"; aLbl = this._stepLbl || this.t("step_pull"); aDis = true;
    } else if (this._updState === "just_checked") {
      aCls = "btn uptd ml"; aIco = "mdi:check"; aLbl = this.t("up_to_date"); aDis = true;
    } else if (updateAvail) {
      aCls = "btn upnow ml"; aIco = "mdi:download"; aLbl = this.t("update_now");
    }

    // Icon
    const iconColor = this._config.icon_color || "#1A73E8";
    const iconHTML  = this._config.icon
      ? `<ha-icon icon="${this._config.icon}" style="--mdc-icon-size:22px;color:white"></ha-icon>`
      : WHALE;

    const ssIco = isRunning ? "mdi:stop" : "mdi:play";
    const ssLbl = isRunning ? this.t("stop") : this.t("start");
    const ssCls = isRunning ? "btn danger" : "btn success";

    root.innerHTML = `
      <style>${STYLES}</style>
      <ha-card>
      <div class="card">
        <div class="hdr" id="hdr">
          <div class="ico" style="background:${iconColor}">${iconHTML}</div>
          <div style="flex:1;min-width:0">
            <div class="cname">${this._name()}</div>
            <div class="cimage">${image}</div>
          </div>
          <span class="badge ${state}"><span class="dot"></span>${this.t(state) || state}</span>
          <button class="chevbtn" id="tog" aria-label="toggle">
            <ha-icon icon="mdi:chevron-down" class="chev ${this._expanded ? "open" : ""}"></ha-icon>
          </button>
        </div>

        <div class="ctrls">
          <button class="${ssCls}" id="ss"><ha-icon icon="${ssIco}"></ha-icon>${ssLbl}</button>
          <button class="btn" id="rst"><ha-icon icon="mdi:restart"></ha-icon>${this.t("restart")}</button>
          <button class="${aCls}" id="act" ${aDis ? "disabled" : ""}>
            <ha-icon icon="${aIco}"></ha-icon>${aLbl}
          </button>
        </div>

        <div class="det ${this._expanded ? "open" : ""}" id="det">
          <hr class="sep">
          <div class="grid">
            <div class="gc"><div class="gl">${this.t("cpu")}</div><div class="gv">${cpu}<span class="gu">${cpu !== "—" ? "%" : ""}</span></div></div>
            <div class="gc"><div class="gl">${this.t("memory")}</div><div class="gv">${memMb}<span class="gu">${memMb !== "—" ? " MB" : ""}</span></div></div>
            <div class="gc"><div class="gl">${this.t("memory_pct")}</div><div class="gv">${memPct}<span class="gu">${memPct !== "—" ? "%" : ""}</span></div></div>
            <div class="gc"><div class="gl">${this.t("net_up")}</div><div class="gv">${netUp}<span class="gu">${netUp !== "—" ? " kB/s" : ""}</span></div></div>
            <div class="gc"><div class="gl">${this.t("net_down")}</div><div class="gv">${netDown}<span class="gu">${netDown !== "—" ? " kB/s" : ""}</span></div></div>
            <div class="gc"><div class="gl">${this.t("health")}</div><div class="gv" style="font-size:13px">${health}</div></div>
          </div>
          <div class="infos">
            <div class="irow">
              <span class="ilbl"><ha-icon icon="mdi:clock-outline"></ha-icon>${this.t("started")}</span>
              <span class="ival">${startedStr}</span>
            </div>
            <div class="irow">
              <span class="ilbl"><ha-icon icon="mdi:layers"></ha-icon>${this.t("image")}</span>
              <span class="ival">${image || "—"}</span>
            </div>
          </div>
          <div class="updtxt">${lastCheckStr}</div>
        </div>
      </div>
      </ha-card>
    `;

    this._bind(ids, isRunning, updateAvail, neverChecked);
  }

  _bind(ids, isRunning, updateAvail, neverChecked) {
    const r   = this.shadowRoot;
    const tog = r.getElementById("tog");
    const hdr = r.getElementById("hdr");
    const ss  = r.getElementById("ss");
    const rst = r.getElementById("rst");
    const act = r.getElementById("act");

    const toggleExpand = () => { this._expanded = !this._expanded; this._render(); };
    tog.addEventListener("click", (e) => { e.stopPropagation(); toggleExpand(); });
    hdr.addEventListener("click", toggleExpand);

    ss.addEventListener("click", () => {
      this._call("switch", isRunning ? "turn_off" : "turn_on", { entity_id: ids.sw });
    });

    rst.addEventListener("click", () => {
      this._call("button", "press", { entity_id: ids.restart_btn });
    });

    if (act && !act.disabled) {
      act.addEventListener("click", async () => {
        if (updateAvail && !neverChecked) {
          // Update with step labels
          this._updState = "updating";
          this._call("update", "install", { entity_id: ids.update });
          const steps = [
            [1500, "step_pull"], [1800, "step_pull"], [1200, "step_stop"],
            [1200, "step_remove"], [1200, "step_create"], [1200, "step_start"],
          ];
          for (const [ms, key] of steps) {
            this._stepLbl = this.t(key);
            this._render();
            await new Promise(r => setTimeout(r, ms));
          }
          this._stepLbl = this.t("step_done");
          this._render();
          await new Promise(r => setTimeout(r, 2500));
          this._updState = "idle"; this._stepLbl = "";
          this._render();
        } else {
          // Check
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
