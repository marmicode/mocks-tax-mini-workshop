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
import { RecipeKeywordChips } from './recipe-keyword-chips.ng';

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .build();

const lentilSoup = recipeMother.withBasicInfo('Red Lentil Soup').build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

describe(RecipeKeywordChips, () => {
  it('searches recipes matching the typed prefix', async () => {
    mountRecipeKeywordChips({
      /* A dessert with many ingredients and steps: only the prefix filters. */
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withManyIngredients()
          .withManySteps()
          .build(),
        shakshuka,
      ],
    });

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('le');

    await expect.poll(chipLabels).toEqual(['lemon']);
  });

  it('shows a chip for each suggested keyword', async () => {
    mountRecipeKeywordChips();

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('le');

    await expect.poll(chipLabels).toEqual(['lemon', 'lentil']);
  });

  it('searches recipes with the picked keyword', async () => {
    mountRecipeKeywordChips();

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('le');
    await page.getByRole('button', { name: 'lentil' }).click();

    await expect.poll(recipeNames).toEqual(['Red Lentil Soup']);
  });

  it('shows a message when the picked keyword matches no recipe', async () => {
    const { recipeRepositoryFake } = mountRecipeKeywordChips();

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('ri');
    await expect
      .element(page.getByRole('button', { name: 'ricotta' }))
      .toBeVisible();

    /* The only "ricotta" recipe is removed meanwhile. */
    recipeRepositoryFake.setRecipes([lentilSoup, shakshuka]);
    await page.getByRole('button', { name: 'ricotta' }).click();

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipes found for "ricotta"');
  });

  it('shows no chip while the prefix is too short', async () => {
    mountRecipeKeywordChips();

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('l');

    await expect
      .element(page.getByRole('searchbox', { name: 'Keyword prefix' }))
      .toHaveValue('l');
    await expect.poll(chipLabels).toEqual([]);
  });
});

function mountRecipeKeywordChips({
  recipes = [cheesecake, lentilSoup, shakshuka],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);

  TestBed.createComponent(RecipeKeywordChips);

  return { recipeRepositoryFake };
}

function chipLabels() {
  return page
    .getByTestId('keyword-chip')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
