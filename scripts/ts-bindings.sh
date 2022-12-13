#!/bin/bash

zits -i dna/zomes/ludotheque -i dna/zomes/ludotheque_integrity -o webcomponents/src/bindings/ludotheque.d.ts
zits -i dna/zomes/playset -i dna/zomes/playset_integrity -o webcomponents/src/bindings/playset.d.ts
zits -i dna/zomes/where -i dna/zomes/where_integrity -o webcomponents/src/bindings/where.d.ts
#zits -i dna/zomes/profiles -i dna/zomes/profiles_integrity -o dna/bindings/profiles.d.ts


