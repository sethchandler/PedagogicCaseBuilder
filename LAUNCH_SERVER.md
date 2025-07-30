# Server Launch Guide - IMPORTANT! Read this when server won't start

## The Problem
The Python HTTP server keeps dying because:
1. It's killed by command timeouts when run through automation tools
2. It's not running as a background process
3. Port binding issues aren't clearly reported

## Quick Fix - Manual Launch (Most Reliable)
Open a **separate terminal window** and run:
```bash
cd /Users/Seth/dev/PedagogicCaseBuilder/dist
python3 -m http.server 8000
```

Then access: http://localhost:8000

Keep this terminal window open while working!

## Alternative Solutions

### Option 1: Use Node's serve package (if installed)
```bash
npx serve dist -p 8000
```

### Option 2: Use Python with nohup (background process)
```bash
cd /Users/Seth/dev/PedagogicCaseBuilder/dist
nohup python3 -m http.server 8000 > server.log 2>&1 &
echo $! > server.pid
```

To stop:
```bash
kill $(cat server.pid)
```

### Option 3: Use screen/tmux (if available)
```bash
screen -dmS pcb-server bash -c 'cd /Users/Seth/dev/PedagogicCaseBuilder/dist && python3 -m http.server 8000'
```

To view: `screen -r pcb-server`
To detach: `Ctrl+A` then `D`
To stop: `screen -X -S pcb-server quit`

## Debugging Port Issues

Check if port 8000 is in use:
```bash
lsof -i :8000
# or
netstat -an | grep 8000
```

Kill process using port 8000:
```bash
lsof -ti:8000 | xargs kill -9
```

## Development Best Practices

1. **Always use a separate terminal** for the server
2. **Don't rely on automated tools** to manage long-running processes
3. **Consider using Vite's dev server** for development:
   ```bash
   npm run dev
   ```
   This auto-reloads on changes!

4. **For production builds**, use a proper web server like nginx or Apache

## Why This Happens
- Command line tools have timeouts that kill long-running processes
- Python's http.server is meant for development, not production
- Background process management is OS-specific and complex
- Port binding can persist after improper shutdown

## The Real Solution
For development, always use:
```bash
npm run dev
```

This gives you:
- Hot module replacement (no manual refresh!)
- Better error messages
- Automatic port handling
- No process management issues

Only use `python3 -m http.server` for quick production build testing.