{
  description = "Node dev shell with Electron support";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs_22
          
          # For Electron - use system package
          electron
          
          # Native build tools
          python3
          gcc
          gnumake
          pkg-config
        ];

        # Required for Electron on NixOS
        nativeBuildInputs = with pkgs; [
          nodePackages.node-gyp
        ];

        # Use system Electron instead of npm-downloaded one
        ELECTRON_OVERRIDE_DIST_PATH = "${pkgs.electron}/libexec/electron";

        # Libraries needed by native modules
        LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath (with pkgs; [
          glib
          nss
          nspr
          atk
          cups
          dbus
          libdrm
          gtk3
          pango
          cairo
          xorg.libX11
          xorg.libXcomposite
          xorg.libXdamage
          xorg.libXext
          xorg.libXfixes
          xorg.libXrandr
          xorg.libxcb
          mesa
          expat
          libxkbcommon
          alsa-lib
          at-spi2-atk
          at-spi2-core
          stdenv.cc.cc.lib
        ]);

        shellHook = ''
          echo "Pomodoro Plant development environment"
          echo "Using system Electron: $ELECTRON_OVERRIDE_DIST_PATH"
          echo ""
          echo "Run 'cd server && npm start' to start the server"
          echo "Run 'cd electron && npm start' to start the Electron app"
        '';
      };
    };
}

