import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { RecipeScaler } from './recipe-scaler.ng';

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .withIngredients([
    { quantity: { amount: 250, unit: 'g' }, name: 'ricotta' },
    { quantity: { amount: 3, unit: '' }, name: 'eggs' },
    { name: 'zest of 2 lemons' },
  ])
  .build();

describe(RecipeScaler, () => {
  it('shows quantities for 4 servings by default', async () => {
    mountRecipeScaler(cheesecake.id);

    await expect
      .poll(scaledIngredients)
      .toEqual(['250 g ricotta', '3 eggs', 'zest of 2 lemons']);
  });

  it('doubles quantities for 8 servings', async () => {
    mountRecipeScaler(cheesecake.id);

    await expect
      .poll(scaledIngredients)
      .toEqual(['250 g ricotta', '3 eggs', 'zest of 2 lemons']);

    await page.getByLabelText('Servings').fill('8');

    await expect
      .poll(scaledIngredients)
      .toEqual(['500 g ricotta', '6 eggs', 'zest of 2 lemons']);
  });

  it('rounds scaled quantities to one decimal', async () => {
    mountRecipeScaler(cheesecake.id);

    await page.getByLabelText('Servings').fill('3');

    await expect
      .poll(scaledIngredients)
      .toEqual(['187.5 g ricotta', '2.3 eggs', 'zest of 2 lemons']);
  });

  it('ignores invalid servings', async () => {
    mountRecipeScaler(cheesecake.id);

    await expect
      .poll(scaledIngredients)
      .toEqual(['250 g ricotta', '3 eggs', 'zest of 2 lemons']);

    await page.getByLabelText('Servings').fill('0');

    await expect.poll(() => scaledIngredients()[0]).toBe('250 g ricotta');
  });

  it('shows a message when the recipe does not exist', async () => {
    mountRecipeScaler('missing');

    await expect
      .element(page.getByTestId('recipe-not-found'))
      .toMatchTextContent('This recipe does not exist.');
  });
});

function mountRecipeScaler(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([cheesecake]);

  TestBed.createComponent(RecipeScaler, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });
}

function scaledIngredients() {
  return page
    .getByTestId('scaled-ingredient')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
