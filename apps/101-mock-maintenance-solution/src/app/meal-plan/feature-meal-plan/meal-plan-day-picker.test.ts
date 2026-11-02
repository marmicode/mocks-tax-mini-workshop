import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import type { Weekday } from '@whiskmate/shared/model';
import { MealPlanDayPicker } from './meal-plan-day-picker.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
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

const lambKofte: Recipe = {
  id: 'lamb-kofte',
  course: 'main',
  name: 'Lamb Kofte with Yogurt and Sumac',
  description: null,
  pictureUri: 'https://example.com/lamb-kofte.jpg',
  ingredients: [],
  steps: [],
};

const emptyAssignments: WeekdayAssignments = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

describe(MealPlanDayPicker, () => {
  it('searches the catalog', async () => {
    const { search } = mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: emptyAssignments,
    });

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('only lists mains', async () => {
    const { search } = mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: emptyAssignments,
    });
    search.mockImplementation((params) =>
      toQueryString(params) === 'keywords='
        ? of([hummus, shakshuka, lambKofte])
        : of([]),
    );

    await expect
      .poll(() => candidateNames())
      .toEqual(['Shakshuka', 'Lamb Kofte with Yogurt and Sumac']);
  });

  it('does not list mains that are already planned', async () => {
    const { search } = mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: { ...emptyAssignments, tuesday: 'shakshuka' },
      catalog: [shakshuka, lambKofte],
    });

    await expect
      .poll(() => candidateNames())
      .toEqual(['Lamb Kofte with Yogurt and Sumac']);
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
      ]
    `);
  });

  it('assigns the picked main and goes back to the meal plan', async () => {
    const { search, mealPlanStore, router } = mountMealPlanDayPicker({
      weekday: 'thursday',
      assignments: emptyAssignments,
      catalog: [shakshuka, lambKofte],
    });
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await page.getByRole('button', { name: 'Pick Shakshuka' }).click();

    await expect.poll(() => assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'thursday',
      recipeId: 'shakshuka',
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'meal-plan']);
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('says there is nothing left to pick when every main is planned', async () => {
    const { search } = mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: { ...emptyAssignments, tuesday: 'shakshuka' },
      catalog: [hummus, shakshuka],
    });

    await expect.element(page.getByTestId('no-candidates')).toBeVisible();
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });
});

function mountMealPlanDayPicker({
  weekday,
  assignments,
  catalog = [],
}: {
  weekday: Weekday;
  assignments: WeekdayAssignments;
  catalog?: Recipe[];
}) {
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
    .mockImplementation(({ courses }) => {
      /* The day picker filters mains itself, it never asks for a course. */
      if (courses.length > 0) {
        throw new Error('Invalid call');
      }
      return of(catalog);
    });
  const mealPlanStore = TestBed.inject(MealPlanStore);
  vi.spyOn(mealPlanStore, 'assignments').mockReturnValue(assignments);
  const router = TestBed.inject(Router);

  TestBed.createComponent(MealPlanDayPicker, {
    bindings: [inputBinding('weekday', () => weekday)],
  });

  return { search, mealPlanStore, router };
}

/**
 * Same encoding as the backend logs: blank filters are dropped.
 */
function toQueryString(params: RecipeSearchParams): string {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value != null && !isEmptyArray(value))
      .map(([key, value]) => [key, String(value)]),
  ).toString();
}

function candidateNames() {
  return page
    .getByTestId('candidate-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
