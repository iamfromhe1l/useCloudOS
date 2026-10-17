package auth

import (
	"sync"
	"time"
)

type attempt struct {
	count int
	until time.Time
}

var loginLimits = struct {
	sync.Mutex
	entries map[string]attempt
	active  int
}{entries: map[string]attempt{}}

// Bounded single-node limiter: peer IP, not untrusted forwarding headers.
func loginAllowed(peer string) (func(), bool) {
	loginLimits.Lock()
	defer loginLimits.Unlock()
	now := time.Now()
	for key, a := range loginLimits.entries {
		if now.After(a.until) {
			delete(loginLimits.entries, key)
		}
	}
	a := loginLimits.entries[peer]
	if a.count >= 10 || loginLimits.active >= 2 || len(loginLimits.entries) >= 4096 && a.count == 0 {
		return nil, false
	}
	if a.count == 0 {
		a.until = now.Add(15 * time.Minute)
	}
	a.count++
	loginLimits.entries[peer] = a
	loginLimits.active++
	return func() { loginLimits.Lock(); loginLimits.active--; loginLimits.Unlock() }, true
}
