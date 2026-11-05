import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminIngredientHistogram } from './admin-ingredient-histogram.ng';

describe(AdminIngredientHistogram, () => {
  it('searches all recipes', async () => {
    mountAdminIngredientHistogram({
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

    await expect
      .poll(() => histogram())
      .toEqual([
        { ingredientCount: '0', recipeCount: '1' },
        { ingredientCount: '3', recipeCount: '1' },
        { ingredientCount: '8', recipeCount: '1' },
      ]);
  });

  it('shows an empty state when there are no recipes', async () => {
    mountAdminIngredientHistogram();

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('No recipes yet.');
  });

  it('counts a single recipe', async () => {
    mountAdminIngredientHistogram({
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

    await expect
      .poll(() => histogram())
      .toEqual([{ ingredientCount: '2', recipeCount: '1' }]);
  });

  it('groups recipes with the same ingredient count', async () => {
    mountAdminIngredientHistogram({
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

    await expect
      .poll(() => histogram())
      .toEqual([{ ingredientCount: '3', recipeCount: '2' }]);
  });

  it('sorts buckets by ingredient count', async () => {
    mountAdminIngredientHistogram({
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

    await expect
      .poll(() => histogram())
      .toEqual([
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

  TestBed.createComponent(AdminIngredientHistogram);
}

function histogram() {
  return page
    .getByTestId('histogram-row')
    .elements()
    .map((row) => {
      const [ingredientCount, recipeCount] = [...row.children].map((cell) =>
        cell.textContent?.trim(),
      );
      return { ingredientCount, recipeCount };
    });
}
