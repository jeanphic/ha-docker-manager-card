# Docker Manager Card

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

Lovelace custom card for the [Docker Manager](https://github.com/jeanphic/ha-docker-manager) integration.

![Docker Manager Card Preview](https://raw.githubusercontent.com/jeanphic/ha-docker-manager-card/main/preview.png)

## Features

- Container state badge (Running / Stopped / Paused…)
- Start / Stop / Restart buttons
- Smart action button: **Check for update** → **Update now** → **Up to date**
- Expandable detail view: CPU, Memory, Network ↑↓, Health, Started, Image
- Step-by-step progress during update
- Multi-language: auto-detected from HA, or set manually (`en`, `fr`, `de`, `es`, `nl`)
- Auto-discovers all entities from Docker Manager — no manual configuration needed

## Installation via HACS

1. HACS → Frontend → **+** → search "Docker Manager Card"
2. Download and add to your Lovelace resources
3. Restart HA

## Manual installation

Copy `docker-manager-card.js` to `config/www/` and add to Lovelace resources:

```yaml
resources:
  - url: /local/docker-manager-card.js
    type: module
```

## Usage

```yaml
type: custom:docker-manager-card
entity: sensor.nginx_state
```

### Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | **required** | State sensor of the container (`sensor.<name>_state`) |
| `name` | string | auto | Display name |
| `language` | string | auto | Override language: `en`, `fr`, `de`, `es`, `nl` |
| `icon` | string | auto | Custom MDI icon (e.g. `mdi:nginx`) |
| `icon_color` | string | `#1A73E8` | Icon background color |

## Requirements

- [Docker Manager integration](https://github.com/jeanphic/ha-docker-manager) installed
- Home Assistant 2023.6+
