#!/bin/bash

set -e

# Generates the TypeScript bindings (types, ZomeProxy, function names) for each zome.
# `dna/zomes/zome_fn_input` holds the `ZomeFnInput<T>` wrapper shared by all zomes.

zits --default-zome-name zLudotheque -i dna/zomes/zome_fn_input -i dna/zomes/ludotheque -i dna/zomes/ludotheque_integrity -o webcomponents/src/bindings/ludotheque.ts
zits --default-zome-name zPlayset -i dna/zomes/zome_fn_input -i dna/zomes/playset -i dna/zomes/playset_integrity -o webcomponents/src/bindings/playset.ts
zits --default-zome-name zWhere -i dna/zomes/zome_fn_input -i dna/zomes/where -i dna/zomes/where_integrity -o webcomponents/src/bindings/where.ts

# zits flattens the ZomeFnInput<T> wrapper in the proxies; restore it.
python3 scripts/fix-bindings.py dna/zomes/ludotheque/src webcomponents/src/bindings/ludotheque.proxy.ts
python3 scripts/fix-bindings.py dna/zomes/playset/src webcomponents/src/bindings/playset.proxy.ts
python3 scripts/fix-bindings.py dna/zomes/where/src webcomponents/src/bindings/where.proxy.ts

# zits emits `type: {Variant: null}` for `#[serde(tag, content)]` enums; the wire format is `type: "Variant"`.
# Also keep a single ZomeFnInput definition (in playset.types) so `export *` of all bindings does not clash.
python3 - <<'PY'
import re, pathlib
for name in ["ludotheque", "playset", "where"]:
    t = pathlib.Path(f"webcomponents/src/bindings/{name}.types.ts")
    s = t.read_text()
    s = re.sub(r"type: \{(\w+): null\}", r'type: "\1"', s)
    if name != "playset":
        s = re.sub(r"export interface ZomeFnInput<T> \{[^}]*\}\n\n?", "", s)
    t.write_text(s)
    p = pathlib.Path(f"webcomponents/src/bindings/{name}.proxy.ts")
    s = p.read_text()
    if name != "playset" and "ZomeFnInput" in s:
        s = s.replace("ZomeFnInput, }", "}", 1)
        s = s.replace("import {ZomeFnInput, ", "import {", 1)
        s = s.replace("import {ZomeProxy} from '@ddd-qc/lit-happ';", "import {ZomeProxy} from '@ddd-qc/lit-happ';\nimport {ZomeFnInput} from './playset.types';", 1)
    p.write_text(s)
print("ts-bindings: post-processed enum tags and ZomeFnInput")
PY
