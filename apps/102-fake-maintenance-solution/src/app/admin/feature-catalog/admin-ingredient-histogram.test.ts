import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminIngredientHistogram } from './admin-ingredient-histogram.ng';

describe(AdminIngredientHistogram.name, () => {
  it('searches all recipes', async () => {
    const { fixture } = mountAdminIngredientHistogram({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withSomeIngredients()
          .build(),
        recipeMother.withBasicInfo('Shakshuka').withManyIngredients().build(),
        recipeMother.withBasicInfo('Hummus with Ful').withManySteps().build(),
      ],
    });
    await fixture.whenStable();

    expect(histogram(fixture.nativeElement)).toEqual([
      { ingredientCount: '0', recipeCount: '1' },
      { ingredientCount: '3', recipeCount: '1' },
      { ingredientCount: '8', recipeCount: '1' },
    ]);
  });

  it('shows an empty state when there are no recipes', async () => {
    const { fixture } = mountAdminIngredientHistogram();
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe('No recipes yet.');
  });

  it('counts a single recipe', async () => {
    const { fixture } = mountAdminIngredientHistogram({
      recipes: [
        recipeMother
          .withBasicInfo('Shakshuka')
          .withIngredients([
            { name: 'eggs', quantity: { amount: 6, unit: '' } },
            { name: 'tomatoes', quantity: { amount: 800, unit: 'g' } },
          ])
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(histogram(fixture.nativeElement)).toEqual([
      { ingredientCount: '2', recipeCount: '1' },
    ]);
  });

  it('groups recipes with the same ingredient count', async () => {
    const { fixture } = mountAdminIngredientHistogram({
      recipes: [
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withSomeIngredients()
          .build(),
        recipeMother
          .withBasicInfo('Courgette Fritters')
          .withSomeIngredients()
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(histogram(fixture.nativeElement)).toEqual([
      { ingredientCount: '3', recipeCount: '2' },
    ]);
  });

  it('sorts buckets by ingredient count', async () => {
    const { fixture } = mountAdminIngredientHistogram({
      recipes: [
        recipeMother
          .withBasicInfo('Tahini and Halva Brownies')
          .withManyIngredients()
          .build(),
        recipeMother.withBasicInfo('Hummus with Ful').build(),
        recipeMother.withBasicInfo('Shakshuka').withSomeIngredients().build(),
        recipeMother
          .withBasicInfo('Courgette Fritters')
          .withSomeIngredients()
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(histogram(fixture.nativeElement)).toEqual([
      { ingredientCount: '0', recipeCount: '1' },
      { ingredientCount: '3', recipeCount: '2' },
      { ingredientCount: '8', recipeCount: '1' },
    ]);
  });
});

function mountAdminIngredientHistogram({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminIngredientHistogram);

  return { fixture };
}

function histogram(root: HTMLElement) {
  return [...root.querySelectorAll('[data-testid="histogram-row"]')].map(
    (row) => {
      const [ingredientCount, recipeCount] = [
        ...row.querySelectorAll('td'),
      ].map((cell) => cell.textContent?.trim());
      return { ingredientCount, recipeCount };
    },
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
