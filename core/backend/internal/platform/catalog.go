package platform

import (
	"github.com/Masterminds/semver/v3"
	"sort"
	"usecloudos/backend/internal/apppackage"
)

// A catalog presents applications, not duplicate cards for every package version.
func latestCatalogPackages(packages []*apppackage.Package) []*apppackage.Package {
	latest := map[string]*apppackage.Package{}
	for _, p := range packages {
		current := latest[p.Manifest.Metadata.ID]
		version, err := semver.StrictNewVersion(p.Manifest.Metadata.Version)
		if err != nil {
			continue
		}
		if current == nil || version.GreaterThan(semver.MustParse(current.Manifest.Metadata.Version)) {
			latest[p.Manifest.Metadata.ID] = p
		}
	}
	result := make([]*apppackage.Package, 0, len(latest))
	for _, p := range latest {
		result = append(result, p)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Manifest.Metadata.ID < result[j].Manifest.Metadata.ID })
	return result
}

// Bind installation to exactly the integrity digest reviewed in the UI.
// Empty digest preserves the existing API for noninteractive development clients.
func catalogMatches(p *apppackage.Package, id, digest string) bool {
	return p.Manifest.Metadata.ID == id && (digest == "" || p.Digest == digest)
}
