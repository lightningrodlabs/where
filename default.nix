# Example: Custom Holochain And Binaries
#
# The following `shell.nix` file can be used in your project's root folder and activated with `nix-shell`.
# It uses a custom revision and a custom set of binaries to be installed.

{
  holonixPath ?  builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/develop.tar.gz"; }
}:

let
  holonix = import (holonixPath) {
    include = {
        # making this explicit even though it's the default
        holochainBinaries = true;
    };

    holochainVersionId = "custom";

    holochainVersion = {
      rev = "3a1eacab558c179bbe41ae4ed3dc76d3bae93ce5";
      sha256 = "sha256:06m0blnvcxm5vasasqxx3i310bgmdgqnjnf647b68am8b2hic7w7";
      cargoSha256 = "sha256:0p4m8ckbd7v411wgh14p0iz4dwi84i3cha5m1zgnqlln0wkqsb0f";
      bins = {
        holochain = "holochain";
        hc = "hc";
      };

      lairKeystoreHashes = {
        sha256 = "0khg5w5fgdp1sg22vqyzsb2ri7znbxiwl7vr2zx6bwn744wy2cyv";
        cargoSha256 = "1lm8vrxh7fw7gcir9lq85frfd0rdcca9p7883nikjfbn21ac4sn4";
      };
    };
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  buildInputs = with nixpkgs; [
    binaryen
    nodejs-16_x
  ];
}
