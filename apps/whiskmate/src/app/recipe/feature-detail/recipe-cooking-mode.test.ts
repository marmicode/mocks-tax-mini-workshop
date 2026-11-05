import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeCookingMode } from './recipe-cooking-mode.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [
    { quantity: { amount: 400, unit: 'g' }, name: 'tinned chickpeas' },
    { name: 'tahini' },
  ],
  steps: ['Blitz the chickpeas.', 'Add the tahini.', 'Top with the beans.'],
};

describe(RecipeCookingMode, () => {
  it('fetches the recipe and starts at the first step', async () => {
    const { findById } = mountCookingMode('hummus-ful');

    await expect
      .element(page.getByRole('heading', { name: 'Step 1 of 3' }))
      .toHaveTextContent('Step 1 of 3');
    await expect
      .element(page.getByText('Blitz the chickpeas.'))
      .toHaveTextContent('Blitz the chickpeas.');
    await expect
      .element(page.getByRole('button', { name: /Previous/ }))
      .toBeDisabled();
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'hummus-ful' });
  });

  it('goes to the next step', async () => {
    const { findById } = mountCookingMode('hummus-ful');

    await page.getByRole('button', { name: /Next/ }).click();

    await expect
      .element(page.getByRole('heading', { name: 'Step 2 of 3' }))
      .toHaveTextContent('Step 2 of 3');
    await expect
      .element(page.getByText('Add the tahini.'))
      .toHaveTextContent('Add the tahini.');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'hummus-ful' });
  });

  it('goes back to the previous step', async () => {
    mountCookingMode('hummus-ful');

    await page.getByRole('button', { name: /Next/ }).click();
    await expect
      .element(page.getByRole('heading', { name: 'Step 2 of 3' }))
      .toBeVisible();
    await page.getByRole('button', { name: /Previous/ }).click();

    await expect
      .element(page.getByRole('heading', { name: 'Step 1 of 3' }))
      .toHaveTextContent('Step 1 of 3');
  });

  it('wishes a nice meal on the last step', async () => {
    mountCookingMode('hummus-ful');

    await page.getByRole('button', { name: /Next/ }).click();
    await expect
      .element(page.getByRole('heading', { name: 'Step 2 of 3' }))
      .toBeVisible();
    await page.getByRole('button', { name: /Next/ }).click();

    await expect
      .element(page.getByRole('heading', { name: 'Step 3 of 3' }))
      .toHaveTextContent('Step 3 of 3');
    await expect
      .element(page.getByRole('button', { name: /Next/ }))
      .toBeDisabled();
    await expect
      .element(page.getByTestId('done-message'))
      .toMatchTextContent('Enjoy your meal!');
  });

  it('lists ingredients as a checklist', async () => {
    const { ingredientNames } = mountCookingMode('hummus-ful');

    await expect
      .poll(() => ingredientNames())
      .toEqual(['tinned chickpeas', 'tahini']);
  });

  it('shows a message when the recipe does not exist', async () => {
    const { findById } = mountCookingMode('missing');
    findById.mockReturnValue(of(undefined));

    await expect
      .element(page.getByText('This recipe does not exist.'))
      .toHaveTextContent('This recipe does not exist.');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
  });
});

function mountCookingMode(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(hummus));

  TestBed.createComponent(RecipeCookingMode, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });

  return {
    findById,
    ingredientNames: () =>
      page
        .getByRole('checkbox')
        .elements()
        .map((element) => {
          const input = element as HTMLInputElement;
          return input.labels?.[0]?.textContent?.trim() ?? '';
        }),
  };
}
