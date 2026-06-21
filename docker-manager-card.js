/**
 * docker-manager-card.js
 * Lovelace custom card for Docker Manager integration
 * https://github.com/jeanphic/ha-docker-manager-card
 */

// ---------------------------------------------------------------------------
// i18n translations
// ---------------------------------------------------------------------------
const TRANSLATIONS = {
  en: {
    running: "Running", stopped: "Stopped", paused: "Paused",
    restarting: "Restarting", dead: "Dead", created: "Created",
    stop: "Stop", start: "Start", restart: "Restart",
    check_update: "Check for update", update_now: "Update now",
    up_to_date: "Up to date", checking: "Checking…", never_checked: "Never checked",
    last_checked: "Last checked", update_available: "update available",
    cpu: "CPU", memory: "Memory", memory_pct: "Memory %",
    net_up: "Net ↑", net_down: "Net ↓", health: "Health",
    started: "Started", container_id: "ID", image: "Image",
    step_pull: "Pulling image…", step_stop: "Stopping…",
    step_remove: "Removing…", step_create: "Creating…",
    step_start: "Starting…", step_done: "Update complete",
    no_entity: "Entity not found",
  },
  fr: {
    running: "En cours", stopped: "Arrêté", paused: "En pause",
    restarting: "Redémarrage", dead: "Mort", created: "Créé",
    stop: "Arrêter", start: "Démarrer", restart: "Redémarrer",
    check_update: "Vérifier", update_now: "Mettre à jour",
    up_to_date: "À jour", checking: "Vérification…", never_checked: "Jamais vérifié",
    last_checked: "Dernière vérification", update_available: "mise à jour disponible",
    cpu: "CPU", memory: "Mémoire", memory_pct: "Mémoire %",
    net_up: "Réseau ↑", net_down: "Réseau ↓", health: "Santé",
    started: "Démarré le", container_id: "ID", image: "Image",
    step_pull: "Téléchargement…", step_stop: "Arrêt…",
    step_remove: "Suppression…", step_create: "Création…",
    step_start: "Démarrage…", step_done: "Mise à jour terminée",
    no_entity: "Entité introuvable",
  },
  de: {
    running: "Läuft", stopped: "Gestoppt", paused: "Pausiert",
    restarting: "Neustart", dead: "Tot", created: "Erstellt",
    stop: "Stoppen", start: "Starten", restart: "Neustart",
    check_update: "Prüfen", update_now: "Aktualisieren",
    up_to_date: "Aktuell", checking: "Prüfe…", never_checked: "Nie geprüft",
    last_checked: "Zuletzt geprüft", update_available: "Update verfügbar",
    cpu: "CPU", memory: "Speicher", memory_pct: "Speicher %",
    net_up: "Netz ↑", net_down: "Netz ↓", health: "Status",
    started: "Gestartet", container_id: "ID", image: "Image",
    step_pull: "Image laden…", step_stop: "Stoppe…",
    step_remove: "Entferne…", step_create: "Erstelle…",
    step_start: "Starte…", step_done: "Aktualisierung abgeschlossen",
    no_entity: "Entität nicht gefunden",
  },
  es: {
    running: "Ejecutando", stopped: "Detenido", paused: "En pausa",
    restarting: "Reiniciando", dead: "Muerto", created: "Creado",
    stop: "Detener", start: "Iniciar", restart: "Reiniciar",
    check_update: "Verificar", update_now: "Actualizar",
    up_to_date: "Al día", checking: "Verificando…", never_checked: "Nunca verificado",
    last_checked: "Última verificación", update_available: "actualización disponible",
    cpu: "CPU", memory: "Memoria", memory_pct: "Memoria %",
    net_up: "Red ↑", net_down: "Red ↓", health: "Salud",
    started: "Iniciado", container_id: "ID", image: "Imagen",
    step_pull: "Descargando…", step_stop: "Deteniendo…",
    step_remove: "Eliminando…", step_create: "Creando…",
    step_start: "Iniciando…", step_done: "Actualización completada",
    no_entity: "Entidad no encontrada",
  },
  nl: {
    running: "Actief", stopped: "Gestopt", paused: "Gepauzeerd",
    restarting: "Herstart", dead: "Dood", created: "Aangemaakt",
    stop: "Stoppen", start: "Starten", restart: "Herstarten",
    check_update: "Controleren", update_now: "Bijwerken",
    up_to_date: "Up-to-date", checking: "Controleren…", never_checked: "Nooit gecontroleerd",
    last_checked: "Laatste controle", update_available: "update beschikbaar",
    cpu: "CPU", memory: "Geheugen", memory_pct: "Geheugen %",
    net_up: "Net ↑", net_down: "Net ↓", health: "Status",
    started: "Gestart", container_id: "ID", image: "Image",
    step_pull: "Image laden…", step_stop: "Stoppen…",
    step_remove: "Verwijderen…", step_create: "Aanmaken…",
    step_start: "Starten…", step_done: "Bijwerken voltooid",
    no_entity: "Entiteit niet gevonden",
  },
};

