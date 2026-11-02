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
import { FiveIngredientRecipes } from './five-ingredient-recipes.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .build();

const tagine = recipeMother
  .withBasicInfo('Lamb Tagine')
  .withManyIngredients()
  .build();

describe(FiveIngredientRecipes, () => {
  it('searches recipes with at most five ingredients', async () => {
    mountFiveIngredientRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('shows the five-ingredient recipes', async () => {
    mountFiveIngredientRecipes({
      recipes: [hummus, salad],
    });

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('narrows the search with keywords', async () => {
    mountFiveIngredientRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);

    await page.getByLabelText('Keywords').fill('hummus');

    await expect.poll(recipeNames).toEqual(['Hummus with Ful']);
  });

  it('searches again once keywords are cleared', async () => {
    mountFiveIngredientRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);

    await page.getByLabelText('Keywords').fill('salad');
    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No five-ingredient recipes found');

    await page.getByLabelText('Keywords').fill('');

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('shows a message when there are no five-ingredient recipes', async () => {
    mountFiveIngredientRecipes({ recipes: [tagine] });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No five-ingredient recipes found');
  });
});

function mountFiveIngredientRecipes({
  recipes = [hummus, salad, tagine],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(FiveIngredientRecipes);
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
