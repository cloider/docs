#!/bin/sh
# Regenerates docs/mcp/tools.mdx from cli/cmd/mcp_tools.go, so the tool reference
# matches the catalog. Run it after adding or changing an MCP tool.
# The toolset introductions and the FAQ (with its tool counts) are in assemble_tools.py.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
cmd="$here/../../../cli/cmd"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

python3 "$here/gen_tools.py" "$cmd/mcp_tools.go" "$cmd/support.go" "$tmp/tools.json"
python3 "$here/gen_md.py" "$tmp/tools.json" "$tmp/fragment.md"
python3 "$here/assemble_tools.py" "$tmp/tools.json" "$tmp/fragment.md" "$here/../../docs/mcp/tools.mdx"
echo "wrote docs/mcp/tools.mdx"