function getTranslations(lang) {
  if (!lang) return TRANSLATIONS.en;
  const base = lang.split("-")[0].toLowerCase();
  return TRANSLATIONS[base] || TRANSLATIONS.en;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const CARD_STYLES = `
  :host { display: block; }
  .card {
    background: var(--card-background-color, var(--ha-card-background, #fff));
    border-radius: var(--ha-card-border-radius, 12px);
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    overflow: hidden;
    font-family: var(--primary-font-family, sans-serif);
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px 0;
    cursor: pointer;
    user-select: none;
  }
  .docker-icon {
    width: 36px; height: 36px;
    border-radius: 8px;
    background: var(--primary-color, #1A73E8);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .container-name {
    font-size: 15px; font-weight: 500;
    color: var(--primary-text-color);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .container-image {
    font-size: 11px; color: var(--secondary-text-color);
    margin-top: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 500;
    padding: 3px 8px; border-radius: 20px; flex-shrink: 0;
  }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .badge.running { background: #EAF3DE; color: #3B6D11; }
  .badge.stopped { background: #FCEBEB; color: #A32D2D; }
  .badge.paused  { background: #FAEEDA; color: #854F0B; }
  .badge.restarting { background: #E8EAF6; color: #3949AB; }
  .badge.dead    { background: #EEEEEE; color: #616161; }
  .chevron-btn {
    margin-left: auto; background: none; border: none;
    cursor: pointer; color: var(--secondary-text-color);
    padding: 4px; display: flex; align-items: center; flex-shrink: 0;
  }
  .chevron { transition: transform .2s; font-size: 20px; }
  .chevron.open { transform: rotate(180deg); }
  .compact-controls {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px 14px;
  }
  .btn {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 500;
    padding: 5px 10px; border-radius: 6px;
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    cursor: pointer; transition: background 0.15s;
  }
  .btn:hover { filter: brightness(0.95); }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn.danger { border-color: #F09595; color: #A32D2D; }
  .btn.success { border-color: #97C459; color: #3B6D11; }
  .btn.check { border-color: var(--divider-color); }
  .btn.update-now { background: #E6F1FB; border-color: #85B7EB; color: #185FA5; }
  .btn.up-to-date { background: #EAF3DE; border-color: #C0DD97; color: #3B6D11; pointer-events: none; }
  .btn.busy { background: var(--secondary-background-color); color: var(--secondary-text-color); pointer-events: none; }
  .btn.push-right { margin-left: auto; }
  ha-icon { --mdc-icon-size: 16px; }
  .divider { border: none; border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08)); margin: 0; }
  .details { display: none; flex-direction: column; }
  .details.open { display: flex; }
  .stats-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 8px; padding: 12px 16px;
  }
  .stat-card {
    background: var(--secondary-background-color, #f5f5f5);
    border-radius: 8px; padding: 8px 10px;
  }
  .stat-label { font-size: 11px; color: var(--secondary-text-color); margin-bottom: 3px; }
  .stat-value { font-size: 15px; font-weight: 500; color: var(--primary-text-color); }
  .stat-unit { font-size: 11px; color: var(--secondary-text-color); font-weight: 400; }
  .info-rows {
    display: flex; flex-direction: column; gap: 8px;
    padding: 0 16px 12px; border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
    padding-top: 10px;
  }
  .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
  .info-label { color: var(--secondary-text-color); display: flex; align-items: center; gap: 5px; }
  .info-value { color: var(--primary-text-color); font-weight: 500; font-size: 12px; }
  .update-detail {
    padding: 8px 16px 12px;
    font-size: 11px; color: var(--secondary-text-color);
    border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
  }
  .error { padding: 16px; color: var(--error-color, red); font-size: 13px; }
`;

// ---------------------------------------------------------------------------
// Docker whale SVG icon
// ---------------------------------------------------------------------------
const WHALE_SVG = `
<svg viewBox="0 0 24 18" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fff">
  <rect x="0" y="0" width="4" height="3" rx="0.5"/>
  <rect x="5" y="0" width="4" height="3" rx="0.5"/>
  <rect x="10" y="0" width="4" height="3" rx="0.5"/>
  <rect x="0" y="4" width="4" height="3" rx="0.5"/>
  <rect x="5" y="4" width="4" height="3" rx="0.5"/>
  <rect x="10" y="4" width="4" height="3" rx="0.5"/>
  <rect x="15" y="4" width="4" height="3" rx="0.5"/>
  <rect x="5" y="8" width="4" height="3" rx="0.5"/>
  <path d="M22,9 C21.5,7 20,6.5 19,7 C18.5,5 17,4 15.5,4.5 C15,3 13.5,2.5 12,3 L12,15 C13,16 20,16 22,13 C23,11.5 22.5,10 22,9 Z"/>
</svg>`;

// ---------------------------------------------------------------------------
// Custom element
// ---------------------------------------------------------------------------
class DockerManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._expanded = false;
    this._updateState = "idle"; // idle | checking | updating
    this._stepLabel = "";
    this._lang = null;
  }

  // Called by HA to set config from Lovelace YAML
  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define an entity (e.g. sensor.mycontainer_state)");
    }
    this._config = config;
    // Language: explicit config > HA language (set later in set hass) > en
    if (config.language) {
      this._lang = getTranslations(config.language);
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // Auto-detect language from HA if not set explicitly
    if (!this._config.language && !this._lang) {
      this._lang = getTranslations(hass.language);
    }
    this._render();
  }

  t(key) {
    return (this._lang || TRANSLATIONS.en)[key] || key;
  }

  // Derive container name from entity_id prefix
  _containerName() {
    return this._config.name || this._entityId().split(".")[1].replace(/_state$/, "").replace(/_/g, " ");
  }

  _entityId() {
    return this._config.entity;
  }

  // Build entity ids from state entity
  _ids() {
    const base = this._entityId().replace(/sensor\./, "").replace(/_state$/, "");
    return {
      state:        `sensor.${base}_state`,
      image:        `sensor.${base}_image`,
      cpu:          `sensor.${base}_cpu`,
      memory:       `sensor.${base}_memory`,
      memory_pct:   `sensor.${base}_memory`,
      net_up:       `sensor.${base}_network_up`,
      net_down:     `sensor.${base}_network_down`,
      health:       `sensor.${base}_health`,
      started:      `sensor.${base}_started_at`,
      switch:       `switch.${base}_container`,
      restart_btn:  `button.${base}_restart`,
      check_btn:    `button.${base}_check_for_update`,
      update:       `update.${base}_update`,
    };
  }

  _stateOf(entityId) {
    if (!this._hass) return null;
    const s = this._hass.states[entityId];
    return s ? s.state : null;
  }

  _attrOf(entityId, attr) {
    if (!this._hass) return null;
    const s = this._hass.states[entityId];
    return s ? s.attributes[attr] : null;
  }

  _callService(domain, service, data = {}) {
    if (this._hass) this._hass.callService(domain, service, data);
  }

  _render() {
    if (!this._config.entity) return;

    const ids = this._ids();
    const state = this._stateOf(ids.state);
    const image = this._stateOf(ids.image) || "";
    const cpu   = this._stateOf(ids.cpu) || "—";
    const memMb = this._stateOf(ids.memory) || "—";
    const memPct = this._attrOf(ids.memory, "unit_of_measurement") === "MB"
      ? "—" : this._stateOf(ids.memory) || "—";
    const netUp   = this._stateOf(ids.net_up) || "—";
    const netDown = this._stateOf(ids.net_down) || "—";
    const health  = this._stateOf(ids.health) || "—";
    const started = this._stateOf(ids.started) || null;
    const isRunning = state === "running";
    const isPaused  = state === "paused";

    // Update entity
    const updateState = this._stateOf(ids.update); // "on" = update available
    const updateAttrs = this._hass?.states[ids.update]?.attributes || {};
    const lastCheck   = updateAttrs.last_check || null;
    const updateAvailable = updateState === "on";
    const neverChecked = !lastCheck;

    // Format started_at
    let startedStr = "—";
    if (started && started !== "unavailable" && started !== "unknown") {
      try { startedStr = new Date(started).toLocaleString(); } catch { startedStr = started; }
    }

    // Format last check
    let lastCheckStr = this.t("never_checked");
    if (lastCheck) {
      try {
        lastCheckStr = `${this.t("last_checked")}: ${new Date(lastCheck).toLocaleString()}`;
        if (updateAvailable) lastCheckStr += ` — ${this.t("update_available")}`;
      } catch { lastCheckStr = lastCheck; }
    }

    // Action button state
    let actionBtnClass = "btn check push-right";
    let actionBtnIcon = "mdi:magnify";
    let actionBtnLabel = this.t("check_update");
    let actionBtnDisabled = false;

    if (this._updateState === "checking") {
      actionBtnClass = "btn busy push-right";
      actionBtnIcon = "mdi:loading";
      actionBtnLabel = this.t("checking");
      actionBtnDisabled = true;
    } else if (this._updateState === "updating") {
      actionBtnClass = "btn busy push-right";
      actionBtnIcon = "mdi:loading";
      actionBtnLabel = this._stepLabel || this.t("step_pull");
      actionBtnDisabled = true;
    } else if (updateAvailable) {
      actionBtnClass = "btn update-now push-right";
      actionBtnIcon = "mdi:download";
      actionBtnLabel = this.t("update_now");
    } else if (!neverChecked) {
      actionBtnClass = "btn up-to-date push-right";
      actionBtnIcon = "mdi:check";
      actionBtnLabel = this.t("up_to_date");
    }

    // Badge
    const badgeClass = `badge ${state || "dead"}`;
    const badgeLabel = this.t(state || "dead");

    // Start/Stop button
    const ssIcon  = isRunning ? "mdi:stop" : "mdi:play";
    const ssLabel = isRunning ? this.t("stop") : this.t("start");
    const ssBtnClass = isRunning ? "btn danger" : "btn success";

    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLES}</style>
      <div class="card">
        <div class="card-header" id="header">
          <div class="docker-icon">${WHALE_SVG}</div>
          <div style="flex:1;min-width:0">
            <div class="container-name">${this._containerName()}</div>
            <div class="container-image">${image}</div>
          </div>
          <span class="${badgeClass}">
            <span class="badge-dot"></span>${badgeLabel}
          </span>
          <button class="chevron-btn" id="toggle-btn" aria-label="Toggle details">
            <ha-icon icon="mdi:chevron-down" class="chevron ${this._expanded ? "open" : ""}"></ha-icon>
          </button>
        </div>

        <div class="compact-controls">
          <button class="${ssBtnClass}" id="ss-btn">
            <ha-icon icon="${ssIcon}"></ha-icon>${ssLabel}
          </button>
          <button class="btn" id="restart-btn">
            <ha-icon icon="mdi:restart"></ha-icon>${this.t("restart")}
          </button>
          <button class="${actionBtnClass}" id="action-btn" ${actionBtnDisabled ? "disabled" : ""}>
            <ha-icon icon="${actionBtnIcon}"></ha-icon>${actionBtnLabel}
          </button>
        </div>

        <div class="details ${this._expanded ? "open" : ""}" id="details">
          <hr class="divider">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">${this.t("cpu")}</div>
              <div class="stat-value">${cpu}<span class="stat-unit">%</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${this.t("memory")}</div>
              <div class="stat-value">${memMb}<span class="stat-unit">MB</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${this.t("memory_pct")}</div>
              <div class="stat-value">${memPct}<span class="stat-unit">%</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${this.t("net_up")}</div>
              <div class="stat-value">${netUp}<span class="stat-unit">kB/s</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${this.t("net_down")}</div>
              <div class="stat-value">${netDown}<span class="stat-unit">kB/s</span></div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${this.t("health")}</div>
              <div class="stat-value" style="font-size:13px">${health}</div>
            </div>
          </div>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-label">
                <ha-icon icon="mdi:clock-outline"></ha-icon>${this.t("started")}
              </span>
              <span class="info-value">${startedStr}</span>
            </div>
            <div class="info-row">
              <span class="info-label">
                <ha-icon icon="mdi:layers"></ha-icon>${this.t("image")}
              </span>
              <span class="info-value" style="font-size:11px">${image}</span>
            </div>
          </div>
          <div class="update-detail">${lastCheckStr}</div>
        </div>
      </div>
    `;

    this._bindEvents(ids, isRunning, updateAvailable, neverChecked);
  }

  _bindEvents(ids, isRunning, updateAvailable, neverChecked) {
    // Toggle expand
    this.shadowRoot.getElementById("toggle-btn").addEventListener("click", () => {
      this._expanded = !this._expanded;
      this._render();
    });
    this.shadowRoot.getElementById("header").addEventListener("click", (e) => {
      if (e.target.closest("#toggle-btn")) return;
      this._expanded = !this._expanded;
      this._render();
    });

    // Start / Stop
    this.shadowRoot.getElementById("ss-btn").addEventListener("click", () => {
      if (isRunning) {
        this._callService("switch", "turn_off", { entity_id: ids.switch });
      } else {
        this._callService("switch", "turn_on", { entity_id: ids.switch });
      }
    });

    // Restart
    this.shadowRoot.getElementById("restart-btn").addEventListener("click", () => {
      this._callService("button", "press", { entity_id: ids.restart_btn });
    });

    // Action button: check / update
    const actionBtn = this.shadowRoot.getElementById("action-btn");
    if (!actionBtn.disabled) {
      actionBtn.addEventListener("click", async () => {
        if (updateAvailable && !neverChecked) {
          // Update flow with step labels
          this._updateState = "updating";
          const steps = [
            [1200, "step_pull"], [2000, "step_stop"],
            [1500, "step_remove"], [1500, "step_create"], [1500, "step_start"],
          ];
          this._callService("update", "install", { entity_id: ids.update });
          for (const [delay, key] of steps) {
            this._stepLabel = this.t(key);
            this._render();
            await new Promise(r => setTimeout(r, delay));
          }
          this._stepLabel = this.t("step_done");
          this._render();
          await new Promise(r => setTimeout(r, 2000));
          this._updateState = "idle";
          this._stepLabel = "";
          this._render();
        } else {
          // Check for update
          this._updateState = "checking";
          this._render();
          this._callService("button", "press", { entity_id: ids.check_btn });
          // Wait 5s then let HA state update re-render
          await new Promise(r => setTimeout(r, 5000));
          this._updateState = "idle";
          this._render();
        }
      });
    }
  }

  // Card size hint for HA layout
  getCardSize() {
    return this._expanded ? 5 : 2;
  }

  // Editor stub (future)
  static getConfigElement() {
    return document.createElement("docker-manager-card-editor");
  }

  static getStubConfig() {
    return { entity: "sensor.mycontainer_state" };
  }
}

customElements.define("docker-manager-card", DockerManagerCard);

// Register card with HACS/HA frontend
window.customCards = window.customCards || [];
window.customCards.push({
  type: "docker-manager-card",
  name: "Docker Manager Card",
  description: "Monitor and control a Docker container from Home Assistant",
  preview: false,
  documentationURL: "https://github.com/jeanphic/ha-docker-manager-card",
});
