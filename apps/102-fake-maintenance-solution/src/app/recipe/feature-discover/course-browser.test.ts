import { inputBinding, signal } from '@angular/core';
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
import type { Course, Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { CourseBrowser } from './course-browser.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

const brownies = recipeMother
  .withBasicInfo({ name: 'Tahini and Halva Brownies', course: 'dessert' })
  .build();

describe(CourseBrowser, () => {
  it('searches recipes of the course', async () => {
    mountCourseBrowser('dessert');

    await expect
      .poll(recipeNames)
      .toEqual(['Lemon and Ricotta Cheesecake', 'Tahini and Halva Brownies']);
  });

  it('shows the course title and its recipes', async () => {
    mountCourseBrowser('dessert', {
      recipes: [cheesecake, brownies],
    });

    await expect
      .element(page.getByRole('heading', { name: 'Desserts' }))
      .toHaveTextContent('Desserts');
    await expect
      .poll(recipeNames)
      .toEqual(['Lemon and Ricotta Cheesecake', 'Tahini and Halva Brownies']);
  });

  it('searches again when the course changes', async () => {
    const { course } = mountCourseBrowser('dessert');

    await expect
      .element(page.getByRole('heading', { name: 'Desserts' }))
      .toHaveTextContent('Desserts');

    course.set('starter');

    await expect
      .element(page.getByRole('heading', { name: 'Starters' }))
      .toHaveTextContent('Starters');
    await expect.poll(recipeNames).toEqual(['Hummus with Ful']);
  });

  it('shows a message when the course has no recipes', async () => {
    mountCourseBrowser('main', {
      recipes: [hummus, cheesecake],
    });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No recipes in this course yet');
  });

  it('adds a recipe to favorites', async () => {
    const { userFavorites } = mountCourseBrowser('dessert', {
      recipes: [cheesecake],
    });

    await page.getByRole('button', { name: 'Add to favorites' }).click();

    await expect
      .poll(() => userFavorites.favoriteIds())
      .toEqual(new Set([cheesecake.id]));
  });

  it('assigns a recipe to the picked weekday', async () => {
    const { mealPlanStore } = mountCourseBrowser('dessert', {
      recipes: [cheesecake],
    });

    await page.getByRole('button', { name: 'Add to meal plan' }).click();
    await page.getByRole('button', { name: 'Sunday' }).click();

    await expect
      .poll(() => mealPlanStore.assignments().sunday)
      .toBe(cheesecake.id);
  });
});

function mountCourseBrowser(
  initialCourse: Course,
  {
    recipes = [hummus, shakshuka, cheesecake, brownies],
  }: { recipes?: Recipe[] } = {},
) {
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
  const course = signal(initialCourse);

  TestBed.createComponent(CourseBrowser, {
    bindings: [inputBinding('course', course)],
  });

  return { course, userFavorites, mealPlanStore };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
