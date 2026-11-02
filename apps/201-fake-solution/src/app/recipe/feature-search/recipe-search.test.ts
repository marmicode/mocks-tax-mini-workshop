import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { RecipeSearch } from './recipe-search.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withManySteps()
  .build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .withManyIngredients()
  .build();

describe(RecipeSearch, () => {
  it('searches all recipes on load', async () => {
    mountRecipeSearch();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
  });

  it('renders the recipes returned by the repository', async () => {
    mountRecipeSearch({ recipes: [shakshuka, cheesecake] });

    await expect
      .poll(recipeNames)
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);
  });

  it('shows "no recipes" when the repository returns nothing', async () => {
    mountRecipeSearch({ recipes: [] });

    await expect
      .element(page.getByText('No recipes found'))
      .toHaveTextContent('No recipes found');
  });

  it('searches by keywords', async () => {
    mountRecipeSearch();

    await page.getByLabelText('Keywords').fill('shak');

    await expect.poll(recipeNames).toEqual(['Shakshuka']);
  });

  it('searches by max ingredients', async () => {
    mountRecipeSearch();

    await page.getByLabelText('Max Ingredients').fill('5');

    await expect.poll(recipeNames).toEqual(['Hummus with Ful', 'Shakshuka']);
  });

  it('searches by max steps', async () => {
    mountRecipeSearch();

    await page.getByLabelText('Max Steps').fill('5');

    await expect
      .poll(recipeNames)
      .toEqual(['Hummus with Ful', 'Lemon and Ricotta Cheesecake']);
  });

  it('searches by course', async () => {
    mountRecipeSearch();

    await page.getByRole('button', { name: 'dessert' }).click();

    await expect.poll(recipeNames).toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('searches by multiple courses', async () => {
    mountRecipeSearch();

    await page.getByRole('button', { name: 'starter' }).click();
    await page.getByRole('button', { name: 'dessert' }).click();

    await expect
      .poll(recipeNames)
      .toEqual(['Hummus with Ful', 'Lemon and Ricotta Cheesecake']);
  });

  it('shows all recipes again once every course is unselected', async () => {
    mountRecipeSearch();

    await page.getByRole('button', { name: 'main' }).click();
    await page.getByRole('button', { name: 'main' }).click();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
  });

  it('combines keywords and course', async () => {
    mountRecipeSearch();

    await page.getByLabelText('Keywords').fill('a');

    await expect
      .poll(recipeNames)
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);

    await page.getByRole('button', { name: 'dessert' }).click();

    await expect.poll(recipeNames).toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('combines max ingredients and max steps', async () => {
    mountRecipeSearch();

    await page.getByLabelText('Max Ingredients').fill('5');
    await page.getByLabelText('Max Steps').fill('5');

    await expect.poll(recipeNames).toEqual(['Hummus with Ful']);
  });

  it('searches all recipes again once keywords are cleared', async () => {
    mountRecipeSearch();

    await page.getByLabelText('Keywords').fill('shak');
    await page.getByLabelText('Keywords').fill('');

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
  });

  it('keeps the keywords once the course is unselected', async () => {
    mountRecipeSearch();

    await page.getByLabelText('Keywords').fill('a');
    await page.getByRole('button', { name: 'dessert' }).click();
    await page.getByRole('button', { name: 'dessert' }).click();

    await expect
      .poll(recipeNames)
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);
  });
});

function mountRecipeSearch({
  recipes = [hummus, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).configure({ recipes });

  TestBed.createComponent(RecipeSearch);
}

function recipeNames() {
  return page
    .getByRole('heading')
    .elements()
    .map((element) => element.textContent?.trim() ?? '');
}
