{
  holonixPath ? builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/1ebeb9e479bb61080c4b01e972cb108ed0590c03.tar.gz"; }
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