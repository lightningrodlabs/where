#!/usr/bin/env python3
"""zits (1.17) flattens `ZomeFnInput<T>` parameters to `T` in the generated ZomeProxy.
This restores the wrapper type on every zome function whose Rust input is `ZomeFnInput<..>`,
so the UI has to pass `{input, local}`.

Usage: fix-bindings.py <rust-zome-src-dir> <generated proxy.ts>
"""
import re, sys, pathlib

src_dir, proxy_path = sys.argv[1], sys.argv[2]
wrapped = {}
for rs in pathlib.Path(src_dir).rglob("*.rs"):
    text = rs.read_text()
    for m in re.finditer(r"#\[hdk_extern\]\s*(?:pub\s+)?fn\s+(\w+)\s*\(\s*\w+\s*:\s*ZomeFnInput<([^>]*(?:<[^>]*>)?[^>]*)>", text):
        wrapped[m.group(1)] = m.group(2).strip()

def snake_to_camel(s):
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])

proxy = pathlib.Path(proxy_path).read_text()
for fn_name, inner in wrapped.items():
    camel = snake_to_camel(fn_name)
    # match: async getHeres(input: EntryHashB64): Promise<...>
    pat = re.compile(r"(async %s\()(\w+): ([^)]*)\)" % re.escape(camel))
    m = pat.search(proxy)
    if not m:
        print(f"fix-bindings: WARNING {camel} not found in {proxy_path}")
        continue
    ts_inner = m.group(3)
    if ts_inner == "void" or inner == "()":
        ts_inner = "null"
    proxy = proxy[:m.start()] + f"{m.group(1)}{m.group(2)}: ZomeFnInput<{ts_inner}>)" + proxy[m.end():]
if "ZomeFnInput" in proxy and not re.search(r"import \{[^}]*\bZomeFnInput\b", proxy):
    proxy = proxy.replace("import {", "import {ZomeFnInput, ", 1)
pathlib.Path(proxy_path).write_text(proxy)
print(f"fix-bindings: wrapped {sorted(wrapped)} in {proxy_path}")
