import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
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
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipes found');
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
    await expect.poll(recipeNames).toEqual(['Shakshuka']);

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
    await expect.poll(recipeNames).toEqual(['Shakshuka']);

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
    await expect.poll(recipeNames).toEqual(['Lemon and Ricotta Cheesecake']);

    await page.getByRole('button', { name: 'dessert' }).click();

    await expect
      .poll(recipeNames)
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);
  });

  it('shows "no recipes" when favorites only is checked without any favorite', async () => {
    mountRecipeSearch();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);

    await page.getByRole('checkbox', { name: 'Favorites only' }).click();

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipes found');
    await expect.poll(recipeNames).toEqual([]);
  });

  it('shows only favorites', async () => {
    const { userFavorites } = prepareRecipeSearch();
    userFavorites.addFavorite(cheesecake.id);
    TestBed.createComponent(RecipeSearch);

    await page.getByRole('checkbox', { name: 'Favorites only' }).click();

    await expect.poll(recipeNames).toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('adds a recipe to favorites', async () => {
    const { userFavorites } = mountRecipeSearch({
      recipes: [shakshuka],
    });

    await page.getByRole('button', { name: 'Add to favorites' }).click();

    await expect
      .poll(() => userFavorites.favoriteIds())
      .toEqual(new Set([shakshuka.id]));
  });

  it('removes a recipe from favorites', async () => {
    const { userFavorites } = prepareRecipeSearch({
      recipes: [shakshuka],
    });
    userFavorites.addFavorite(shakshuka.id);
    TestBed.createComponent(RecipeSearch);

    await page.getByRole('button', { name: 'Remove from favorites' }).click();

    await expect.poll(() => userFavorites.favoriteIds()).toEqual(new Set());
  });

  it('assigns a recipe to the picked weekday', async () => {
    const { mealPlanStore } = mountRecipeSearch({
      recipes: [shakshuka],
    });

    await page.getByRole('button', { name: 'Add to meal plan' }).click();
    await page.getByRole('button', { name: 'Wednesday' }).click();

    await expect
      .poll(() => mealPlanStore.assignments().wednesday)
      .toBe(shakshuka.id);
  });

  it('disables add when the recipe is already planned', async () => {
    const { mealPlanStore } = prepareRecipeSearch({
      recipes: [shakshuka],
    });
    mealPlanStore.assign({ weekday: 'monday', recipeId: shakshuka.id });
    TestBed.createComponent(RecipeSearch);

    await expect
      .element(page.getByRole('heading', { name: 'Shakshuka' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeDisabled();
  });
});

function mountRecipeSearch(options?: { recipes?: Recipe[] }) {
  const ready = prepareRecipeSearch(options);
  TestBed.createComponent(RecipeSearch);
  return ready;
}

function prepareRecipeSearch({
  recipes = [hummus, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const userFavorites = TestBed.inject(UserFavorites);
  const mealPlanStore = TestBed.inject(MealPlanStore);

  return { userFavorites, mealPlanStore };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
