let
  holonixPath = builtins.fetchTarball https://github.com/holochain/holonix/archive/6ae8ffb8e5c1a1faa4f4e1af8a9f7139b2ce0f3c.tar.gz;
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
    holochainVersionId = "custom";

    holochainVersion = {
      rev = "6535292238dc1fbd2b60433a2054f7787e4f060e";
      sha256 = "sha256:1sxpijq1rj4zra9wm5qkds8s2a363n8vbg5m9xfaib0k99fxgqas";
      cargoSha256 = "sha256:03p8vs9qaixqk67447l7q4h3cr0xyqdd1h9alxnx6y5xlz3il0rh";
      bins = {
        holochain = "holochain";
        hc = "hc";
      };

      lairKeystoreHashes = {
        sha256 = "05p8j1yfvwqg2amnbqaphc6cd92k65dq10v3afdj0k0kj42gd6ic";
        cargoSha256 = "0bd1sjx4lngi543l0bnchmpz4qb3ysf8gisary1bhxzq47b286cf";
      };
    };
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  buildInputs = with nixpkgs; [
    binaryen
  ];
}
