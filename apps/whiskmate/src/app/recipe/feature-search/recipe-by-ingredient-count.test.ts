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
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { RecipeByIngredientCount } from './recipe-by-ingredient-count.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

/* Between the "at most 3" and "at most 5" buttons. */
const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: 'eggs' },
    { name: 'tomatoes' },
    { name: 'peppers' },
    { name: 'onion' },
  ])
  .build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .withManyIngredients()
  .build();

describe(RecipeByIngredientCount, () => {
  it('searches recipes with at most 5 ingredients by default', async () => {
    mountRecipeByIngredientCount();

    await expect.poll(recipeNames).toEqual(['Hummus with Ful', 'Shakshuka']);
  });

  it('shows the matching recipes', async () => {
    mountRecipeByIngredientCount({
      recipes: [hummus, shakshuka],
    });

    await expect.poll(recipeNames).toEqual(['Hummus with Ful', 'Shakshuka']);
  });

  it('counts the matching recipes', async () => {
    mountRecipeByIngredientCount();

    await expect
      .element(page.getByTestId('recipe-count'))
      .toHaveTextContent('2 recipes with at most 5 ingredients');
  });

  it('searches with fewer ingredients when asked', async () => {
    mountRecipeByIngredientCount();

    await expect
      .element(page.getByTestId('recipe-count'))
      .toHaveTextContent('2 recipes with at most 5 ingredients');

    await page.getByRole('button', { name: 'At most 3 ingredients' }).click();

    await expect.poll(recipeNames).toEqual(['Hummus with Ful']);
    await expect
      .element(page.getByTestId('recipe-count'))
      .toHaveTextContent('1 recipes with at most 3 ingredients');
  });

  it('searches with more ingredients when asked', async () => {
    mountRecipeByIngredientCount();

    await page.getByRole('button', { name: 'At most 8 ingredients' }).click();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
    await expect
      .element(page.getByTestId('recipe-count'))
      .toHaveTextContent('3 recipes with at most 8 ingredients');
  });

  it('counts zero recipes when none matches', async () => {
    mountRecipeByIngredientCount({
      recipes: [cheesecake],
    });

    await expect
      .element(page.getByTestId('recipe-count'))
      .toHaveTextContent('0 recipes with at most 5 ingredients');
    await expect.poll(recipeNames).toEqual([]);
  });
});

function mountRecipeByIngredientCount({
  recipes = [hummus, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(RecipeByIngredientCount);
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
