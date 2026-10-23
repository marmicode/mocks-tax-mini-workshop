---
sidebar_label: 101. Mock Maintenance
---

# Mock Maintenance

## Prerequisites

🚨 Did you set up `pnpm`? Are you on the right branch?

👉 [Initial Setup](./000-setup.md)

## Setup

```sh
pnpm cook start 101-mock-maintenance
```

Recipe search is covered by mocks of `RecipeRepository`. The tests record the arguments of `search`, often as snapshots.

## 🎯 Goal

Show the drama of mocks.

There is nothing to design. Paste the prompt, let the agent work, read the diff, then start the app and try search.

## 📝 Steps

#### 1. Prompt the agent.

```text
Backend search endpoint's courses is now a required array, fix that.
Do not start the server, look at source code in apps/server, or look at git history.
```

#### 2. Read the diff.

Count the files. Look at what each updated test actually checks.

#### 3. Start the app and try search.

In one terminal:

```sh
pnpm start-server
```

In another:

```sh
pnpm start
```

Open the app. Search without picking a course, and see whether any recipes show up.
