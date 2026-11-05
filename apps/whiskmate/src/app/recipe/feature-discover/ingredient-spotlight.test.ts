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
import {
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
import { IngredientSpotlight } from './ingredient-spotlight.ng';

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([{ name: '400g chickpeas' }, { name: 'Tahini' }])
  .build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .withIngredients([{ name: '2 aubergines, burnt' }, { name: 'tahini' }])
  .build();

describe(IngredientSpotlight, () => {
  it('picks a random ingredient among all distinct ingredients', async () => {
    mountIngredientSpotlight({ pickIndex: -1 });

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('tahini');
  });

  it('shows the recipes using the spotlighted ingredient', async () => {
    mountIngredientSpotlight({ pickIndex: -1 });

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('tahini');
    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('only shows recipes using the spotlighted ingredient', async () => {
    mountIngredientSpotlight();

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('aubergines');
    await expect
      .poll(recipeNames)
      .toEqual(['Burnt Aubergine with Tahini and Pomegranate']);
  });

  it('spotlights another ingredient when asked', async () => {
    const { randomAdapterFake } = mountIngredientSpotlight();

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('aubergines');

    randomAdapterFake.setPickIndex(-1);
    await page.getByRole('button', { name: 'Another ingredient' }).click();

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('tahini');
  });

  it('shows a message when there is no ingredient to spotlight', async () => {
    mountIngredientSpotlight({ recipes: [] });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No ingredient to put in the spotlight');
  });
});

function mountIngredientSpotlight({
  recipes = [hummus, salad],
  pickIndex,
}: { recipes?: Recipe[]; pickIndex?: number } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideRandomAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const randomAdapterFake = TestBed.inject(RandomAdapterFake);
  if (pickIndex != null) {
    randomAdapterFake.setPickIndex(pickIndex);
  }

  TestBed.createComponent(IngredientSpotlight);

  return { randomAdapterFake };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
