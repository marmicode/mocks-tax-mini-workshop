import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import {
  provideLocalStorageFake,
  provideRandomAdapterFake,
} from '@whiskmate/shared/infra';
import { MenuBuilder } from './menu-builder.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const fritters = recipeMother
  .withBasicInfo({ name: 'Courgette and Herb Fritters', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(MenuBuilder, () => {
  it('searches recipes for each course', async () => {
    mountMenuBuilder({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
          .withManyIngredients()
          .build(),
        recipeMother.withBasicInfo('Shakshuka').withManySteps().build(),
        cheesecake,
      ],
    });

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
  });

  it('shows a three-course menu', async () => {
    mountMenuBuilder();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
  });

  it('swaps the starter', async () => {
    mountMenuBuilder();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);

    await page.getByRole('button', { name: 'Swap starter' }).click();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Courgette and Herb Fritters',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
  });

  it('shows an empty course when the catalog has no recipe for it', async () => {
    mountMenuBuilder({ recipes: [hummus, shakshuka] });

    await expect
      .element(page.getByTestId('course-dessert').getByTestId('no-recipe'))
      .toMatchTextContent('No dessert available.');
  });

  it('plans the main course on the picked weekday', async () => {
    const { mealPlanStore } = mountMenuBuilder();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);

    await page.getByRole('button', { name: 'Add menu to meal plan' }).click();
    await page.getByRole('button', { name: 'Friday' }).click();

    await expect
      .poll(() => mealPlanStore.assignments().friday)
      .toBe(shakshuka.id);
    await expect
      .element(page.getByTestId('added-message'))
      .toMatchTextContent('Menu planned for friday.');
  });
});

function mountMenuBuilder({
  recipes = [hummus, fritters, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRandomAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const mealPlanStore = TestBed.inject(MealPlanStore);

  TestBed.createComponent(MenuBuilder);

  return { mealPlanStore };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
