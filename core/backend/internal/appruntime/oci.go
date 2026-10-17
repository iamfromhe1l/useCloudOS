package appruntime

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"time"

	"usecloudos/backend/internal/registry"
)

// OCI owns only platform-installed OCI artifacts. It is not the Containers
// application's API for inspecting/managing arbitrary existing containers.
type OCI struct{ Client *http.Client }

func (o OCI) client() *http.Client {
	if o.Client != nil {
		return o.Client
	}
	return &http.Client{Timeout: 3 * time.Minute, Transport: &http.Transport{DisableKeepAlives: true, DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		return (&net.Dialer{Timeout: 3 * time.Second}).DialContext(ctx, "unix", "/var/run/docker.sock")
	}}}
}

type engineError struct{ Status int }

func (e engineError) Error() string { return fmt.Sprintf("OCI engine returned HTTP %d", e.Status) }
func (o OCI) request(ctx context.Context, method, path string, body any) (*http.Response, error) {
	var input io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		input = bytes.NewReader(data)
	}
	request, err := http.NewRequestWithContext(ctx, method, "http://engine"+path, input)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := o.client().Do(request)
	if err != nil {
		return nil, err
	}
	if response.StatusCode >= 400 {
		response.Body.Close()
		return nil, engineError{response.StatusCode}
	}
	return response, nil
}
func (o OCI) version(ctx context.Context) (string, error) {
	r, err := o.request(ctx, "GET", "/version", nil)
	if err != nil {
		return "", err
	}
	defer r.Body.Close()
	var version struct {
		APIVersion string `json:"ApiVersion"`
	}
	if err = json.NewDecoder(io.LimitReader(r.Body, 65536)).Decode(&version); err != nil {
		return "", err
	}
	if !regexp.MustCompile(`^1\.[0-9]+$`).MatchString(version.APIVersion) {
		return "", errors.New("invalid OCI API version")
	}
	return "/v" + version.APIVersion, nil
}

type containerState struct {
	Image  string `json:"Image"`
	Config struct {
		Image  string
		Labels map[string]string
	}
	State struct {
		Running bool
		Status  string
		Health  *struct{ Status string }
	}
}

func containerName(a registry.Application) string { return "usecloud-app-" + a.Manifest.Metadata.ID }
func (o OCI) inspect(ctx context.Context, version string, a registry.Application) (containerState, error) {
	var state containerState
	r, err := o.request(ctx, "GET", version+"/containers/"+containerName(a)+"/json", nil)
	if err != nil {
		return state, err
	}
	defer r.Body.Close()
	err = json.NewDecoder(io.LimitReader(r.Body, 1<<20)).Decode(&state)
	if err == nil && state.Config.Labels["io.usecloud.app"] != a.Manifest.Metadata.ID {
		return state, errors.New("refusing to manage a container not owned by this platform app")
	}
	return state, err
}
func missing(err error) bool {
	var engine engineError
	return errors.As(err, &engine) && engine.Status == 404
}
func (o OCI) Start(ctx context.Context, a registry.Application) error {
	if a.Has("network.lan") != a.Has("network.internet") {
		return errors.New("OCI network policy currently supports none or explicitly granted LAN and Internet together")
	}
	version, err := o.version(ctx)
	if err != nil {
		return err
	}
	state, err := o.inspect(ctx, version, a)
	if err == nil && state.Config.Labels["io.usecloud.version"] != a.Manifest.Metadata.Version {
		if state.State.Running {
			return errors.New("stop OCI application before replacing its version")
		}
		if err = o.Remove(ctx, a); err != nil {
			return err
		}
		err = engineError{404}
	}
	if missing(err) {
		// Pull through the Engine API. Decode bounded progress frames and never
		// expose raw daemon errors to the platform client.
		image, lookupErr := o.request(ctx, "GET", version+"/images/"+url.PathEscape(a.Manifest.Runtime.Image)+"/json", nil)
		if lookupErr == nil {
			image.Body.Close()
		} else if !missing(lookupErr) {
			return lookupErr
		} else {
			r, err := o.request(ctx, "POST", version+"/images/create?"+url.Values{"fromImage": {a.Manifest.Runtime.Image}}.Encode(), nil)
			if err != nil {
				return err
			}
			decoder := json.NewDecoder(io.LimitReader(r.Body, 16<<20))
			for {
				var progress struct {
					Error string `json:"error"`
				}
				err = decoder.Decode(&progress)
				if err == io.EOF {
					break
				}
				if err != nil {
					r.Body.Close()
					return err
				}
				if progress.Error != "" {
					r.Body.Close()
					return errors.New("OCI image pull failed")
				}
			}
			r.Body.Close()
		}
		host := map[string]any{"CapDrop": []string{"ALL"}, "SecurityOpt": []string{"no-new-privileges:true"}, "Privileged": false, "NetworkMode": "none", "RestartPolicy": map[string]string{"Name": "unless-stopped"}}
		if a.Has("network.lan") && a.Has("network.internet") {
			host["NetworkMode"] = "bridge"
		}
		if a.Has("storage.app-data") {
			host["Mounts"] = []map[string]any{{"Type": "bind", "Source": a.DataPath, "Target": "/data"}}
		}
		body := map[string]any{"Image": a.Manifest.Runtime.Image, "Labels": map[string]string{"io.usecloud.app": a.Manifest.Metadata.ID, "io.usecloud.version": a.Manifest.Metadata.Version}, "HostConfig": host}
		if len(a.Manifest.Runtime.Command) > 0 {
			body["Cmd"] = a.Manifest.Runtime.Command
		}
		response, err := o.request(ctx, "POST", version+"/containers/create?"+url.Values{"name": {containerName(a)}}.Encode(), body)
		if err != nil {
			return err
		}
		response.Body.Close()
	} else if err != nil {
		return err
	} else if state.Config.Labels["io.usecloud.version"] != a.Manifest.Metadata.Version {
		return errors.New("OCI version change requires container replacement")
	}
	response, err := o.request(ctx, "POST", version+"/containers/"+containerName(a)+"/start", nil)
	if err != nil {
		return err
	}
	response.Body.Close()
	return nil
}
func (o OCI) Stop(ctx context.Context, a registry.Application) error {
	version, err := o.version(ctx)
	if err != nil {
		return err
	}
	if _, err = o.inspect(ctx, version, a); missing(err) {
		return nil
	} else if err != nil {
		return err
	}
	response, err := o.request(ctx, "POST", version+"/containers/"+containerName(a)+"/stop?t=10", nil)
	if err != nil {
		return err
	}
	response.Body.Close()
	return nil
}
func (o OCI) Remove(ctx context.Context, a registry.Application) error {
	version, err := o.version(ctx)
	if err != nil {
		return err
	}
	if _, err = o.inspect(ctx, version, a); missing(err) {
		return nil
	} else if err != nil {
		return err
	}
	response, err := o.request(ctx, "DELETE", version+"/containers/"+containerName(a), nil)
	if err != nil {
		return err
	}
	response.Body.Close()
	return nil
}
func (o OCI) Status(ctx context.Context, a registry.Application) string {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	version, err := o.version(ctx)
	if err != nil {
		return "failed"
	}
	state, err := o.inspect(ctx, version, a)
	if err != nil {
		return "failed"
	}
	if !state.State.Running {
		return "stopped"
	}
	if state.State.Health != nil && state.State.Health.Status != "healthy" {
		return "failed"
	}
	return "running"
}
