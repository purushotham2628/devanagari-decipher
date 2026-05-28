#!/bin/sh
set -e

HOST="${1:-http://backend:8000/health}"
TIMEOUT="${2:-60}"

echo "Waiting for ${HOST} (timeout ${TIMEOUT}s)..."
count=0
while [ "$count" -lt "$TIMEOUT" ]; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$HOST" || true)
  if [ "$status" = "200" ]; then
    echo "${HOST} is available"
    shift 2 || true
    if [ "$#" -gt 0 ]; then
      exec "$@"
    fi
    exit 0
  fi
  count=$((count+1))
  sleep 1
done

echo "Timeout waiting for ${HOST}"
exit 1
