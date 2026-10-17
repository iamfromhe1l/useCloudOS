package auth

import "testing"

func TestBoundedLoginLimiter(t *testing.T) {
	loginLimits.Lock()
	loginLimits.entries = map[string]attempt{}
	loginLimits.active = 0
	loginLimits.Unlock()
	for i := 0; i < 10; i++ {
		release, ok := loginAllowed("test-peer")
		if !ok {
			t.Fatal("early limit")
		}
		release()
	}
	if _, ok := loginAllowed("test-peer"); ok {
		t.Fatal("unbounded attempts")
	}
}
