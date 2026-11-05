import { inputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Course, Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { CourseBrowser } from './course-browser.ng';

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

const brownies: Recipe = {
  id: 'tahini-halva-brownies',
  course: 'dessert',
  name: 'Tahini and Halva Brownies',
  description: null,
  pictureUri: 'https://example.com/brownies.jpg',
  ingredients: [],
  steps: [],
};

describe(CourseBrowser, () => {
  it('searches recipes of the course', async () => {
    const { search } = mountCourseBrowser('dessert');

    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: ['dessert'],
      });
  });

  it('shows the course title and its recipes', async () => {
    const { search } = mountCourseBrowser('dessert');
    search.mockReturnValue(of([cheesecake, brownies]));

    await expect
      .element(page.getByRole('heading', { name: 'Desserts' }))
      .toHaveTextContent('Desserts');
    await expect
      .poll(recipeNames)
      .toEqual(['Lemon and Ricotta Cheesecake', 'Tahini and Halva Brownies']);
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('searches again when the course changes', async () => {
    const { search, course } = mountCourseBrowser('dessert');

    await expect.poll(() => search.mock.calls.length).toBe(1);
    await expect
      .element(page.getByRole('heading', { name: 'Desserts' }))
      .toBeVisible();

    course.set('starter');

    await expect.poll(() => search.mock.calls.length).toBe(2);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
    await expect
      .element(page.getByRole('heading', { name: 'Starters' }))
      .toHaveTextContent('Starters');
  });

  it('shows a message when the course has no recipes', async () => {
    const { search } = mountCourseBrowser('main');
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipes in this course yet');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('adds a recipe to favorites', async () => {
    const { search, userFavorites } = mountCourseBrowser('dessert');
    search.mockReturnValue(of([cheesecake]));
    const addFavorite = vi
      .spyOn(userFavorites, 'addFavorite')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Add to favorites' }).click();

    await expect
      .poll(() => addFavorite)
      .toHaveBeenCalledExactlyOnceWith('lemon-ricotta-cheesecake');
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('assigns a recipe to the picked weekday', async () => {
    const { search, mealPlanStore } = mountCourseBrowser('dessert');
    search.mockReturnValue(of([cheesecake]));
    vi.spyOn(mealPlanStore, 'canAdd').mockReturnValue(true);
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Add to meal plan' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Sunday' }))
      .toBeVisible();
    await page.getByRole('button', { name: 'Sunday' }).click();

    await expect
      .poll(() => assign)
      .toHaveBeenCalledExactlyOnceWith({
        weekday: 'sunday',
        recipeId: 'lemon-ricotta-cheesecake',
      });
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });
});

function mountCourseBrowser(initialCourse: Course) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: LocalStorage,
        useValue: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
        },
      },
    ],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([cheesecake, brownies]));
  const userFavorites = TestBed.inject(UserFavorites);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  const course = signal(initialCourse);

  TestBed.createComponent(CourseBrowser, {
    bindings: [inputBinding('course', course)],
  });

  return { search, userFavorites, mealPlanStore, course };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
