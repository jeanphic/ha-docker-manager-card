# Docker Manager Card

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

Lovelace custom card for the [Docker Manager](https://github.com/jeanphic/ha-docker-manager) integration.

Displays a single Docker container with compact view and expandable stats.

## Features

- Container state badge (Running / Stopped / Paused…)
- Start / Stop / Restart buttons
- Smart action button: **Check for update** → **Update now** → **Up to date**
- Expandable detail view: CPU, Memory, Network ↑↓, Health, Started, Image
- Last update check date and status
- Step-by-step progress during update
- Multi-language: auto-detected from HA, or set manually

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
| `name` | string | auto | Display name (default: derived from entity) |
| `language` | string | auto | Override language: `en`, `fr`, `de`, `es`, `nl` |

### Examples

```yaml
# Auto language (from HA settings)
type: custom:docker-manager-card
entity: sensor.nginx_state

# Force French
type: custom:docker-manager-card
entity: sensor.zigbee2mqtt_state
name: Zigbee2MQTT
language: fr

# Force English
type: custom:docker-manager-card
entity: sensor.homeassistant_state
language: en
```

## Supported languages

| Code | Language |
|------|----------|
| `en` | English (default) |
| `fr` | Français |
| `de` | Deutsch |
| `es` | Español |
| `nl` | Nederlands |

## Requirements

- [Docker Manager integration](https://github.com/jeanphic/ha-docker-manager) installed
- Home Assistant 2023.6+
