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
import { AdminStepHistogram } from './admin-step-histogram.ng';

describe(AdminStepHistogram, () => {
  it('searches all recipes', async () => {
    mountAdminStepHistogram({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withSomeSteps()
          .build(),
        recipeMother.withBasicInfo('Shakshuka').withManySteps().build(),
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withManyIngredients()
          .build(),
      ],
    });

    await expect
      .poll(() => histogram())
      .toEqual([
        { stepCount: '0', recipeCount: '1' },
        { stepCount: '3', recipeCount: '1' },
        { stepCount: '8', recipeCount: '1' },
      ]);
  });

  it('shows an empty state when there are no recipes', async () => {
    mountAdminStepHistogram();

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('No recipes yet.');
  });

  it('counts a single recipe', async () => {
    mountAdminStepHistogram({
      recipes: [
        recipeMother.withBasicInfo('Shakshuka').withSomeSteps().build(),
      ],
    });

    await expect
      .poll(() => histogram())
      .toEqual([{ stepCount: '3', recipeCount: '1' }]);
  });

  it('groups recipes with the same step count', async () => {
    mountAdminStepHistogram({
      recipes: [
        recipeMother.withBasicInfo('Hummus with Ful').withSomeSteps().build(),
        recipeMother
          .withBasicInfo('Courgette Fritters')
          .withSomeSteps()
          .build(),
      ],
    });

    await expect
      .poll(() => histogram())
      .toEqual([{ stepCount: '3', recipeCount: '2' }]);
  });

  it('sorts buckets by step count, including recipes without steps', async () => {
    mountAdminStepHistogram({
      recipes: [
        recipeMother
          .withBasicInfo('Tahini and Halva Brownies')
          .withManySteps()
          .build(),
        recipeMother.withBasicInfo('Hummus with Ful').build(),
        recipeMother.withBasicInfo('Shakshuka').withSomeSteps().build(),
      ],
    });

    await expect
      .poll(() => histogram())
      .toEqual([
        { stepCount: '0', recipeCount: '1' },
        { stepCount: '3', recipeCount: '1' },
        { stepCount: '8', recipeCount: '1' },
      ]);
  });
});

function mountAdminStepHistogram({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminStepHistogram);
}

function histogram() {
  return page
    .getByTestId('histogram-row')
    .elements()
    .map((row) => {
      const [stepCount, recipeCount] = [...row.children].map((cell) =>
        cell.textContent?.trim(),
      );
      return { stepCount, recipeCount };
    });
}
