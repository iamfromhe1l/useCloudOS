# Files

Second independently installable useCloudOS application. Core owns the outer
AppWindow; Files owns listing, paths and file operations. React/Tailwind frontend
registers usecloud-files-v0-2-0, uses only public UI/theme/SDK/manifest packages,
and follows inherited shell theme inside Shadow DOM. No Core source imports.

Native Go files-service uses the same private Unix HTTP/systemd contract as
Containers: /run/usecloud/apps/files/files.sock (the existing platform layout,
not a second socket convention). No TCP port and no Files-specific Core routes.

| Service path                                             | Operation                                          |
| -------------------------------------------------------- | -------------------------------------------------- |
| GET /health                                              | lightweight readiness                              |
| GET /root                                                | friendly storage root, writable/size/limit context |
| GET /entries?path=&sort=name&hidden=0&offset=0&limit=100 | paged listing                                      |
| POST /directories {path}                                 | create folder                                      |
| PUT /content?path=relative                               | raw streaming upload                               |
| GET /content?path=relative                               | attachment download                                |
| POST /move {source,target}                               | atomic no-overwrite rename/move                    |
| DELETE /entries?path=&recursive=1                        | permanent explicit deletion                        |

Browser prefixes all paths with /api/apps/files through Core. Shared read/write
and notifications/background capabilities are declared in manifest. The service
checks Core identity and granted headers as defence in depth; private socket
ownership is the trusted transport boundary. Standard users are read-only.

Default shared user files live under /data/shared, never mixed with app-private
metadata or /data/platform secrets. Uninstall, including app-data purge, does not
delete shared files. Files has no database. See [filesystem security](../../docs/security/filesystem.md).

```bash
make app-files-build
make app-files-test
make app-files-pack
make app-files-install-dev
# Fresh-install integration refuses an existing app:
make files-check
# General developer workflow:
AUTH=required APPS=containers,files make dev
```

Build/pack/sign/install are the ordinary platform contracts. The local signing
key is private and not committed. Core initial JS never includes Files. Directory
lists page incrementally; uploads report throttled progress and support cancel;
entry menus and dialogs use Radix, with keyboard/focus and touch-friendly controls.

Deferred: recursive copy, previews, Trash, grid view, multi-selection, complex ACL
editing and remote/S3 roots. Delete is permanent and requires confirmation.
