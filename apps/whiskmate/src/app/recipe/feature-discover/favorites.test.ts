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
import { Favorites } from './favorites.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .build();

describe(Favorites, () => {
  it('searches all recipes', async () => {
    const baklava = recipeMother
      .withBasicInfo({ name: 'Baklava', course: 'dessert' })
      .build();
    const cassoulet = recipeMother
      .withBasicInfo('Cassoulet')
      .withManyIngredients()
      .build();
    const elaborate = recipeMother
      .withBasicInfo('Shakshuka')
      .withManySteps()
      .build();
    mountFavorites({
      favoriteIds: [baklava.id, cassoulet.id, elaborate.id],
      recipes: [baklava, cassoulet, elaborate],
    });

    await expect
      .poll(recipeNames)
      .toEqual(['Baklava', 'Cassoulet', 'Shakshuka']);
  });

  it('shows only favorite recipes', async () => {
    mountFavorites({ favoriteIds: [cheesecake.id] });

    await expect.poll(recipeNames).toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('shows a message when there are no favorites', async () => {
    mountFavorites({ favoriteIds: [] });

    await expect
      .element(page.getByTestId('no-favorites-message'))
      .toMatchTextContent('You have no favorite recipes yet');
    await expect.poll(recipeNames).toEqual([]);
  });

  it('removes a recipe from favorites', async () => {
    const { userFavorites } = mountFavorites({
      favoriteIds: [shakshuka.id],
    });

    await page.getByRole('button', { name: 'Remove from favorites' }).click();

    await expect.poll(() => userFavorites.favoriteIds()).toEqual(new Set());
  });

  it('disables add when the recipe is already planned', async () => {
    const { mealPlanStore } = prepareFavorites({
      favoriteIds: [shakshuka.id],
    });
    mealPlanStore.assign({ weekday: 'monday', recipeId: shakshuka.id });
    TestBed.createComponent(Favorites);

    await expect
      .element(page.getByRole('heading', { name: 'Shakshuka' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeDisabled();
  });

  it('shows every favorite recipe', async () => {
    mountFavorites({
      favoriteIds: [cheesecake.id, shakshuka.id],
    });

    await expect
      .poll(recipeNames)
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);
  });

  it('ignores favorites that are no longer in the catalog', async () => {
    mountFavorites({ favoriteIds: ['deleted-recipe'] });

    await expect
      .element(page.getByTestId('no-favorites-message'))
      .toBeVisible();
    await expect.poll(recipeNames).toEqual([]);
  });

  it('assigns a favorite recipe to the picked weekday', async () => {
    const { mealPlanStore } = mountFavorites({
      favoriteIds: [shakshuka.id],
    });

    await page.getByRole('button', { name: 'Add to meal plan' }).click();
    await page.getByRole('button', { name: 'Friday' }).click();

    await expect
      .poll(() => mealPlanStore.assignments().friday)
      .toBe(shakshuka.id);
  });

  it('shows a message when the repository returns no recipes', async () => {
    mountFavorites({
      favoriteIds: [shakshuka.id],
      recipes: [],
    });

    await expect
      .element(page.getByTestId('no-favorites-message'))
      .toMatchTextContent('You have no favorite recipes yet');
  });
});

function mountFavorites(options: {
  favoriteIds: string[];
  recipes?: Recipe[];
}) {
  const ready = prepareFavorites(options);
  TestBed.createComponent(Favorites);
  return ready;
}

function prepareFavorites({
  favoriteIds,
  recipes = [shakshuka, cheesecake],
}: {
  favoriteIds: string[];
  recipes?: Recipe[];
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const userFavorites = TestBed.inject(UserFavorites);
  for (const favoriteId of favoriteIds) {
    userFavorites.addFavorite(favoriteId);
  }
  const mealPlanStore = TestBed.inject(MealPlanStore);

  return { userFavorites, mealPlanStore };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
