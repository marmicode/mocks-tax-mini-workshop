import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { App } from './app';
import { appRoutes } from './app.routes';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

const cassoulet = recipeMother
  .withBasicInfo('Cassoulet')
  .withManyIngredients()
  .build();

const beefWellington = recipeMother
  .withBasicInfo('Beef Wellington')
  .withManySteps()
  .build();

describe(App, () => {
  it('redirects to the search page and searches all recipes', async () => {
    const { router } = mountApp({
      recipes: [shakshuka, cheesecake, cassoulet, beefWellington],
    });

    await router.navigateByUrl('/');

    await expect
      .poll(() => recipeNames())
      .toEqual([
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
        'Cassoulet',
        'Beef Wellington',
      ]);
    expect.soft(router.url).toBe('/search');
  });

  it('searches all recipes again when coming back to the search page', async () => {
    const { router, recipeRepositoryFake } = mountApp();

    await router.navigateByUrl('/search');
    await expect.element(page.getByTestId('recipe-name')).toBeVisible();
    recipeRepositoryFake.setRecipes([shakshuka, cheesecake]);
    await router.navigateByUrl('/meal-plan');
    await expect
      .element(page.getByRole('heading', { name: 'Meal plan' }))
      .toBeVisible();
    await router.navigateByUrl('/search');

    await expect
      .element(page.getByRole('heading', { name: 'Shakshuka' }))
      .toBeVisible();
    await expect
      .element(
        page.getByRole('heading', { name: 'Lemon and Ricotta Cheesecake' }),
      )
      .toBeVisible();
  });

  it('shows the planned recipes on the meal plan page', async () => {
    const { router, mealPlanStore } = mountApp();
    mealPlanStore.assign({ weekday: 'monday', recipeId: shakshuka.id });

    await router.navigateByUrl('/meal-plan');

    await expect
      .element(page.getByText('Shakshuka', { exact: true }))
      .toBeVisible();
  });

  it('navigates from the meal plan to the search page through the navbar', async () => {
    const { router } = mountApp({
      recipes: [shakshuka, cheesecake, cassoulet, beefWellington],
    });

    await router.navigateByUrl('/meal-plan');
    await expect
      .element(page.getByRole('heading', { name: 'Meal plan' }))
      .toBeVisible();
    await page.getByRole('link', { name: /Search/ }).click();

    await expect
      .poll(() => recipeNames())
      .toEqual([
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
        'Cassoulet',
        'Beef Wellington',
      ]);
    expect.soft(router.url).toBe('/search');
  });

  it('shows the admin link once signed in', async () => {
    const { router } = mountApp();

    await router.navigateByUrl('/search');
    await expect
      .element(page.getByRole('link', { name: /Search/ }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /Admin/ }))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole('button', { name: /Admin/ }))
      .not.toBeInTheDocument();

    await page.getByRole('button', { name: /Sign in/ }).click();

    await expect
      .element(page.getByRole('button', { name: /Admin/ }))
      .toBeVisible();
    expect(navLabels()).toEqual([
      'Search',
      'Discover',
      'Meal plan',
      'Shopping list',
      'Admin',
    ]);
  });
});

function mountApp({ recipes = [shakshuka] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(appRoutes),
      provideLocationMocks(),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  const router = TestBed.inject(Router);

  TestBed.createComponent(App);

  return { router, recipeRepositoryFake, mealPlanStore };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function navLabels() {
  return [
    ...page.getByRole('navigation').element().querySelectorAll('.nav-item .label'),
  ].map((label) => label.textContent?.trim() ?? '');
}
