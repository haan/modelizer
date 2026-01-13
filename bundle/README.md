Local server bundle (miniserve)

This folder is a simple "drop-in" local web server for the built site.

Steps:
1) Build the app in the repo root:
   npm run build
2) Copy the build output into this folder:
   - Copy "dist" to "bundle/dist"
3) Download the miniserve binary and place it here:
   - Windows: miniserve.exe
   - macOS/Linux: miniserve
4) Start the server:
   - Windows: double-click start.bat
   - macOS/Linux: ./start.sh

Default URL: http://localhost:4173

Notes:
- miniserve is a standalone binary with no runtime dependencies.
- On Windows you may see a firewall prompt the first time.
