package files

import (
	"errors"
	"path"
	"strings"
	"unicode/utf8"
)

var ErrPath = errors.New("invalid relative path")

func ValidatePath(value string, allowRoot bool) error {
	if value == "" && allowRoot {
		return nil
	}
	if value == "" || !utf8.ValidString(value) || len(value) > 4096 || strings.ContainsAny(value, "\x00\\%\r\n") || strings.HasPrefix(value, "/") || path.Clean(value) != value {
		return ErrPath
	}
	for _, part := range strings.Split(value, "/") {
		if part == ".." || part == "." || part == "" || strings.HasPrefix(part, ".upload-") || len(part) > 255 {
			return ErrPath
		}
	}
	return nil
}
