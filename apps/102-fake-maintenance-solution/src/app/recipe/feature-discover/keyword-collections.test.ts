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
import { KeywordCollections } from './keyword-collections.ng';

const soup = recipeMother.withBasicInfo('Red Lentil Soup').build();

const cake = recipeMother.withBasicInfo('Orange Polenta Cake').build();

const salad = recipeMother.withBasicInfo('Fattoush Salad').build();

describe(KeywordCollections, () => {
  it('searches soups by default', async () => {
    mountKeywordCollections();

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);
  });

  it('shows the recipes of the collection', async () => {
    mountKeywordCollections({ recipes: [soup] });

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);
  });

  it('searches salads when the salads collection is chosen', async () => {
    mountKeywordCollections({
      recipes: [soup, cake, salad],
    });

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);

    await page.getByRole('radio', { name: 'Salads' }).click();

    await expect.poll(recipeNames).toEqual(['Fattoush Salad']);
  });

  it('shows cakes when the cakes collection is chosen', async () => {
    mountKeywordCollections();

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);

    await page.getByRole('radio', { name: 'Cakes' }).click();

    await expect.poll(recipeNames).toEqual(['Orange Polenta Cake']);
  });

  it('shows a message when the collection is empty', async () => {
    mountKeywordCollections();

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);

    await page.getByRole('radio', { name: 'Salads' }).click();

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('Nothing in this collection yet');
    await expect.poll(recipeNames).toEqual([]);
  });
});

function mountKeywordCollections({
  recipes = [soup, cake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(KeywordCollections);
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
