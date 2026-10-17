// usecloud is package tooling, not a second platform daemon.
package main

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
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
		return fmt.Errorf("usage: usecloud app validate <manifest> | inspect <package> | pack <staging-directory> <output.usecloud> | build <app-directory> | keygen <private-key> | public-key <private-key> | sign <package> <private-key> <publisher-id> <publisher-name> | verify <package>")
	}
	switch args[1] {
	case "keygen":
		return apppackage.GenerateKey(args[2])
	case "public-key":
		key, err := apppackage.ReadKey(args[2])
		if err != nil {
			return err
		}
		public := key.Public().(ed25519.PublicKey)
		return json.NewEncoder(os.Stdout).Encode(map[string]string{"keyId": apppackage.Fingerprint(public), "publicKey": base64.StdEncoding.EncodeToString(public)})
	case "sign":
		if len(args) != 6 {
			return fmt.Errorf("usecloud app sign <package> <private-key> <publisher-id> <publisher-name>")
		}
		key, err := apppackage.ReadKey(args[3])
		if err != nil {
			return err
		}
		data, err := os.ReadFile(args[2])
		if err != nil {
			return err
		}
		signed, err := apppackage.Sign(data, key, args[4], args[5])
		if err != nil {
			return err
		}
		return os.WriteFile(args[2], signed, 0644)
	case "verify":
		data, err := os.ReadFile(args[2])
		if err != nil {
			return err
		}
		p, err := apppackage.Inspect(data)
		if err != nil {
			return err
		}
		if p.Signature == nil {
			return fmt.Errorf("package is unsigned")
		}
		return json.NewEncoder(os.Stdout).Encode(p)
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
		return build(args[2])
	default:
		return fmt.Errorf("unknown app command")
	}
}

// Build artifacts independently; packaging remains an explicit staging step.
func build(directory string) error {
	root, err := filepath.Abs(directory)
	if err != nil {
		return err
	}
	data, err := os.ReadFile(filepath.Join(root, "manifest.yaml"))
	if os.IsNotExist(err) {
		data, err = os.ReadFile(filepath.Join(root, "manifest", "manifest.yaml"))
	}
	if err != nil {
		return err
	}
	m, err := manifest.Parse(data)
	if err != nil {
		return err
	}
	runCommand := func(command *exec.Cmd) error {
		command.Stdout, command.Stderr = os.Stdout, os.Stderr
		return command.Run()
	}
	if m.Frontend != nil && m.Frontend.Type == "web-component" {
		frontend := filepath.Join(root, "frontend")
		if _, err := os.Stat(filepath.Join(frontend, "package.json")); os.IsNotExist(err) {
			frontend = root // Frontend-only template.
		}
		command := exec.Command("npm", "run", "build")
		command.Dir = frontend
		if err := runCommand(command); err != nil {
			return err
		}
	}
	if m.Backend != nil {
		output := filepath.Join(root, "dist", filepath.Base(m.Backend.Executable))
		if err := os.MkdirAll(filepath.Dir(output), 0755); err != nil {
			return err
		}
		command := exec.Command("go", "build", "-o", output, "./cmd/"+filepath.Base(m.Backend.Executable))
		command.Dir = filepath.Join(root, "backend")
		for _, variable := range os.Environ() {
			if !strings.HasPrefix(variable, "GOOS=") {
				command.Env = append(command.Env, variable)
			}
		}
		command.Env = append(command.Env, "GOOS=linux")
		return runCommand(command)
	}
	return nil
}
