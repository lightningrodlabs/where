# Zome Developer Setup

This folder has an example DNA for the `hc_zome_where` zome. The actual code for the zome is in `zomes/where`.

To change the code, you can work either opening VSCode inside the root folder of the repo or in this folder, you should have rust intellisense either way.

All the instructions here assume you are running them inside the nix-shell at the root of the repository. For more info, see the [developer setup](/dev-setup.md).

## Building

```bash
CARGO_TARGET_DIR=target cargo build --release --target wasm32-unknown-unknown
hc dna pack workdir/dna
hc app pack workdir/happ
```

This should create a `workdir/happ/where.happ` file.

## Testing

After having built the DNA:

```bash
cd test
npm install
npm test
```

## Running

After having built the DNA:

```bash
hc s generate workdir/happ/where.happ --run=8888
```

Now `holochain` will be listening at port `8888`;
