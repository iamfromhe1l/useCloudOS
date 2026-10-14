//go:build !linux

package system

import (
	"errors"
	"runtime"
)

func NewLinuxProvider() (Provider, error) {
	return nil, errors.New("cloud-core requires Linux; current platform is " + runtime.GOOS)
}
