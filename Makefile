.DEFAULT_GOAL := help

.PHONY: help vm-start vm-stop vm-shell vm-status vm-ip vm-check vm-reset \
	backend-build backend-test backend-lint backend-run backend-install backend-docker-check \
	frontend-install frontend-dev frontend-test frontend-build \
	frontend-storybook frontend-storybook-build frontend-visual-test frontend-analyze frontend-budget

help:
	@echo "useCloudOS development commands:"
	@echo "  make vm-start   Create (if needed) and start the Lima VM"
	@echo "  make vm-stop    Stop the Lima VM"
	@echo "  make vm-shell   Open a shell in the Lima VM"
	@echo "  make vm-status  Show VM and persistent data disk status"
	@echo "  make vm-ip      Print the VM's host-reachable vzNAT IPv4 address"
	@echo "  make vm-check   Run development-environment smoke checks"
	@echo "  make vm-reset   Delete the VM (persistent data is kept by default)"
	@echo "  make backend-build    Build cloud-core inside the Linux VM"
	@echo "  make backend-test     Run backend tests inside the Linux VM"
	@echo "  make backend-lint     Run gofmt check and go vet inside the Linux VM"
	@echo "  make backend-run      Run cloud-core in the foreground inside the VM"
	@echo "  make backend-install  Install and start cloud-core with systemd"
	@echo "  make backend-docker-check  Exercise Docker API against a temporary container"
	@echo "  make frontend-install  Install locked frontend dependencies on macOS"
	@echo "  make frontend-dev      Start the Vite development server on macOS"
	@echo "  make frontend-test     Run frontend unit and component tests"
	@echo "  make frontend-build    Type-check and build the frontend"
	@echo "  make frontend-storybook  Start component review on port 6006"
	@echo "  make frontend-storybook-build  Build the static Storybook"
	@echo "  make frontend-visual-test  Run responsive Playwright screenshots and a11y checks"
	@echo "  make frontend-analyze  Build frontend bundle composition report"
	@echo "  make frontend-budget   Build and enforce frontend performance budgets"

vm-start:
	@./scripts/vm-start

vm-stop:
	@./scripts/vm-stop

vm-shell:
	@./scripts/vm-shell

vm-status:
	@./scripts/vm-status

vm-ip:
	@./scripts/vm-ip

vm-check:
	@./scripts/vm-check

vm-reset:
	@./scripts/vm-reset

backend-build:
	@./scripts/backend-build

backend-test:
	@./scripts/backend-test

backend-lint:
	@./scripts/backend-lint

backend-run:
	@./scripts/backend-run

backend-install:
	@./scripts/backend-install

backend-docker-check:
	@./scripts/backend-docker-check

frontend-install:
	@npm ci
	@npm run build:shared

frontend-dev:
	@npm --prefix core/frontend run dev

frontend-test:
	@npm test

frontend-build:
	@npm run build:shared
	@npm --prefix core/frontend run build

frontend-storybook:
	@npm --prefix core/frontend run storybook

frontend-storybook-build:
	@npm --prefix core/frontend run storybook:build

frontend-visual-test:
	@npm --prefix core/frontend run visual:test

frontend-analyze:
	@npm --prefix core/frontend run analyze

frontend-budget:
	@npm --prefix core/frontend run build:budget

.PHONY: frontend-format frontend-format-check frontend-lint frontend-lint-fix frontend-check
frontend-format:
	@npm run format
frontend-format-check:
	@npm run format:check
frontend-lint:
	@npm run lint
frontend-lint-fix:
	@npm run lint -- --fix
frontend-check:
	@npm run format:check
	@npm run lint
	@cd core/frontend && node scripts/check-architecture.mjs
	@npm test
	@npm run build
	@cd core/frontend && node scripts/check-bundle-budget.mjs

.PHONY: dev test lint format format-check build core-backend-build core-frontend-build app-containers-build app-containers-test app-containers-pack platform-bootstrap app-validate app-pack
dev:
	@./scripts/dev
platform-bootstrap:
	@./scripts/platform-bootstrap
build:
	@npm run build
	@./scripts/backend-build
	@./scripts/app-containers-build
	@./scripts/app-files-build
test:
	@go test ./core/backend/... ./apps/containers/backend/... ./apps/files/backend/...
	@npm test
lint:
	@go vet ./core/backend/... ./apps/containers/backend/... ./apps/files/backend/...
	@npm run lint
format:
	@gofmt -w core/backend apps/containers/backend apps/files/backend
	@npm run format
format-check:
	@npm run format:check
core-backend-build: backend-build
core-frontend-build: frontend-build
app-containers-build:
	@./scripts/app-containers-build
app-containers-test:
	@go test ./apps/containers/backend/...
	@npm test -w @usecloud/containers
app-containers-pack:
	@./scripts/app-containers-pack
app-validate:
	@go run ./core/backend/cmd/usecloud app validate "$(APP)"
app-pack:
	@go run ./core/backend/cmd/usecloud app pack "$(APP)" "$(OUTPUT)"

.PHONY: platform-check
platform-check:
	@./scripts/platform-check

.PHONY: packages-check
packages-check:
	@npm run build:shared
	@node scripts/check-npm-packages.mjs

.PHONY: app-files-build app-files-test app-files-pack app-files-sign app-files-install-dev
app-files-build:
	@./scripts/app-files-build
app-files-test:
	@limactl shell --workdir /workspace/usecloudos usecloud-dev -- /usr/local/go/bin/go test ./apps/files/backend/...
	@npm test -w @usecloud/files
app-files-pack:
	@./scripts/app-files-pack
app-files-sign:
	@./scripts/app-sign-dev files
app-files-install-dev:
	@limactl shell --workdir /workspace/usecloudos usecloud-dev -- sudo bash scripts/platform-admin-guest -X POST 'http://127.0.0.1:8080/api/v1/apps/install?confirm=1' --data-binary @artifacts/files-0.2.0.usecloud

.PHONY: files-check
files-check:
	@./scripts/files-check
