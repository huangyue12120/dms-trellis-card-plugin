# Frontend Development Guidelines

> Best practices for frontend development in this project.

---

## Overview

This directory contains guidelines for frontend development. Fill in each file with your project's specific conventions.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | To fill |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | To fill |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, data fetching patterns | To fill |
| [State Management](./state-management.md) | Local state, global state, server state | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | v0.3-v0.7.3 data, watcher, UI projection, primary-selection, trusted-root, and settings/State contracts |
| [State-Matrix Contract](./state-matrix-contract.md) | End-to-end parser, Snapshot, projection, and evidence boundaries | Complete |
| [Recovery & Responsive](./recovery-responsive-contract.md) | v0.6 refresh, degraded-state, responsive, and runtime evidence contracts | Complete |
| [Markdown Detail Contract](./markdown-detail-contract.md) | v0.7.1 bounded live-task Markdown request/response and rendering boundary | Complete |
| [Archive Browsing Contract](./archive-browsing-contract.md) | v0.7.2 bounded read-only archive index/page/detail boundary | Complete |
| [Settings and UI State Contract](./settings-state-contract.md) | v0.7.3 settings migration, key-scoped State, reset, and recovery boundary | Complete |
| [Type Safety](./type-safety.md) | Type patterns, validation | To fill |

---

## How to Fill These Guidelines

For each guideline file:

1. Document your project's **actual conventions** (not ideals)
2. Include **code examples** from your codebase
3. List **forbidden patterns** and why
4. Add **common mistakes** your team has made

The goal is to help AI assistants and new team members understand how YOUR project works.

---

**Language**: All documentation should be written in **English**.
