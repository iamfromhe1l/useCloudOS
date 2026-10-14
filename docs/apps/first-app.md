# Build your first app

Copy `examples/hello-app` into your own repository. No Core source access is
required. Public packages are package-ready but have not been published to npm;
until publication, consume the tarballs produced by `npm pack` in each package.

1. Install @usecloud/app-sdk, @usecloud/theme and optional @usecloud/ui and
   @usecloud/manifest. The root SDK is framework-independent.
2. Create manifest.yaml with a safe unique ID, SemVer, platform/host compatibility,
   navigation and only necessary permissions.
3. Register a Custom Element. React apps may use registerReactApplication;
   other frameworks implement the same host property contract directly.
4. Build an independent ES module and compiled stylesheet. Declare their package
   paths in manifest. Scope CSS in Shadow DOM and inherit semantic variables.
5. Validate with `usecloud app validate manifest.yaml`.
6. Put manifest.yaml and build output under staging/frontend; pack with
   `usecloud app pack staging hello-0.1.0.usecloud`.
7. Open Core Store → Install from .usecloud file. Review permissions and the
   unsigned warning. Embedded unsigned code needs explicit dev trust policy.
8. Open the registered desktop icon. Core owns the window; the app owns content.
9. Uninstall from Settings → Apps. Data deletion is a separate explicit option.

The Hello example uses only public package exports, follows the current shell
theme, and asks the host to navigate to Settings. It needs no backend service.
