# useCloudOS modular platform

Core provides the platform. Apps provide the features.

The monorepo produces independent artifacts: cloud-core, Core shell, native app
services, frontend modules and `.usecloud` packages. Directory layout is not the
boundary: installation, runtime loading and gateway routing enforce it.

Read [Core](core.md), [applications](apps.md), [networking](networking.md),
[security](security.md), [data](data.md) and the [ADRs](decisions/).

The personal-cloud model supports heterogeneous runtimes and independent
lifecycles with one unified UX. It is deliberately single-node: systemd, Unix
sockets and a local database, not an enterprise service mesh.

Implemented proof: Containers is independently built, packaged, installed,
loaded and removed. It is absent from a clean registry and Core bundle.
