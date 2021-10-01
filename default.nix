# Example: Custom Holochain And Binaries
#
# The following `shell.nix` file can be used in your project's root folder and activated with `nix-shell`.
# It uses a custom revision and a custom set of binaries to be installed.

{
  holonixPath ?  builtins.fetchTarball { url = "https://github.com/holochain/holonix/archive/a0dcdfac2c8783c58805175dd5bc5528ccbb35fd.tar.gz"; }
}:

let
  holonix = import (holonixPath) {
    include = {
        # making this explicit even though it's the default
        holochainBinaries = true;
    };

    holochainVersionId = "custom";

    holochainVersion = {
      rev = "4347e4dbfd4f957576275fb2e8b3deda90ccbfd7";
      sha256 = "sha256:1g3sm1x786zr9w324kxlsf50ajrmpigjj6l1xnm1cwl2hbqq7hxz";
      cargoSha256 = "sha256:1i6i80vf7jjw1h0b3dsh5n0x8g5g3h16sw9rskw84yipqbv51nc7";
      bins = {
        holochain = "holochain";
        hc = "hc";
      };

      lairKeystoreHashes = {
        sha256 = "1ibynj1mn1mc59x7b2jn8l1vv9m8czwcvpq81qgbpa52jgjqlf14";
        cargoSha256 = "1dnfjdk3b4l7ysvm81r061mxly889bbcmg2h11nkgmfj79djka9s";
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
