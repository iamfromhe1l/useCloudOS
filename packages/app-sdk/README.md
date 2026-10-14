# @usecloud/app-sdk

Version 0.1.0 implements HostContext v1. Root exports are framework-independent
and do not import React. /react is optional and uses peer React/ReactDOM.

createUseCloudClient(appId).request('/relative/path') always routes browser
requests through `/api/apps/<id>/...`, with same-origin credentials and normalized
ApiError. It rejects absolute/escape URLs. A client ID is identity metadata, not
an authentication secret; Core enforces real authorization.

The element's host property receives applicationId, version, relative route,
granted permissions, resolved theme, stylesheet URLs and capabilities:
navigation.open/setRoute, notifications.push and events.subscribe. Subscriptions
must be disposed on unmount. Events are local Core SSE, not an external message
bus. hasPermission only improves UX; the backend permission gate remains binding.

/react exports registerReactApplication, AppContextProvider, useAppContext,
usePermission, useHostTheme and useHostNavigation. The adapter owns a private
React root, Shadow stylesheet links, lifecycle cleanup and isolated error event.
Its Application component receives portalContainer; wrap @usecloud/ui portals
in PortalProvider. App code owns content, never shell chrome/login/wallpaper.

Custom Elements are not a security sandbox. Only trusted embedded bundles should
receive this host environment. Use version-qualified tags for release updates.
Future contract changes should be additive; mark deprecations and remove only
with a new major host/SDK contract. Do not pass Core React Context across apps.

See examples/hello-app and docs/apps/frontend.md. Build independently and npm pack;
publication is intentionally not performed by repository tooling.
