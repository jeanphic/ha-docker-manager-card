# Docker Manager Card

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/jeanphic/ha-docker-manager-card.svg)](https://github.com/jeanphic/ha-docker-manager-card/releases)

Lovelace custom cards for the [Docker Manager](https://github.com/jeanphic/ha-docker-manager) integration.

![Docker Manager Card Preview](https://raw.githubusercontent.com/jeanphic/ha-docker-manager-card/main/preview.png)

Two cards in one file:
- **`docker-manager-card`** — per-container card with stats, controls and update management
- **`docker-overview-card`** — compact single-row global Docker stats with prune button

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
- State badge with color (Running / Stopped / Paused / Restarting…)
- Colored left border and icon by state
- Start / Stop / Restart buttons with real-time feedback (waits for actual state change)
- Smart action button: **Check for update** → **Update now** → **Up to date** → back to **Check**
- Expandable details: CPU, Memory MB/%, Network ↑↓, Started, Image
- Health tile auto-hidden when no HEALTHCHECK configured
- Metric color coding: green / orange / red thresholds for CPU and Memory %
- Restarting animation on icon
- Multi-language: auto-detected from HA

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
| `language` | string | auto | `en`, `fr`, `de`, `es`, `nl` |
| `icon` | string | Docker whale | Custom MDI icon (e.g. `mdi:nginx`) |
| `icon_color` | string | state color | Icon background color override |

### Entity overrides

If entities were renamed in HA, override them individually:

```yaml
type: custom:docker-manager-card
entity: sensor.speedtest_tracker_state_2
entity_switch: switch.my_custom_switch
entity_memory_pct: sensor.speedtest_tracker_memory_2
entity_restart: button.my_restart_btn
entity_check_update: button.my_check_btn
entity_update: update.my_update
entity_cpu: sensor.my_cpu
entity_memory: sensor.my_memory
entity_net_up: sensor.my_net_up
entity_net_down: sensor.my_net_down
entity_health: sensor.my_health
entity_started: sensor.my_started_at
entity_image: sensor.my_image
```

All overrides are optional — auto-discovery is used for any field not specified.

### card_mod support

The card exposes CSS variables for full customization:

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
      /* State icon colors */
      --dmc-icon-running:       #64b5f6;
      --dmc-icon-stopped:       #ef5350;
      --dmc-icon-paused:        #ffa726;
      --dmc-icon-restarting:    #7986cb;
      --dmc-icon-dead:          #78909c;
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

Compact **single-row** card showing global Docker stats and a prune button.

### Usage

```yaml
type: custom:docker-overview-card
name: Docker        # optional
all_unused: false   # true = prune all unused images (not just dangling)
prefix: docker      # optional — prefix of entity IDs (default: "docker")
```

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
      --dmc-btn-prune-bg:    rgba(255,152,0,0.13);
      --dmc-btn-prune-color: #ffb74d;
    }
```

---

## Supported languages

| Code | Language |
|------|----------|
| `en` | English (default) |
| `fr` | Français |
| `de` | Deutsch |
| `es` | Español |
| `nl` | Nederlands |

## Requirements

- [Docker Manager integration](https://github.com/jeanphic/ha-docker-manager) v2.0+
- Home Assistant 2023.6+

## License

[Apache License 2.0](LICENSE)
