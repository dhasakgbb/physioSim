#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)
PROTO_DIR="$ROOT_DIR/proto"
GO_OUT_DIR="$ROOT_DIR/backend"
TS_OUT_DIR="$ROOT_DIR/frontend/src/app/generated"
PROTO_FILE="$PROTO_DIR/physiosim/v1/engine.proto"

if command -v go >/dev/null 2>&1; then
  GOBIN_DIR="$(go env GOPATH 2>/dev/null)/bin"
  if [[ -d "$GOBIN_DIR" ]]; then
    export PATH="$GOBIN_DIR:$PATH"
  fi
fi

require_binary() {
  local binary=$1
  local hint=$2
  if ! command -v "$binary" >/dev/null 2>&1; then
    echo "Missing dependency: $binary" >&2
    if [[ -n "$hint" ]]; then
      echo "Install via: $hint" >&2
    fi
    exit 1
  fi
}

require_binary protoc "https://grpc.io/docs/protoc-installation/"
require_binary protoc-gen-go "go install google.golang.org/protobuf/cmd/protoc-gen-go@latest"
require_binary protoc-gen-go-grpc "go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest"
require_binary protoc-gen-grpc-web "https://github.com/grpc/grpc-web#code-generator-plugin"

mkdir -p "$TS_OUT_DIR"

protoc \
  --proto_path="$PROTO_DIR" \
  --go_out="$GO_OUT_DIR" --go_opt=paths=source_relative \
  --go-grpc_out="$GO_OUT_DIR" --go-grpc_opt=paths=source_relative \
  "$PROTO_FILE"

protoc \
  --proto_path="$PROTO_DIR" \
  --js_out=import_style=commonjs,binary:"$TS_OUT_DIR" \
  --grpc-web_out=import_style=typescript,mode=grpcwebtext:"$TS_OUT_DIR" \
  "$PROTO_FILE"

echo "✅ Generated Go and TypeScript stubs from $PROTO_FILE"
