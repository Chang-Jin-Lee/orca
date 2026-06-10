# Project-First Host Model

## Context

We have been exploring how Orca should make VMs, remote servers, SSH machines,
and future cloud-hosted compute feel first class.

The current implementation direction groups the workspace sidebar by execution
host:

```text
Local Mac
  Project A
    workspace-1
SSH / VM 1
  Project A
    workspace-2
```

That model is useful as an operational view, but it makes the machine feel like
the outermost user concept. After discussion, the stronger long-term product
model is project-first:

```text
Project A
  Local Mac
    workspace-1
  Cloud VM 1
    workspace-2
```

In this model, machines are not separate isolated workspaces. They are places
where a project can be available and where a workspace can run.

## Reference Findings

### Superset

Superset is closest to the desired Orca model.

Its conceptual model is:

```text
Project + Host -> Workspace
```

Specific details:

- A project is the durable repo concept.
- A host is a registered machine that can run workspaces.
- A workspace stores both `projectId` and `hostId`.
- Workspace creation is explicitly host-targeted: pick a project, pick a host,
  then create the workspace on that host.
- The schema has a uniqueness rule for a "main" workspace per
  `(projectId, hostId)`, which means the same project can be materialized on
  multiple hosts.
- Project setup is host-scoped. A project can be cloned or imported on a
  specific host.
- The UI can block workspace creation with "Project not set up on this host."
- Project settings have host-aware pieces like project location and worktree
  location on the selected host.

This maps well to Orca because Orca already thinks in repos/projects,
worktrees, tasks, agents, and terminals.

### Cmux

Cmux is more workspace/session-first.

Its conceptual model is closer to:

```text
Workspace/session -> local or remote execution context
```

Specific details:

- `cmux ssh user@remote` creates a workspace for a remote machine.
- Remote/SSH is a property of the workspace/session.
- Browser panes can route through the remote network, so remote `localhost`
  works naturally.
- File explorer follows SSH workspaces and shows the remote root.
- Remote sessions have remote configuration and reconnect/persistence behavior.
- Cmux has project-specific command config, but it does not appear to center a
  durable "Project is available on hosts X/Y/Z" abstraction.

Cmux is a strong reference for SSH/session polish, but not the best reference
for Orca's project/worktree data model.

## Recommended Orca Model

The recommended durable model is:

```text
Project -> ProjectHostSetup -> Workspace
```

Where:

- `Project` is the durable repo identity.
- `ProjectHostSetup` means "this project is available on this host at this
  path, with this setup state and host-specific config."
- `Workspace` is a branch/task/worktree instance of a project on one host.

Potential names for `ProjectHostSetup`:

- `ProjectInstallation`
- `ProjectHostSetup`
- `ProjectLocation`
- `HostProject`

`ProjectHostSetup` is probably the clearest product/data term for now.

## Data Model Shape

### Project

Project-global state:

- id
- display name
- repo identity / provider metadata
- icon/color
- default branch
- Git provider linkage
- project-global settings

### Host

Host-global state:

- id
- kind: local, SSH, runtime, cloud VM
- label
- online/health/compatibility status
- platform/capabilities
- host-wide settings
- agent availability

### ProjectHostSetup

Host-specific project state:

- project id
- host id
- repo path on that host
- worktree base directory on that host
- setup state: not set up, setting up, ready, error, unsupported
- setup method: imported existing folder, cloned repo, provisioned by cloud
- platform/capability constraints
- host-specific project settings
- optional setup/teardown scripts

### Workspace

Workspace state:

- project id
- host id
- project host setup id, if we make that a real id
- branch/worktree name
- worktree path on the host
- task/PR/issue linkage
- agent/terminal/browser resources owned by that host

## UX Model

### Sidebar

Default sidebar should become project-first:

```text
Project A
  feature-login        Local Mac
  benchmark-fix        GPU VM

Project B
  auth-refactor        Work Linux
```

When a project has workspaces on multiple hosts, we can optionally show host
subgroups:

```text
Project A
  Local Mac
    feature-login
  GPU VM
    benchmark-fix
```

Rules:

- If a project only has one host represented, do not add noisy host nesting.
- If a project has multiple hosts, host subgroups can appear automatically.
- Host should remain available as a filter/view mode.
- The current host-first grouping can survive as an alternate operational view,
  but should not be the default mental model.

### Create Workspace

Workspace creation should ask:

1. Which project?
2. What branch/task/name?
3. Which host should run it?
4. If the project is not set up on that host, set it up inline or block with a
   clear action.

Example:

```text
Create workspace

Project: Orca
Branch: feature/remote-hosts
Run on: GPU VM 1

This project is not set up on GPU VM 1.
[Clone repo to host] [Import existing folder] [Cancel]
```

### Set Up Project On A Host

