# Store

Discovery toolbar/search → real featured application → real catalog cards.
No fabricated apps, ratings, screenshots, categories or install progress.
Sideload is secondary under Store options; functionality remains intact.

Card: canonical icon/name/description/publisher trust/action. Version/runtime
are secondary detail information. Detail: identity/action, description,
requested permissions and version/runtime/publisher. Back returns catalog.
Installed version offers Open; different version offers Update through the same
permission/trust confirmation. Installing remains pending through registry refresh.

Catalog exposes latest SemVer per app; install is bound to the reviewed package
digest so multiple local package versions cannot silently select a different
artifact. This is a narrow correctness fix, not a platform redesign.
Signed, verified, unsigned and revoked semantics remain server authoritative.
