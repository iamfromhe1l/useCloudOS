// Package events provides bounded, in-process, non-blocking platform events.
package events

import "sync"

type Event struct {
	Type  string `json:"type"`
	AppID string `json:"appId"`
}
type Bus struct {
	mu          sync.Mutex
	next        int
	subscribers map[int]chan Event
}

func New() *Bus { return &Bus{subscribers: map[int]chan Event{}} }
func (b *Bus) Subscribe() (<-chan Event, func()) {
	b.mu.Lock()
	id := b.next
	b.next++
	channel := make(chan Event, 32)
	b.subscribers[id] = channel
	b.mu.Unlock()
	return channel, func() {
		b.mu.Lock()
		if c, ok := b.subscribers[id]; ok {
			delete(b.subscribers, id)
			close(c)
		}
		b.mu.Unlock()
	}
}
func (b *Bus) Publish(event Event) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for _, c := range b.subscribers {
		select {
		case c <- event:
		default:
		}
	}
}
