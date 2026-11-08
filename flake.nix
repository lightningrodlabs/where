{
  description = "Flake for Where (Holochain 0.7 Moss Tool) development";

  inputs = {
    holonix.url = "github:holochain/holonix?ref=main-0.7";

    nixpkgs.follows = "holonix/nixpkgs";
    flake-parts.follows = "holonix/flake-parts";
  };

  outputs = inputs@{ flake-parts, ... }: flake-parts.lib.mkFlake { inherit inputs; } {
    systems = builtins.attrNames inputs.holonix.devShells;
    perSystem = { inputs', pkgs, ... }: {
      formatter = pkgs.nixpkgs-fmt;

      devShells.default = pkgs.mkShell {
        inputsFrom = [ inputs'.holonix.devShells ];

        packages = (with inputs'.holonix.packages; [
          holochain
          hc
          lair-keystore
          bootstrap-srv
          hn-introspect
          rust # Rust with the wasm32 target for zome builds
        ]) ++ (with pkgs; [
          nodejs_22 # UI, Moss dev tooling (weave) and zits bindings
          binaryen # wasm-opt
          typescript
        ]);

        shellHook = ''
          export PS1='\[\033[1;34m\][where-0.7:\w]\$\[\033[0m\] '
        '';
      };
    };
  };
}
