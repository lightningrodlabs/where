# Developer Setup

## Requirements

- Having [`nix-shell` installed](https://developer.holochain.org/docs/install/).

## nix-shell

Run all the commands specified in the documentation inside the nix-shell provided by the `*.nix` files at the root of this repository.

To enter the nix-shell at the root of this repository, simply run `nix-shell` in it.

## Structure

This respository is structured in the following way:

- `ui/`: UI library.
- `zome/`: example DNA with the `todo_rename` code.
- Top level `Cargo.toml` is a virtual package necessary for other DNAs to include this zome by pointing to this git repository.
- Top level `*.nix` files define the nix environment needed to develop with this repository.

Read the [UI developer setup](/ui/README.md) and the [Zome developer setup](/zome/README.md).
