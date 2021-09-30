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
      rev = "8503429ad64c1c24a56777bb298a7522760f4daa";
      sha256 = "sha256:1c8zw1zx8gqhyzr0f1djyznbfjjyq78phb01hmvj96csb2f1nl8k";
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
