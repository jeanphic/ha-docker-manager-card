/**
 * docker-manager-card.js
 * Lovelace custom card for Docker Manager integration
 * https://github.com/jeanphic/ha-docker-manager-card
 * @version 1.1.0
 */

const CARD_VERSION = "1.1.0";

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
// Auto-discover entities from hass.states
// Match by prefix + unit_of_measurement to resolve duplicates like memory/_2
// ---------------------------------------------------------------------------
function discoverEntities(hass, baseEntity) {
  // Extract prefix: sensor.zigbee2mqtt_state → zigbee2mqtt
  const match = baseEntity.match(/^sensor\.(.+)_state$/);
  if (!match) return null;
  const prefix = match[1]; // e.g. "zigbee2mqtt" or "adguard_home"

  const states = hass.states;
  const find = (domain, suffix) => `${domain}.${prefix}_${suffix}`;

  // For memory: find MB sensor (unit MB) and % sensor (unit %)
  const memMbId   = find("sensor", "memory");
  const memPctId  = find("sensor", "memory_2");

  // Verify which is MB and which is % — swap if needed
  let memMb  = memMbId;
  let memPct = memPctId;

  const memMbState  = states[memMbId];
  const memPctState = states[memPctId];

  if (memMbState && memMbState.attributes.unit_of_measurement === "%") {
    // Swapped — _memory is %, _memory_2 is MB
    memMb  = memPctId;
    memPct = memMbId;
  }
  // If _memory_2 doesn't exist, try finding % sensor by scanning all entities
  if (!states[memPct]) {
    const pctEntity = Object.keys(states).find(id =>
      id.startsWith(`sensor.${prefix}_memory`) &&
      states[id].attributes.unit_of_measurement === "%"
    );
    if (pctEntity) memPct = pctEntity;
  }

  return {
    state:       find("sensor",  "state"),
    image:       find("sensor",  "image"),
    cpu:         find("sensor",  "cpu"),
    memory:      memMb,
    memory_pct:  memPct,
    net_up:      find("sensor",  "network_up"),
    net_down:    find("sensor",  "network_down"),
    health:      find("sensor",  "health"),
    started:     find("sensor",  "started_at"),
    switch:      find("switch",  "container"),
    restart_btn: find("button",  "restart"),
    check_btn:   find("button",  "check_for_update"),
    update:      find("update",  "update"),
  };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const STYLES = `
  :host {
    display: block;
    --dmc-bg: var(--card-background-color, #fff);
    --dmc-text: var(--primary-text-color);
    --dmc-text-secondary: var(--secondary-text-color);
    --dmc-border: var(--divider-color, rgba(0,0,0,0.12));
    --dmc-bg-secondary: var(--secondary-background-color, #f5f5f5);
  }
  .card { background: var(--dmc-bg); border-radius: var(--ha-card-border-radius, 12px); border: 1px solid var(--dmc-border); overflow: hidden; font-family: var(--primary-font-family, sans-serif); }
  .header { display: flex; align-items: center; gap: 12px; padding: 14px 16px 0; cursor: pointer; user-select: none; }
  .icon-wrap { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .name { font-size: 15px; font-weight: 500; color: var(--dmc-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .image-txt { font-size: 11px; color: var(--dmc-text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 20px; flex-shrink: 0; }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .running { background: #EAF3DE; color: #3B6D11; }
  .stopped { background: #FCEBEB; color: #A32D2D; }
  .paused { background: #FAEEDA; color: #854F0B; }
  .restarting { background: #E8EAF6; color: #3949AB; }
  .dead { background: #EEEEEE; color: #616161; }
  .chevron-btn { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--dmc-text-secondary); padding: 4px; display: flex; align-items: center; flex-shrink: 0; }
  .chevron { transition: transform .2s; }
  .chevron.open { transform: rotate(180deg); }
  .controls { display: flex; align-items: center; gap: 6px; padding: 10px 16px 14px; }
  .btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 500; padding: 5px 10px; border-radius: 6px; border: 1px solid var(--dmc-border); background: var(--dmc-bg); color: var(--dmc-text); cursor: pointer; transition: filter 0.15s; }
  .btn:hover:not(:disabled) { filter: brightness(0.94); }
  .btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .btn.danger { border-color: #F09595; color: #A32D2D; }
  .btn.success { border-color: #97C459; color: #3B6D11; }
  .btn.update-now { background: #E6F1FB; border-color: #85B7EB; color: #185FA5; }
  .btn.up-to-date { background: #EAF3DE; border-color: #C0DD97; color: #3B6D11; pointer-events: none; }
  .btn.busy { background: var(--secondary-background-color); color: var(--dmc-text-secondary); pointer-events: none; }
  .btn.push-right { margin-left: auto; }
  ha-icon { --mdc-icon-size: 16px; }
  hr { border: none; border-top: 1px solid var(--dmc-border); margin: 0; }
  .details { display: none; flex-direction: column; }
  .details.open { display: flex; }
  .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; padding: 12px 16px; }
  .stat { background: var(--dmc-bg-secondary); border-radius: 8px; padding: 8px 10px; }
  .stat-label { font-size: 11px; color: var(--dmc-text-secondary); margin-bottom: 3px; }
  .stat-value { font-size: 15px; font-weight: 500; color: var(--dmc-text); }
  .stat-unit { font-size: 11px; color: var(--dmc-text-secondary); font-weight: 400; }
  .info-rows { display: flex; flex-direction: column; gap: 8px; padding: 0 16px 12px; border-top: 1px solid var(--dmc-border); padding-top: 10px; }
  .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
  .info-lbl { color: var(--dmc-text-secondary); display: flex; align-items: center; gap: 5px; }
  .info-val { color: var(--dmc-text); font-weight: 500; font-size: 12px; max-width: 60%; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .update-detail { padding: 8px 16px 12px; font-size: 11px; color: var(--dmc-text-secondary); border-top: 1px solid var(--dmc-border); }
  .error { padding: 16px; color: var(--error-color, red); font-size: 13px; }
`;

const WHALE = `<svg viewBox="0 0 24 18" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fff"><rect x="0" y="0" width="4" height="3" rx="0.5"/><rect x="5" y="0" width="4" height="3" rx="0.5"/><rect x="10" y="0" width="4" height="3" rx="0.5"/><rect x="0" y="4" width="4" height="3" rx="0.5"/><rect x="5" y="4" width="4" height="3" rx="0.5"/><rect x="10" y="4" width="4" height="3" rx="0.5"/><rect x="15" y="4" width="4" height="3" rx="0.5"/><rect x="5" y="8" width="4" height="3" rx="0.5"/><path d="M22,9 C21.5,7 20,6.5 19,7 C18.5,5 17,4 15.5,4.5 C15,3 13.5,2.5 12,3 L12,15 C13,16 20,16 22,13 C23,11.5 22.5,10 22,9 Z"/></svg>`;

// ---------------------------------------------------------------------------
// Card element
// ---------------------------------------------------------------------------
class DockerManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._expanded = false;
    this._updateState = "idle";
    this._stepLabel = "";
    this._lang = null;
    this._ids = null;
  }

  get _root() {
    return this.shadowRoot;
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please define 'entity' (e.g. sensor.mycontainer_state)");
    this._config = config;
    if (config.language) this._lang = getLang(config.language);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._lang) this._lang = getLang(hass.language);
    // Discover entities on first set or if not yet resolved
    if (!this._ids) this._ids = discoverEntities(hass, this._config.entity);
    this._render();
  }

  t(key) { return (this._lang || TRANSLATIONS.en)[key] || key; }

  _s(id) {
    if (!this._hass || !id) return null;
    const e = this._hass.states[id];
    return e ? e.state : null;
  }

  _a(id, attr) {
    if (!this._hass || !id) return null;
    const e = this._hass.states[id];
    return e ? e.attributes[attr] : null;
  }

  _call(domain, service, data = {}) {
    if (this._hass) this._hass.callService(domain, service, data);
  }

  _containerName() {
    if (this._config.name) return this._config.name;
    const m = this._config.entity.match(/^sensor\.(.+)_state$/);
    if (m) return m[1].replace(/_/g, " ");
    return this._config.entity;
  }

  _render() {
    if (!this._config.entity || !this._hass) return;

    const ids = this._ids || discoverEntities(this._hass, this._config.entity);
    if (!ids) {
      this._root.innerHTML = `<style>${STYLES}</style><div class="card"><div class="error">${this.t("no_entity")}: ${this._config.entity}</div></div>`;
      return;
    }

    const state    = this._s(ids.state) || "unknown";
    const image    = this._s(ids.image) || "";
    const cpu      = this._s(ids.cpu);
    const memMb    = this._s(ids.memory);
    const memPct   = this._s(ids.memory_pct);
    const netUp    = this._s(ids.net_up);
    const netDown  = this._s(ids.net_down);
    const health   = this._s(ids.health) || "—";
    const started  = this._s(ids.started);

    const isRunning = state === "running";
    const updateState = this._s(ids.update);
    const updateAttrs = this._hass.states[ids.update]?.attributes || {};
    const lastCheck   = updateAttrs.last_check || null;
    const updateAvail = updateState === "on";
    const neverChecked = !lastCheck;

    // Format started
    let startedStr = "—";
    if (started && !["unavailable","unknown","none"].includes(started)) {
      try { startedStr = new Date(started).toLocaleString(); } catch { startedStr = started; }
    }

    // Last check label
    let lastCheckStr = this.t("never_checked");
    if (lastCheck) {
      try {
        const d = new Date(lastCheck).toLocaleString();
        lastCheckStr = `${this.t("last_checked")}: ${d}`;
        if (updateAvail) lastCheckStr += ` — ${this.t("update_available")}`;
      } catch { lastCheckStr = lastCheck; }
    }

    // Action button
    // "up-to-date" is shown briefly after a check, then reverts to "check"
    // so the user can always re-check manually
    let aClass = "btn check push-right", aIcon = "mdi:magnify", aLabel = this.t("check_update"), aDisabled = false;
    if (this._updateState === "checking") {
      aClass = "btn busy push-right"; aIcon = "mdi:loading"; aLabel = this.t("checking"); aDisabled = true;
    } else if (this._updateState === "updating") {
      aClass = "btn busy push-right"; aIcon = "mdi:loading"; aLabel = this._stepLabel || this.t("step_pull"); aDisabled = true;
    } else if (this._updateState === "just_checked") {
      // Briefly show "up to date" feedback, then revert
      aClass = "btn up-to-date push-right"; aIcon = "mdi:check"; aLabel = this.t("up_to_date"); aDisabled = true;
    } else if (updateAvail) {
      aClass = "btn update-now push-right"; aIcon = "mdi:download"; aLabel = this.t("update_now");
    } else {
      // Default: always allow re-checking, whether checked before or not
      aClass = "btn check push-right"; aIcon = "mdi:magnify"; aLabel = this.t("check_update");
    }

    // Icon
    const iconColor = this._config.icon_color || "#1A73E8";
    const customIcon = this._config.icon;
    const iconHTML = customIcon
      ? `<ha-icon icon="${customIcon}" style="--mdc-icon-size:22px;color:white"></ha-icon>`
      : WHALE;

    const ssIcon  = isRunning ? "mdi:stop" : "mdi:play";
    const ssLabel = isRunning ? this.t("stop") : this.t("start");
    const ssClass = isRunning ? "btn danger" : "btn success";

    const fmt = v => (v === null || v === undefined || v === "unavailable" || v === "unknown") ? "—" : v;

    this._root.innerHTML = `
      <style>${STYLES}</style>
      <div class="card">
        <div class="header" id="hdr">
          <div class="icon-wrap" style="background:${iconColor}">${iconHTML}</div>
          <div style="flex:1;min-width:0">
            <div class="name">${this._containerName()}</div>
            <div class="image-txt">${image}</div>
          </div>
          <span class="badge ${state}">
            <span class="badge-dot"></span>${this.t(state) || state}
          </span>
          <button class="chevron-btn" id="tog">
            <ha-icon icon="mdi:chevron-down" class="chevron ${this._expanded ? "open" : ""}"></ha-icon>
          </button>
        </div>

        <div class="controls">
          <button class="${ssClass}" id="ss"><ha-icon icon="${ssIcon}"></ha-icon>${ssLabel}</button>
          <button class="btn" id="rst"><ha-icon icon="mdi:restart"></ha-icon>${this.t("restart")}</button>
          <button class="${aClass}" id="act" ${aDisabled ? "disabled" : ""}>
            <ha-icon icon="${aIcon}"></ha-icon>${aLabel}
          </button>
        </div>

        <div class="details ${this._expanded ? "open" : ""}" id="det">
          <hr>
          <div class="stats">
            <div class="stat"><div class="stat-label">${this.t("cpu")}</div><div class="stat-value">${fmt(cpu)}<span class="stat-unit">${cpu !== null && cpu !== "—" ? "%" : ""}</span></div></div>
            <div class="stat"><div class="stat-label">${this.t("memory")}</div><div class="stat-value">${fmt(memMb)}<span class="stat-unit">${memMb ? " MB" : ""}</span></div></div>
            <div class="stat"><div class="stat-label">${this.t("memory_pct")}</div><div class="stat-value">${fmt(memPct)}<span class="stat-unit">${memPct ? "%" : ""}</span></div></div>
            <div class="stat"><div class="stat-label">${this.t("net_up")}</div><div class="stat-value">${fmt(netUp)}<span class="stat-unit">${netUp ? " kB/s" : ""}</span></div></div>
            <div class="stat"><div class="stat-label">${this.t("net_down")}</div><div class="stat-value">${fmt(netDown)}<span class="stat-unit">${netDown ? " kB/s" : ""}</span></div></div>
            <div class="stat"><div class="stat-label">${this.t("health")}</div><div class="stat-value" style="font-size:13px">${health}</div></div>
          </div>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-lbl"><ha-icon icon="mdi:clock-outline"></ha-icon>${this.t("started")}</span>
              <span class="info-val">${startedStr}</span>
            </div>
            <div class="info-row">
              <span class="info-lbl"><ha-icon icon="mdi:layers"></ha-icon>${this.t("image")}</span>
              <span class="info-val">${image || "—"}</span>
            </div>
          </div>
          <div class="update-detail">${lastCheckStr}</div>
        </div>
      </div>
    `;

    this._bind(ids, isRunning, updateAvail, neverChecked);
  }

  _bind(ids, isRunning, updateAvail, neverChecked) {
    const tog = this._root.querySelector('#' + ("tog");
    const hdr = this._root.querySelector('#' + ("hdr");
    const ss  = this._root.querySelector('#' + ("ss");
    const rst = this._root.querySelector('#' + ("rst");
    const act = this._root.querySelector('#' + ("act");

    tog.onclick = () => { this._expanded = !this._expanded; this._render(); };
    hdr.onclick = (e) => { if (!e.target.closest("#tog")) { this._expanded = !this._expanded; this._render(); }};

    ss.onclick = () => {
      this._call("switch", isRunning ? "turn_off" : "turn_on", { entity_id: ids.switch });
    };
    rst.onclick = () => {
      this._call("button", "press", { entity_id: ids.restart_btn });
    };

    if (act && !act.disabled) {
      act.onclick = async () => {
        if (updateAvail && !neverChecked) {
          // Update with steps
          this._updateState = "updating";
          this._call("update", "install", { entity_id: ids.update });
          const steps = [[1500,"step_pull"],[1800,"step_pull"],[1200,"step_stop"],[1200,"step_remove"],[1200,"step_create"],[1200,"step_start"]];
          for (const [ms, key] of steps) {
            this._stepLabel = this.t(key);
            this._render();
            await new Promise(r => setTimeout(r, ms));
          }
          this._stepLabel = this.t("step_done");
          this._render();
          await new Promise(r => setTimeout(r, 2500));
          this._updateState = "idle"; this._stepLabel = "";
          this._render();
        } else {
          // Check
          this._updateState = "checking"; this._render();
          this._call("button", "press", { entity_id: ids.check_btn });
          // Wait for HA state to update (check takes a few seconds)
          await new Promise(r => setTimeout(r, 5000));
          // If no update found, show brief "up to date" feedback then revert
          const afterCheck = this._hass.states[ids.update]?.state;
          if (afterCheck !== "on") {
            this._updateState = "just_checked"; this._render();
            await new Promise(r => setTimeout(r, 3000));
          }
          this._updateState = "idle"; this._render();
        }
      };
    }
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
