#!/usr/bin/env bash
# Publish the site to the IIT Bombay CSE web server (public_html → cse.iitb.ac.in/~<user>/).
# You type your password when ssh asks; nothing is stored. One connection is reused, so it asks once.
# Usage: npm run deploy:cse [-- user@host [web-dir]]
set -euo pipefail
HOST="${1:-25m0779@mars.cse.iitb.ac.in}"
DIR="${2:-public_html}"
cd "$(dirname "$0")/.."

npm run build

mkdir -p "$HOME/.ssh"
SSH="ssh -o ControlMaster=auto -o ControlPath=$HOME/.ssh/cm-%r@%h:%p -o ControlPersist=120"
STAMP=$(date +%Y%m%d-%H%M%S)

echo
echo "== Current ~/$DIR on $HOST =="
$SSH "$HOST" "ls -la ~/$DIR 2>/dev/null || echo '(does not exist yet)'"
echo
read -r -p "Back this up to ~/${DIR}_backup_$STAMP and replace it with the new site? [y/N] " ok
[[ "$ok" == [yY] ]] || { echo "Stopped. Nothing changed."; exit 1; }

$SSH "$HOST" "if [ -d ~/$DIR ]; then cp -a ~/$DIR ~/${DIR}_backup_$STAMP && echo 'Backup saved: ~/${DIR}_backup_$STAMP'; fi"
rsync -rlvz --delete --chmod=D755,F644 -e "$SSH" dist/ "$HOST:$DIR/"
$SSH "$HOST" "chmod 711 ~ 2>/dev/null; chmod 755 ~/$DIR"
$SSH -O exit "$HOST" 2>/dev/null || true
echo
echo "Done. Open https://www.cse.iitb.ac.in/~arnobdeb/ (hard-refresh with Ctrl+Shift+R)."
echo "To undo: ssh $HOST 'rm -rf ~/$DIR && mv ~/${DIR}_backup_$STAMP ~/$DIR'"
