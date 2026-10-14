# Containers application

Optional native useCloudOS application, not Core functionality.

Frontend: independent React/Vite/Tailwind module registering the manifest's
version-qualified Custom Element. It imports only public SDK/UI/theme packages,
uses Shadow styles and owns list/details/stats/logs/lifecycle content.

Backend: independent Linux Go module producing containers-service. Moby talks to
Docker Engine through /var/run/docker.sock. Unix HTTP service endpoints:
/health, /docker/info, /containers, /containers/<id>, /stats, /logs and POST
/start, /stop, /restart. Browser paths add `/api/apps/containers` through Core.

```bash
make app-containers-build
make app-containers-test
make app-containers-pack
```

Install the package from Core Store/catalog or sideload. Settings Apps manages
the separate systemd service and uninstall, preserving data by default.
Docker metrics/errors/log limits and provider/handler tests are retained.

Direct Docker group access is privileged and explicitly documented in
docs/apps/security.md; it is not a general-purpose root grant for other apps.
