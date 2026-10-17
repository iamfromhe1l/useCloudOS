package main

import (
	"fmt"
	"path/filepath"
	"strings"
)

func validateRoots(apps, data, shared, sockets, units string) error {
	for _, value := range []string{apps, data, shared, sockets, units} {
		if !filepath.IsAbs(value) || filepath.Clean(value) != value || strings.ContainsAny(value, " \t\r\n%\\") {
			return fmt.Errorf("platform filesystem paths must be clean absolute paths without whitespace/specifiers")
		}
		switch value {
		case "/", "/data", "/var", "/etc", "/usr", "/run", "/tmp":
			return fmt.Errorf("refusing broad platform filesystem root")
		}
	}
	paths := []string{apps, data, shared}
	for i, a := range paths {
		for j, b := range paths {
			if i != j && (a == b || strings.HasPrefix(a, b+string(filepath.Separator))) {
				return fmt.Errorf("package, app-data and shared-storage roots must not overlap")
			}
		}
	}
	return nil
}
