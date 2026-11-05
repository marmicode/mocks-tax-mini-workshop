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
import { RecipeCookingMode } from './recipe-cooking-mode.ng';

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([
    { quantity: { amount: 400, unit: 'g' }, name: 'tinned chickpeas' },
    { name: 'tahini' },
  ])
  .withSteps(['Blitz the chickpeas.', 'Add the tahini.', 'Top with the beans.'])
  .build();

describe(RecipeCookingMode, () => {
  it('starts at the first step of the recipe', async () => {
    mountCookingMode(hummus.id);

    await expect
      .element(page.getByTestId('step-counter'))
      .toHaveTextContent('Step 1 of 3');
    await expect
      .element(page.getByTestId('current-step'))
      .toHaveTextContent('Blitz the chickpeas.');
    await expect
      .element(page.getByRole('button', { name: /Previous/ }))
      .toBeDisabled();
  });

  it('goes to the next step', async () => {
    mountCookingMode(hummus.id);

    await expect
      .element(page.getByTestId('step-counter'))
      .toHaveTextContent('Step 1 of 3');

    await page.getByRole('button', { name: /Next/ }).click();

    await expect
      .element(page.getByTestId('step-counter'))
      .toHaveTextContent('Step 2 of 3');
    await expect
      .element(page.getByTestId('current-step'))
      .toHaveTextContent('Add the tahini.');
  });

  it('goes back to the previous step', async () => {
    mountCookingMode(hummus.id);

    await page.getByRole('button', { name: /Next/ }).click();
    await expect
      .element(page.getByTestId('step-counter'))
      .toHaveTextContent('Step 2 of 3');

    await page.getByRole('button', { name: /Previous/ }).click();

    await expect
      .element(page.getByTestId('step-counter'))
      .toHaveTextContent('Step 1 of 3');
  });

  it('wishes a nice meal on the last step', async () => {
    mountCookingMode(hummus.id);

    await page.getByRole('button', { name: /Next/ }).click();
    await expect
      .element(page.getByTestId('step-counter'))
      .toHaveTextContent('Step 2 of 3');
    await page.getByRole('button', { name: /Next/ }).click();

    await expect
      .element(page.getByTestId('step-counter'))
      .toHaveTextContent('Step 3 of 3');
    await expect
      .element(page.getByRole('button', { name: /Next/ }))
      .toBeDisabled();
    await expect
      .element(page.getByTestId('done-message'))
      .toMatchTextContent('Enjoy your meal!');
  });

  it('lists ingredients as a checklist', async () => {
    mountCookingMode(hummus.id);

    await expect.poll(checklist).toEqual(['tinned chickpeas', 'tahini']);
  });

  it('shows a message when the recipe does not exist', async () => {
    mountCookingMode('missing');

    await expect
      .element(page.getByTestId('recipe-not-found'))
      .toHaveTextContent('This recipe does not exist.');
  });
});

function mountCookingMode(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([hummus]);

  TestBed.createComponent(RecipeCookingMode, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });
}

function checklist() {
  return page
    .getByRole('checkbox')
    .elements()
    .map((el) => {
      const input = el as HTMLInputElement;
      return [...(input.labels ?? [])]
        .map((label) => label.textContent?.trim() ?? '')
        .join('');
    });
}
