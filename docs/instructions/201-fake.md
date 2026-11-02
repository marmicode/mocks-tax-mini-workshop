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

## 🎯 Goal

Test that the `RecipeSearch` component filters the recipes by keywords.
Replace the real `RecipeRepository` with an in-memory `RecipeRepositoryFake`.

## 📝 Steps

#### 1. Implement `RecipeRepositoryFake`.

Edit `recipe-repository.fake.ts`. It already exists.

- Make `RecipeRepositoryFake` implement `RecipeRepositoryDef`, the same interface as `RecipeRepository`
- Implement `search`
- Add `configure({ recipes }: { recipes: Recipe[] })` so tests can set the catalog

#### 2. Create a provider utility for the fake.

```ts
export function provideRecipeRepositoryFake(): EnvironmentProviders {
  return makeEnvironmentProviders([RecipeRepositoryFake, { provide: RecipeRepository, useExisting: RecipeRepositoryFake }]);
}
```

Export `provideRecipeRepositoryFake` from `index.ts`, next to `RecipeRepositoryFake`.

#### 3. Filter recipes with the fake.

`recipe-search.test.ts` already mounts `RecipeSearch`. `mountRecipeSearch()` creates the component and returns `getRecipePreviewHeadings()`. That glove returns the locator for the recipe preview headings.

Provide the fake with `provideRecipeRepositoryFake()`, before calling `mountRecipeSearch()`:

```ts
TestBed.configureTestingModule({
  providers: [provideRecipeRepositoryFake()],
});
```

Configure the fake by injecting it:

```ts
TestBed.inject(RecipeRepositoryFake).configure(...);
```

Add a few recipes with `recipeMother`: `recipeMother.withBasicInfo('Burger').build()`.

Implement `it.todo('filters recipes by keywords')`: type a keyword and check those headings.

```sh
pnpm test
```

#### 4. Write the search contract.

`recipe-repository.contract.ts` lists the cases as `it.todo`:

- returns an empty list when no keywords match
- filters by keywords

`recipe-repository.fake.test.ts` runs the contract. Its factory already configures the fake with Burger and Hummus. Leave that catalog as it is.

`recipe-repository.wide.test.ts` runs the same contract against the real `RecipeRepository`. Start the server with `pnpm start-server`. The server already has those recipes amongst others.

Implement the two cases.

```sh
pnpm test
```
