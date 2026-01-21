# dev.nix — Entorno frontend Firebase / HTML
{ pkgs, ... }: {
  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.firebase-tools
  ];

  env = {
    NODE_ENV = "development";
  };

  idx = {
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
    ];

    previews = {
      enable = true;
      previews = {
        web = {
          # Servidor estático para index.html
          command = [
            "npx"
            "http-server"
            "dojo-app/public"
            "-p"
            "$PORT"
            "-c-1"
          ];
          manager = "web";
        };
      };
    };

    workspace = {
      onCreate = {
        default.openFiles = [
          ".idx/dev.nix"
          "dojo-app/public/index.html"
          "README.md"
        ];
      };

      onStart = {
        # No procesos en background necesarios
      };
    };
  };
}