A project settings page should expose which hosts the project is available on:

```text
Project: Orca

Available on:
  Local Mac      Ready       /Users/me/orca
  GPU VM 1       Ready       /home/me/orca
  Work Linux     Not set up  [Set up]
```

Setup methods:

- clone from repo URL into a selected parent directory
- import an existing folder on the host
- future: provision cloud VM and clone automatically

### Add New Host / VM

Adding a host should not automatically attach every project to it.

After adding a host, Orca should offer:

```text
New host connected: GPU VM 1

Make projects available here:
  [ ] Orca         Clone to /home/me/orca
  [ ] Backend      Import existing folder
  [ ] ML Runner    Clone to /mnt/work/ml-runner
```

This is also the natural place for future cloud VM monetization:

1. provision host
2. choose projects to materialize there
3. create workspaces on that host

## Edge Cases

### Project Exists Only On One Host

This is normal. The project has one `ProjectHostSetup`.

The UI should not imply every project can run everywhere.

### Project Requires Linux Or Beefy Hardware

This is also normal. The project can mark local Mac as unsupported or simply not
set up. Create-workspace host choices should only show valid hosts by default,
with an affordance to reveal unavailable hosts and why they are unavailable.

### Work Projects Versus Personal Projects

Do not solve this with host grouping alone. This is better represented by:

- project ownership/account
- project tags/groups
- host availability
- workspace filters

### Existing Project On Computer A, Add To Computer B

Use "Set up project on host":

- clone from remote into a host path, or
- import an existing folder on the host.

### Add VM And Initialize Many Projects

Use a bulk "Make projects available on this host" flow. Each selected project
still needs a per-host location/method.

## What Needs To Change

This is a large model change. It is not just a sidebar reorder.

At a high level, roughly 10 areas need to change.

### 1. Data Model

Add a first-class project-host setup record.

Current host ownership is mostly attached to repos/workspaces through
execution-host IDs. The new model needs a durable record for "project X is
available on host Y at path Z."

### 2. Persistence And Migration

Existing repos/worktrees need to migrate into:

- project records
- host records
- project-host setup records
- workspace records tied to both project and host

For current local-only users, migration should feel invisible: each project gets
a Local Mac setup.

### 3. Sidebar Row Model

The sidebar should group primarily by project, not host.

Host grouping becomes nested under projects only when helpful, or becomes a
filter/view option.

### 4. Workspace Creation

Create workspace needs a host picker that is constrained by project setup.

If the selected host does not have the project, the flow needs setup actions
instead of silently failing or creating an ambiguous remote workspace.

### 5. Project Setup / Add Project

Adding a project must distinguish:

- create a new project identity
- set up that project on this host
- set up an existing project on another host

This likely replaces a single "add repo" flow with a project-first setup flow.

### 6. Project Settings

Project settings need a host selector or host table for host-specific settings:

- repo location
- worktree base dir
- setup scripts
- branch prefix
- platform/capability notes

Project-global settings remain global.

### 7. Host Settings

Host settings remain host-global:

- connection details
- server version/compatibility
- default worktree directory
- agents available on that host
- platform/capabilities

They should not become a separate copy of all project settings.

### 8. Runtime Ownership

Terminals, browser panes, agents, PTYs, filesystem operations, and setup scripts
must route through the workspace's host.

The UI can show project-first organization, but execution still happens on the
owning host.

### 9. Compatibility And Availability

Workspace creation must handle:

- host offline
- project not set up
- host version too old
- client version too old
- unsupported platform
- missing agent on selected host

This should be surfaced before creation where possible.

### 10. CLI / API

CLI and API commands need to accept the project-first model:

```bash
orca project setup --project <id> --host <id> --clone ...
orca workspace create --project <id> --host <id> --branch ...
orca project hosts list <project-id>
```

Existing commands should keep compatibility aliases where possible.

## Implementation Scale

This is probably not a small patch.

Estimated change categories:

1. shared types and persistence
2. migration logic
3. main-process project/host setup APIs
4. renderer store normalization/selectors
5. sidebar grouping and drag/reorder behavior
6. create workspace flow
7. add/setup project flow
8. project settings
9. host settings
10. runtime routing/guards
11. CLI/API updates
12. tests and compatibility coverage

So the answer is: about 10 to 12 meaningful product/engineering surfaces need
to change, with the data model and creation/setup flows being the most important
and highest-risk pieces.

## Recommendation

Use the current host-first sidebar work as a useful transitional and optional
operational view.

For the long-term Orca model, move to project-first:

```text
Project -> ProjectHostSetup -> Workspace
```

This gives us:

- a less jarring experience for local-only users
- clean support for SSH machines and VMs
- clear handling for project exclusivity
- a natural future cloud VM monetization path
- a better fit for repo/worktree/task/agent workflows

