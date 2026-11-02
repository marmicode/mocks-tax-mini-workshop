import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage, RandomAdapter } from '@whiskmate/shared/infra';
import { MenuBuilder } from './menu-builder.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const fritters: Recipe = {
  id: 'courgette-fritters',
  course: 'starter',
  name: 'Courgette and Herb Fritters',
  description: null,
  pictureUri: 'https://example.com/fritters.jpg',
  ingredients: [],
  steps: [],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

describe(MenuBuilder, () => {
  it('searches recipes for each course', async () => {
    const { search } = mountMenuBuilder();

    await expect.poll(() => search.mock.calls.length).toBe(3);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(search).toHaveBeenNthCalledWith(3, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('shows a three-course menu', async () => {
    const { search } = mountMenuBuilder();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
    expect(search).toHaveBeenCalledTimes(3);
  });

  it('swaps the starter', async () => {
    const { search } = mountMenuBuilder();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);

    await page.getByRole('button', { name: 'Swap starter' }).click();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Courgette and Herb Fritters',
        'Shakshuka',
        'Lemon and Ricotta Cheesecake',
      ]);
    expect(search).toHaveBeenCalledTimes(4);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
  });

  it('shows an empty course when the catalog has no recipe for it', async () => {
    const { search } = mountMenuBuilder();
    search.mockImplementation(({ courses }) =>
      of(courses?.includes('dessert') ? [] : [shakshuka]),
    );

    await expect
      .element(page.getByTestId('course-dessert').getByTestId('no-recipe'))
      .toMatchTextContent('No dessert available.');
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('plans the main course on the picked weekday', async () => {
    const { search, mealPlanStore } = mountMenuBuilder();
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Add menu to meal plan' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Friday' }))
      .toBeVisible();
    await page.getByRole('button', { name: 'Friday' }).click();

    await expect
      .element(page.getByTestId('added-message'))
      .toMatchTextContent('Menu planned for friday.');
    expect(search).toHaveBeenCalledTimes(3);
    expect(assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'friday',
      recipeId: 'shakshuka',
    });
  });
});

function mountMenuBuilder() {
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
    .mockImplementation(({ courses }) =>
      of(
        [hummus, fritters, shakshuka, cheesecake].filter((recipe) =>
          courses?.includes(recipe.course),
        ),
      ),
    );
  vi.spyOn(TestBed.inject(RandomAdapter), 'pick').mockImplementation(
    (items) => items[0],
  );
  const mealPlanStore = TestBed.inject(MealPlanStore);

  TestBed.createComponent(MenuBuilder);

  return { search, mealPlanStore };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
