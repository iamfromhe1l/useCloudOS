package main

import "testing"

func TestRootOwnershipConfig(t *testing.T) {
	if err := validateRoots("/var/lib/usecloud/apps", "/var/lib/usecloud/data", "/data/shared", "/run/usecloud/apps", "/etc/systemd/system"); err != nil {
		t.Fatal(err)
	}
	for _, shared := range []string{"/", "/data", "/var/lib/usecloud", "/var/lib/usecloud/data", "/var/lib/usecloud/data/files", "relative", "/data/my storage"} {
		if validateRoots("/var/lib/usecloud/apps", "/var/lib/usecloud/data", shared, "/run/usecloud/apps", "/etc/systemd/system") == nil {
			t.Fatalf("unsafe config %s", shared)
		}
	}
}
