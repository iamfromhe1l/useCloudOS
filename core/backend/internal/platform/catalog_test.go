package platform

import (
	"testing"
	"usecloudos/backend/internal/apppackage"
)

func TestCatalogUsesLatestSemVerAndExactReviewedPackage(t *testing.T) {
	makePackage := func(id, version, digest string) *apppackage.Package {
		p := &apppackage.Package{Digest: digest}
		p.Manifest.Metadata.ID = id
		p.Manifest.Metadata.Version = version
		return p
	}
	old := makePackage("files", "0.9.0", "old")
	latest := makePackage("files", "0.10.0", "new")
	prerelease := makePackage("files", "0.10.0-beta.1", "beta")
	result := latestCatalogPackages([]*apppackage.Package{latest, old, prerelease})
	if len(result) != 1 || result[0] != latest {
		t.Fatal("catalog did not retain latest SemVer")
	}
	if !catalogMatches(latest, "files", "new") || catalogMatches(old, "files", "new") || catalogMatches(latest, "other", "new") {
		t.Fatal("reviewed package mismatch")
	}
	if !catalogMatches(old, "files", "") {
		t.Fatal("legacy contract regressed")
	}
}
