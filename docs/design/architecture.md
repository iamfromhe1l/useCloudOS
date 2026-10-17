# Design architecture and FSD

app → pages → widgets → features → entities → shared inside each independent
frontend. ESLint rejects upward/peer/private imports; module-graph validation
rejects runtime cycles. Pages compose; entities own queries/identity; features
own mutations and object actions; widgets own composition.

Core store page delegates to widgets/store. Files browsing/list/view menu compose
private entities/file-entry and create/upload/entry-actions features. One Files
action model renders both context and overflow menus. Container lifecycle does
the same. Domain components never move into generic packages.

@usecloud/theme 0.2 owns semantic roles and typography/shape/spacing/motion.
@usecloud/ui 0.2 ships compiled Tailwind styles and narrow public subpaths.
The SDK host contract remains v1. Apps release independently as 0.2.0 Custom
Elements with version-qualified names. Core owns outer AppWindow; app owns content.
No compile-time app imports, shared React global or Module Federation.

AppHost bounds content height and updates host context without remounting on
ordinary background data refresh. Runtime mount identity is versioned frontend
entry/element/styles, not unrelated registry fields. Shadow DOM scopes CSS;
it is not a security sandbox. PortalProvider keeps app overlays scoped.

Read docs/development/frontend-architecture.md and docs/apps/frontend.md for
runtime details. Custom CSS is limited to tokens/reset/fonts, inherited browser
integration and canonical shell geometry. Tailwind/CVA is the default.
