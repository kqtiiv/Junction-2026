#!/usr/bin/env bash
# Copies the generated Swift contract types into the package. Run after `npm run generate` in contracts/.
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
src="$here/../contracts/generated/swift/Contracts.swift"
dst="$here/Sources/Contracts/Contracts.swift"
mkdir -p "$(dirname "$dst")"
cp "$src" "$dst"
echo "synced $(wc -l < "$dst") lines → Sources/Contracts/Contracts.swift"
