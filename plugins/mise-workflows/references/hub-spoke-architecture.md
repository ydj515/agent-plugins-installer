# Hub-Spoke Architecture

## Purpose

This document describes running `mise.toml` as a root hub and child spokes in monorepos or multi-domain repositories.

## When to Use It

- You want only shared tools and runtimes at the root
- env and task needs differ widely between subdirectories
- Experimental, service, and batch directories have different workflows

## Hub Responsibilities

The root `mise.toml` owns:

- `monorepo_root = true` and the `[monorepo] config_roots` list
- Shared `[tools]`
- Shared `[env]`
- Lockfile policy (`[monorepo] lockfile`)
- Organization-wide task entry points (`lint-all`, `test-all`, and so on)
- Default profile routing

Keep the root file lean and delegate domain-specific tasks and env to the children. When it grows by topic, split it into `.config/mise/conf.d/*.toml` fragments. Do not put dots in fragment names (`node-tools.toml`).

## Spoke Responsibilities

A child directory's `mise.toml` owns:

- Domain-specific `[env]` extensions or overrides
- Domain-specific `[tasks]`
- Extra tools only that domain needs
- Local-only settings for that directory

## Inheritance Rules

- Child configs share the parent's tool and runtime context. If a child declares the same tool again, the child's value wins in that directory.
- Child env extends the parent env; override only when necessary.
- Assume local config applies only at the directory level.
- Trusting the root also trusts the configs below it (except in paranoid mode).

## Recommended Patterns

- Keep only shared runtimes, the shared secrets loading strategy, and orchestration tasks in the hub
- Define domain work such as build/test/run in the spokes
- Reference another spoke's task by its root path, such as `//services/api:build`
- Classify the profile in the hub first, and have spokes read the extra ecosystem references they need

## Patterns to Avoid

- Declaring the same tool selector in the root and in child directories
- Redefining shared policy in a spoke
- Putting every task in the root
- Relying on automatic discovery without `config_roots` (deprecated)
