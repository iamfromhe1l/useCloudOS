// usecloud is package tooling, not a second platform daemon.
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"usecloudos/backend/internal/apppackage"
	"usecloudos/backend/internal/manifest"
)

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run(args []string) error {
	if len(args) < 3 || args[0] != "app" {
		return fmt.Errorf("usage: usecloud app validate <manifest> | inspect <package> | pack <staging-directory> <output.usecloud> | build <app-directory>")
	}
	switch args[1] {
	case "validate":
		data, err := os.ReadFile(args[2])
		if err != nil {
			return err
		}
		m, err := manifest.Parse(data)
		if err != nil {
			return err
		}
		return json.NewEncoder(os.Stdout).Encode(m)
	case "inspect":
		info, err := os.Stat(args[2])
		if err != nil {
			return err
		}
		if info.Size() > apppackage.MaxArchiveBytes {
			return fmt.Errorf("package too large")
		}
		data, err := os.ReadFile(args[2])
		if err != nil {
			return err
		}
		p, err := apppackage.Inspect(data)
		if err != nil {
			return err
		}
		return json.NewEncoder(os.Stdout).Encode(p)
	case "pack":
		if len(args) != 4 {
			return fmt.Errorf("pack requires staging directory and output path")
		}
		data, err := apppackage.Pack(args[2])
		if err != nil {
			return err
		}
		if err = os.MkdirAll(filepath.Dir(args[3]), 0755); err != nil {
			return err
		}
		if err = os.WriteFile(args[3], data, 0644); err != nil {
			return err
		}
		fmt.Println(args[3])
		return nil
	case "build":
		frontend := filepath.Join(args[2], "frontend")
		command := exec.Command("npm", "run", "build")
		command.Dir = frontend
		command.Stdout = os.Stdout
		command.Stderr = os.Stderr
		return command.Run()
	default:
		return fmt.Errorf("unknown app command")
	}
}
