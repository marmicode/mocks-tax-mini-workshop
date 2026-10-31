---
sidebar_label: 102. Fake Maintenance
---

# Fake Maintenance

## Prerequisites

🚨 Did you set up `pnpm`? Are you on the right branch?

👉 [Initial Setup](./000-setup.md)

Do [101. Mock Maintenance](./101-mock-maintenance.md) first.

## Setup

```sh
pnpm cook start 102-fake-maintenance
```

Recipe search is covered by `RecipeRepositoryFake`.

## 🎯 Goal

Let's see if fakes make things easier.

## 📝 Steps

#### 1. Prompt the agent with the same text.

```text
Backend search endpoint's courses is now a required array, fix that.
Do not start the server, look at source code in apps/server, or look at git history.
```

#### 2. Read the diff.

Analyze the diff.

#### 3. Ask about the default for `courses`.

Read the agent's conversation, or ask it which default it used for `courses`, and why.
