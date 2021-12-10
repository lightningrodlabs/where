{
  holonixPath ?  builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/ccbed64b383ba57cc716797669ce92df3905117c.tar.gz"; }
}:

let
  holonix = import (holonixPath) { };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  buildInputs = with nixpkgs; [
    binaryen
    nodejs-16_x
  ];
}
