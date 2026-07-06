# Sunstone Time Configuration

The Sunstone web interface can display timestamps using either the browser's timezone or the server's OS timezone.

## Configuration

Edit `/etc/one/fireedge/sunstone/sunstone-server.conf` and set the following options under `[sunstone]`:

- `time_mode`: Values `browser` (default) or `os`.
  - `browser`: Timestamps are displayed using the browser's local timezone.
  - `os`: Timestamps are displayed using the server's configured timezone (e.g., from `timedatectl`).
- `time_format`: Used when `time_mode = os`. Values `24h` (default) or `12h`. If not set, it is automatically detected from the server's `LC_TIME` locale.

## Example

```ini
[sunstone]
time_mode = os
time_format = 24h
```

After changing the configuration, restart FireEdge:

```bash
systemctl restart fireedge
```
