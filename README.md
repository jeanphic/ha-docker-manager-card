# Docker Manager Card

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/jeanphic/ha-docker-manager-card.svg)](https://github.com/jeanphic/ha-docker-manager-card/releases)

Lovelace custom cards for the [Docker Manager](https://github.com/jeanphic/ha-docker-manager) integration.

![Docker Manager Card Preview](https://raw.githubusercontent.com/jeanphic/ha-docker-manager-card/main/preview.png)

Three cards in one file:
- **`docker-manager-card`** — per-container card with controls and expandable stats
- **`docker-overview-card`** — compact 2-row global Docker stats with prune button
- **`docker-multi-overview-card`** — multiple Docker hosts in one card

---

## Installation via HACS

1. HACS → Frontend → **+** → search "Docker Manager Card"
2. Install and add to Lovelace resources
3. Restart HA

## Manual installation

Copy `docker-manager-card.js` to `config/www/` and add to Lovelace resources:

```yaml
resources:
  - url: /local/docker-manager-card.js
    type: module
```

---

## docker-manager-card

Per-container card with compact view and expandable stats.

### Features
- State badge with colored left border and icon (Running / Stopped / Paused / Restarting…)
- **Stop** / **Start** / **Restart** / **Pause** / **Resume** buttons — adaptive (icon+label on wide, icon-only on narrow)
- Confirmation dialog before Stop and Update
- Smart action button: **Check** → **Update** → **Up to date** → back to **Check**
- Real-time feedback on all actions (polls actual state, timeout 30s)
- Expandable details: CPU %, Memory MB/%, Network ↑↓, Health, Started, Image
- Health tile auto-hidden when no HEALTHCHECK configured
- Metric color coding: CPU and Memory % colored by threshold
- Multi-language: auto-detected from HA (en, fr, de, es, nl)

### Usage

```yaml
type: custom:docker-manager-card
entity: sensor.nginx_state
```

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **required** | State sensor (`sensor.<name>_state` or `sensor.<name>_state_2`) |
| `name` | string | auto | Display name |
| `language` | string | auto | Override: `en`, `fr`, `de`, `es`, `nl` |
| `icon` | string | Docker whale | Custom MDI icon (e.g. `mdi:nginx`) |
| `icon_color` | string | state color | Icon background color override |

### Entity overrides

If entities were renamed in HA, override them individually:

```yaml
type: custom:docker-manager-card
entity: sensor.speedtest_tracker_state_2
entity_switch: switch.my_custom_switch
entity_restart: button.my_restart_btn
entity_pause: button.my_pause_btn
entity_check_update: button.my_check_btn
entity_update: update.my_update
entity_cpu: sensor.my_cpu
entity_memory: sensor.my_memory
entity_memory_pct: sensor.my_memory_2
entity_net_up: sensor.my_net_up
entity_net_down: sensor.my_net_down
entity_health: sensor.my_health
entity_started: sensor.my_started_at
entity_image: sensor.my_image
```

### card_mod support

```yaml
card_mod:
  style: |
    :host {
      --dmc-bg:                 #cecece40;
      --dmc-text:               #ffffff;
      --dmc-text2:              rgba(255,255,255,0.6);
      --dmc-border:             rgba(255,255,255,0.1);
      --dmc-bg2:                rgba(255,255,255,0.08);
      /* Button colors */
      --dmc-btn-stop-color:     #e57373;
      --dmc-btn-start-color:    #81c784;
      --dmc-btn-restart-color:  #cfd8dc;
      --dmc-btn-pause-color:    #ffb74d;
      --dmc-btn-update-color:   #90caf9;
      /* State icon colors */
      --dmc-icon-running:       #64b5f6;
      --dmc-icon-stopped:       #ef5350;
      --dmc-icon-paused:        #ffa726;
      --dmc-icon-restarting:    #7986cb;
      /* State border colors */
      --dmc-border-running:     #64b5f6;
      --dmc-border-stopped:     #ef5350;
      /* Metric thresholds */
      --dmc-metric-ok:          #80cbc4;
      --dmc-metric-warning:     #ffb74d;
      --dmc-metric-danger:      #ef5350;
    }
```

---

## docker-overview-card

Compact 2-row card showing global Docker stats and a prune button.

### Usage

```yaml
type: custom:docker-overview-card
name: Docker
suffix: ""          # optional — for additional instances: "_2", "_3"…
all_unused: false   # true = prune all unused images (not just dangling)
tap_action:
  action: navigate
  navigation_path: /lovelace/docker
hold_action:
  action: none
```

### Supported tap_action / hold_action

| Action | Description |
|--------|-------------|
| `navigate` | Navigate to a Lovelace view (`navigation_path`) |
| `call-service` | Call a HA service (`service`, `service_data`) |
| `url` | Open a URL (`url`) |
| `more-info` | Open more-info dialog (`entity`) |
| `none` | Do nothing (default) |

### card_mod support

```yaml
card_mod:
  style: |
    :host {
      --dmc-bg:              #cecece40;
      --dmc-ov-running:      #64b5f6;
      --dmc-ov-stopped:      #ef5350;
      --dmc-ov-paused:       #ffa726;
      --dmc-ov-images:       #90caf9;
      --dmc-btn-prune-color: #ffb74d;
    }
```

---

## docker-multi-overview-card

Multiple Docker hosts displayed in a single card. Each host shows a stats grid identical to `docker-overview-card`. Unreachable hosts are detected automatically.

### Usage

```yaml
type: custom:docker-multi-overview-card
name: Docker Hosts
all_unused: false     # passed to prune service
prune_host: 0         # index of host to prune (default: 0 = first)
hosts:
  - name: Local
    prefix: docker
    suffix: ""
  - name: Serveur distant
    prefix: docker
    suffix: "_2"
```

### Host options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | prefix | Display name for this host |
| `prefix` | string | `docker` | Entity ID prefix |
| `suffix` | string | `""` | Entity ID suffix (e.g. `_2` for second instance) |

---

## Requirements

- [Docker Manager integration](https://github.com/jeanphic/ha-docker-manager) v2.8+
- Home Assistant 2023.6+

## License

[Apache License 2.0](LICENSE)
