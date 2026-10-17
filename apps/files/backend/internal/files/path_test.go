package files

import "testing"

func FuzzValidatePath(f *testing.F) {
	for _, seed := range []string{"", "a", "../../etc/passwd", "%2fetc", "🌿/file"} {
		f.Add(seed)
	}
	f.Fuzz(func(t *testing.T, value string) {
		if ValidatePath(value, false) == nil && (value == "" || value == "." || value == "..") {
			t.Fatal("unsafe root accepted")
		}
	})
}
