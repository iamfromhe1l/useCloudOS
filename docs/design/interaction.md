# Interaction contract

Every action defines rest/hover/pressed/focus/disabled/pending and, where relevant,
selected/destructive states. Button press uses restrained scale; selection uses
tonal fill, not merely a thin border. Cursor is pointer for actual actions,
text for inputs and default for titles. Never make static content a button.

Radix owns Dialog/AlertDialog, object menus, Popover, Tabs, Toggle/Radio groups,
Switch, Tooltip and Toolbar keyboard behavior. Never hand-roll these behaviors.
Object right-click and trailing ⋯ menus share one action model. Right-click is
not the only path. Escape dismisses/restores focus; destructive delete opens
AlertDialog with a clear permanent-deletion message and safe Cancel focus.

44px primary touch targets, visible semantic-token focus, aria-current for
destinations, aria-pressed for single file selection, aria-busy/live status for
async work. Forced-colors/reduced-motion remain supported.
