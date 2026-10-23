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

Recipe search is covered by `RecipeRepositoryFake`. The fake and the HTTP repository share one contract, `verifyRecipeRepositoryContract`.

## 🎯 Goal

Show the drama of mocks, with the same prompt as 101, on a suite whose search behavior lives in one fake.

## 📝 Steps

#### 1. Prompt the agent with the same text.

```text
Backend search endpoint's courses is now a required array, fix that.
Do not start the server, look at source code in apps/server, or look at git history.
```

#### 2. Compare the two runs.

Put the 101 diff next to this one.

- How many files moved?
- Which tests failed before the agent edited them?
- After the change, what does `courses: []` mean for a search that should return every recipe?

:::warning
Leave the server off. The prompt is the whole exercise.
:::
