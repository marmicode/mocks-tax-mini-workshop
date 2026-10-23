---
sidebar_label: 201. Fake
---

# Fake

## Prerequisites

🚨 Did you set up `pnpm`? Are you on the right branch?

👉 [Initial Setup](./000-setup.md)

## Setup

```sh
pnpm cook start 201-fake
```

Recipe search is already on screen. `recipeMother` is in `@whiskmate/shared-recipe/testing`. There is no fake, no contract, and no search test yet.

## 🎯 Goal

Cover recipe search with a fake and a contract. Tests assert what the user sees. The fake and the real repository share the contract, and the contract also runs against the API.

## 📝 Steps

#### 1. Add `RecipeRepositoryFake`.

Keep an in-memory catalog and implement `search` with the same rules as the API:

- keywords match the recipe name, ignoring case
- `maxIngredientCount` and `maxStepCount` keep recipes at or under that count
- a missing `courses` field means every recipe
- `courses: []` means no recipe

`setRecipes()` replaces the catalog. `provideRecipeRepositoryFake()` provides the fake as `RecipeRepository`. Build recipes with `recipeMother`. Export both from `@whiskmate/recipe/infra`.

#### 2. Write the search contract once.

`verifyRecipeRepositoryContract(createRecipeRepository)` takes a factory. The factory receives the recipes for that case and returns a `RecipeRepositoryDef`.

Cover search:

- an empty catalog
- every recipe when no filter is set
- keywords, ignoring case
- a max ingredient count
- a max step count
- a list of courses
- an empty course list
- filters combined together

Run it twice:

- `recipe-repository.fake.test.ts` seeds the fake with `setRecipes()`
- `recipe-repository.wide.test.ts` uses the real `RecipeRepository`

The wide test calls `http://localhost:3333`. Start the API with:

```sh
pnpm start-server
```

`RecipeRepository` only has `search`, so the wide test empties the catalog over HTTP, then posts the recipes for the case, before handing the repository to the contract.

#### 3. Test the screen through the fake.

`recipe-filter.test.ts` asserts the criteria `RecipeFilter` emits: one course, several courses, and `courses: null` once every course is cleared.

`recipe-search.test.ts` renders `RecipeSearch` with `provideRecipeRepositoryFake()`. Assert the recipe names on screen:

- the whole catalog on load
- the recipes the fake was given
- "No recipes found" when the catalog is empty
- keywords, max ingredients, max steps
- one course, several courses, and every recipe again once the last course is cleared
- keywords combined with a course
- max ingredients combined with max steps
- the full catalog again once keywords are cleared
- keywords kept once the course is cleared

`app.test.ts` loads `App` against the fake and expects both seeded recipes.

#### 4. Replay the maintenance prompt.

```text
Backend search endpoint's courses is now a required array, fix that.
Do not start the server, look at source code in apps/server, or look at git history.
```

Watch where it fails, and how many files the agent has to touch. Compare that with [101](./101-mock-maintenance.md) and [102](./102-fake-maintenance.md).
