#!/bin/bash

zits --default-zome-name zLudotheque -i dna/zomes/ludotheque -i dna/zomes/ludotheque_integrity -o webcomponents/src/bindings/ludotheque.ts
zits --default-zome-name zPlayset -i dna/zomes/playset -i dna/zomes/playset_integrity -o webcomponents/src/bindings/playset.ts
zits --default-zome-name zWhere -i dna/zomes/where -i dna/zomes/where_integrity -o webcomponents/src/bindings/where.ts
