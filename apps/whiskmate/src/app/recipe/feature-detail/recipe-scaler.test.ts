import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeScaler } from './recipe-scaler.ng';

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [
    { quantity: { amount: 250, unit: 'g' }, name: 'ricotta' },
    { quantity: { amount: 3, unit: '' }, name: 'eggs' },
    { name: 'zest of 2 lemons' },
  ],
  steps: [],
};

describe(RecipeScaler, () => {
  it('shows quantities for 4 servings by default', async () => {
    const { findById, scaledIngredients } = mountRecipeScaler(
      'lemon-ricotta-cheesecake',
    );

    await expect
      .poll(() => scaledIngredients())
      .toEqual(['250 g ricotta', '3 eggs', 'zest of 2 lemons']);
    expect(findById).toHaveBeenCalledExactlyOnceWith({
      id: 'lemon-ricotta-cheesecake',
    });
  });

  it('doubles quantities for 8 servings', async () => {
    const { findById, scaledIngredients } = mountRecipeScaler(
      'lemon-ricotta-cheesecake',
    );

    await page.getByLabelText('Servings').fill('8');

    await expect
      .poll(() => scaledIngredients())
      .toEqual(['500 g ricotta', '6 eggs', 'zest of 2 lemons']);
    expect(findById).toHaveBeenCalledExactlyOnceWith({
      id: 'lemon-ricotta-cheesecake',
    });
  });

  it('rounds scaled quantities to one decimal', async () => {
    const { scaledIngredients } = mountRecipeScaler('lemon-ricotta-cheesecake');

    await page.getByLabelText('Servings').fill('3');

    await expect
      .poll(() => scaledIngredients())
      .toEqual(['187.5 g ricotta', '2.3 eggs', 'zest of 2 lemons']);
  });

  it('ignores invalid servings', async () => {
    mountRecipeScaler('lemon-ricotta-cheesecake');

    await page.getByLabelText('Servings').fill('0');

    await expect
      .element(page.getByRole('listitem').filter({ hasText: 'ricotta' }))
      .toHaveTextContent('250 g ricotta');
  });

  it('shows a message when the recipe does not exist', async () => {
    const { findById } = mountRecipeScaler('missing');
    findById.mockReturnValue(of(undefined));

    await expect
      .element(page.getByText('This recipe does not exist.'))
      .toHaveTextContent('This recipe does not exist.');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
  });
});

function mountRecipeScaler(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(cheesecake));

  TestBed.createComponent(RecipeScaler, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });

  return {
    findById,
    scaledIngredients: () =>
      page
        .getByRole('listitem')
        .elements()
        .map((el) => el.textContent?.trim() ?? ''),
  };
}
