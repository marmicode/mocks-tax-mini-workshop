import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { App } from './app';
import { appRoutes } from './app.routes';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe(App, () => {
  it('redirects to the search page and searches all recipes', async () => {
    const { router, search } = mountApp();

    await router.navigateByUrl('/');

    await expect
      .element(page.getByRole('heading', { name: 'Shakshuka' }))
      .toBeVisible();
    expect(router.url).toBe('/search');
    expect(search).toHaveBeenCalledOnce();
  });

  it('searches all recipes again when coming back to the search page', async () => {
    const { router, search } = mountApp();

    await router.navigateByUrl('/search');
    await expect
      .element(page.getByRole('heading', { name: 'Shakshuka' }))
      .toBeVisible();
    await router.navigateByUrl('/meal-plan');
    await expect
      .element(page.getByRole('heading', { name: 'Meal plan' }))
      .toBeVisible();
    await router.navigateByUrl('/search');

    await expect
      .element(page.getByRole('heading', { name: 'Shakshuka' }))
      .toBeVisible();
    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('does not search recipes on the meal plan page', async () => {
    const { router, search, findById, mealPlanStore } = mountApp();
    vi.spyOn(mealPlanStore, 'assignments').mockReturnValue({
      monday: 'shakshuka',
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    });

    await router.navigateByUrl('/meal-plan');

    await expect.element(page.getByText('Shakshuka')).toBeVisible();
    expect(search).not.toHaveBeenCalled();
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('navigates from the meal plan to the search page through the navbar', async () => {
    const { router, search } = mountApp();

    await router.navigateByUrl('/meal-plan');
    await expect
      .element(page.getByRole('heading', { name: 'Meal plan' }))
      .toBeVisible();
    await page.getByRole('link', { name: /Search/ }).click();

    await expect
      .element(page.getByRole('heading', { name: 'Shakshuka' }))
      .toBeVisible();
    expect(router.url).toBe('/search');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows the admin link once signed in', async () => {
    const { router, search } = mountApp();

    await router.navigateByUrl('/search');
    await expect
      .element(page.getByRole('link', { name: /Search/ }))
      .toBeVisible();
    expect(page.getByRole('button', { name: /Admin/ }).query()).toBeNull();
    expect(page.getByRole('link', { name: /Admin/ }).query()).toBeNull();

    await page.getByRole('button', { name: /Sign in/ }).click();

    await expect
      .element(page.getByRole('button', { name: /Admin/ }))
      .toBeVisible();
    expect(search.mock.calls).toMatchSnapshot();
    expect(navLabels()).toEqual([
      'Search',
      'Discover',
      'Meal plan',
      'Shopping list',
      'Admin',
    ]);
  });
});

function mountApp() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(appRoutes),
      provideLocationMocks(),
      {
        provide: LocalStorage,
        useValue: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
        },
      },
    ],
  });

  const recipeRepository = TestBed.inject(RecipeRepository);
  const search = vi
    .spyOn(recipeRepository, 'search')
    .mockImplementation(({ courses }) =>
      of(
        courses.length > 0
          ? [shakshuka].filter((recipe) => courses.includes(recipe.course))
          : [shakshuka],
      ),
    );
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(shakshuka));
  const mealPlanStore = TestBed.inject(MealPlanStore);
  const router = TestBed.inject(Router);

  TestBed.createComponent(App);

  return { router, search, findById, mealPlanStore };
}

function navLabels() {
  return [
    ...page.getByRole('navigation').element().querySelectorAll('.nav-item .label'),
  ].map((label) => label.textContent?.trim() ?? '');
}
