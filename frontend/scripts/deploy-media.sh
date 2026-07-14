#!/usr/bin/env bash
# Trien khai anh/video (frontend/public/media/) len VPS, TACH BIET khoi git/CI-CD
# vi file qua lon (video 100-185MB/file, vuot gioi han 100MB cua GitHub).
#
# Cach dung:
#   SSH_KEY=/path/to/private_key ./deploy-media.sh
#
# Thu tu day du (xem README.md muc "Web app Infographic + Video"):
#   1. npm run build:media          (sinh frontend/public/media/ + HTML + manifest)
#   2. ./frontend/scripts/deploy-media.sh   (script nay - day media len VPS)
#   3. git add -A && git commit && git push   (CI/CD publish HTML/manifest)

set -euo pipefail

VPS_HOST="${VPS_HOST:-123.30.48.104}"
VPS_USER="${VPS_USER:-root}"
VPS_DEST="${VPS_DEST:-/var/www/thuongduc/backend/frontend/public/media}"
SSH_KEY="${SSH_KEY:?Can bien SSH_KEY tro toi private key co quyen SSH vao VPS}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_MEDIA_DIR="$SCRIPT_DIR/../public/media"

echo "== Kiem tra dung luong dia con trong tren VPS =="
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=accept-new "$VPS_USER@$VPS_HOST" "df -h /var/www"

echo "== Tao thu muc dich tren VPS =="
ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "mkdir -p '$VPS_DEST'"

echo "== Day anh/video len VPS (scp -r) =="
scp -i "$SSH_KEY" -r "$LOCAL_MEDIA_DIR/infographic" "$VPS_USER@$VPS_HOST:$VPS_DEST/"
scp -i "$SSH_KEY" -r "$LOCAL_MEDIA_DIR/video" "$VPS_USER@$VPS_HOST:$VPS_DEST/"

echo "== Cai ffmpeg tren VPS (neu chua co) va remux video (+faststart) =="
ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" bash -s <<'REMOTE_SCRIPT'
set -e
if ! command -v ffmpeg >/dev/null 2>&1; then
  apt-get update -qq && apt-get install -y -qq ffmpeg
fi
find /var/www/thuongduc/backend/frontend/public/media/video -name "*.mp4" -print0 | while IFS= read -r -d '' f; do
  tmp="${f%.mp4}.faststart.mp4"
  # -nostdin: bat buoc, neu khong ffmpeg se doc lem stdin cua vong lap "read",
  # lam hong ten file doc duoc o lan lap ke tiep (loi bash kinh dien).
  ffmpeg -nostdin -y -loglevel error -i "$f" -c copy -movflags +faststart "$tmp"
  mv "$tmp" "$f"
  echo "remux xong: $f"
done
REMOTE_SCRIPT

echo "== Kiem tra dung luong dia sau khi upload =="
ssh -i "$SSH_KEY" "$VPS_USER@$VPS_HOST" "df -h /var/www"

echo "Hoan tat. Kiem tra Range request:"
echo '  curl -I -H "Range: bytes=0-1023" https://thuongduc.dxvtech.vn/media/video/<cat>/<item>.mp4'
