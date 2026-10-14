# Independent frontend modules

An entry ES module registers the manifest's Custom Element. Core imports the
installed versioned URL only when the app opens and waits for registration.
The element exposes a `host` property conforming to HostContext v1.

The host provides identity, relative route, granted permissions, resolved theme,
stylesheet URLs, navigation, approved platform events and notifications.
Do not pass React Context across the boundary. SDK root is framework-independent;
`@usecloud/app-sdk/react` supplies bindings and registerReactApplication.

The React adapter attaches an open Shadow Root, creates one React root and
loads compiled styles inside it. Semantic `--uc-*` properties inherit from the
shell. Radix portals must use the provided PortalProvider container, not body.
Disconnect unmounts React; replacing the route updates host context.

Each release must use a version-qualified element name, e.g.
`usecloud-hello-v0-1-0`. Browsers cannot unregister a Custom Element; a new module
must not silently reuse an old class after an update.

Official apps use Tailwind semantic utilities (`bg-surface-container`,
`text-on-surface`, `border-outline`) and the compiled @usecloud/ui stylesheet.
Do not use Core private aliases, global body CSS, runtime-generated Tailwind
color strings, or independent app dark-mode state.

Library-mode builds must replace process.env.NODE_ENV with production and bundle
their own required runtimes. Relative chunk imports resolve under versioned app
assets. Do not externalize React to an undocumented Core global.

Third-party developers can instead use theme/SDK with Vue, Svelte, Lit or vanilla
Custom Elements, or provide a fully independent external UI.
