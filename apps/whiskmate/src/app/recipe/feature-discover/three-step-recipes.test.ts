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
import { ThreeStepRecipes } from './three-step-recipes.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .withSteps(['Burn the aubergine.', 'Dress with tahini.'])
  .build();

const lamb = recipeMother
  .withBasicInfo('Slow-roasted Lamb')
  .withManySteps()
  .build();

describe(ThreeStepRecipes, () => {
  it('searches recipes with at most three steps', async () => {
    mountThreeStepRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('shows the three-step recipes', async () => {
    mountThreeStepRecipes({ recipes: [hummus, salad] });

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('shows the steps of each recipe', async () => {
    mountThreeStepRecipes({ recipes: [salad] });

    await expect
      .poll(steps)
      .toEqual(['Burn the aubergine.', 'Dress with tahini.']);
  });

  it('links each recipe to its detail page', async () => {
    mountThreeStepRecipes({ recipes: [hummus] });

    await expect
      .element(page.getByRole('link', { name: 'Hummus with Ful' }))
      .toHaveTextContent('Hummus with Ful');
    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveAttribute('href', `/recipes/${hummus.id}`);
  });

  it('shows a message when there are no three-step recipes', async () => {
    mountThreeStepRecipes({ recipes: [lamb] });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No three-step recipes found');
  });
});

function mountThreeStepRecipes({
  recipes = [hummus, salad, lamb],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(ThreeStepRecipes);
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function steps() {
  return page
    .getByTestId('recipe-step')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
