import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage, RandomAdapter } from '@whiskmate/shared/infra';
import { MealPlanRandomWeek } from './meal-plan-random-week.ng';

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

const fullWeek: WeekdayAssignments = {
  monday: 'harissa-chicken',
  tuesday: 'harissa-chicken',
  wednesday: 'harissa-chicken',
  thursday: 'harissa-chicken',
  friday: 'harissa-chicken',
  saturday: 'harissa-chicken',
  sunday: 'harissa-chicken',
};

describe(MealPlanRandomWeek, () => {
  it('shows a random main for each empty day', async () => {
    const { search } = mountMealPlanRandomWeek({
      ...fullWeek,
      saturday: null,
      sunday: null,
    });
    search.mockImplementation((params) => {
      const responses: Record<string, Recipe[]> = {
        [JSON.stringify({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: null,
          courses: [],
        })]: [shakshuka, lambKofte],
        [JSON.stringify({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: 4,
          courses: [],
        })]: [shakshuka],
      };
      const key = JSON.stringify(params);
      return key in responses
        ? of(responses[key])
        : throwError(() => new Error(`unexpected search ${key}`));
    });

    await expect
      .poll(() => randomPicks())
      .toEqual([
        'Saturday: Shakshuka',
        'Sunday: Lamb Kofte with Yogurt and Sumac',
      ]);
  });

  it('only picks quick recipes when asked', async () => {
    const { search } = mountMealPlanRandomWeek({
      ...fullWeek,
      sunday: null,
    });

    await expect
      .element(page.getByTestId('random-pick'))
      .toHaveTextContent('Sunday: Shakshuka');
    await page.getByRole('checkbox', { name: 'Quick recipes only' }).click();

    await expect.poll(() => search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 4,
      courses: [],
    });
  });

  it('shuffles the picks again', async () => {
    const { search, pick } = mountMealPlanRandomWeek({
      ...fullWeek,
      sunday: null,
    });
    search
      .mockImplementationOnce((params) => {
        expect(params).toHaveProperty('courses', []);
        return of([shakshuka, lambKofte]);
      })
      .mockImplementationOnce((params) =>
        params.courses?.length ? of([]) : of([shakshuka, lambKofte]),
      );

    await expect
      .element(page.getByTestId('random-pick'))
      .toHaveTextContent('Sunday: Shakshuka');
    pick.mockImplementation((recipes) => recipes.at(-1));
    await page.getByRole('button', { name: 'Shuffle' }).click();

    await expect
      .poll(() => randomPicks())
      .toEqual(['Sunday: Lamb Kofte with Yogurt and Sumac']);
    expect(search).toHaveBeenCalledTimes(2);
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/meal-plan-random-week-shuffle.calls.json',
    );
  });

  it('applies the picks and goes back to the meal plan', async () => {
    const { search, mealPlanStore, router } = mountMealPlanRandomWeek({
      ...fullWeek,
      friday: null,
    });
    search.mockImplementation((params) =>
      params.courses.length > 0 ? of([]) : of([lambKofte]),
    );
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await page.getByRole('button', { name: 'Apply' }).click();

    await expect.poll(() => assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'friday',
      recipeId: 'lamb-kofte',
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'meal-plan']);
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

  it('says there is nothing to pick when the week is full', async () => {
    const { search } = mountMealPlanRandomWeek(fullWeek);
    search.mockReturnValue(of([shakshuka]));

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    await expect.element(page.getByTestId('no-picks')).toBeVisible();
  });
});

function mountMealPlanRandomWeek(assignments: WeekdayAssignments) {
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
    .mockReturnValue(of([shakshuka]));
  const pick = vi
    .spyOn(TestBed.inject(RandomAdapter), 'pick')
    .mockImplementation((items) => items[0]);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  vi.spyOn(mealPlanStore, 'assignments').mockReturnValue(assignments);
  const router = TestBed.inject(Router);

  TestBed.createComponent(MealPlanRandomWeek);

  return { search, pick, mealPlanStore, router };
}

function randomPicks() {
  return page
    .getByTestId('random-pick')
    .elements()
    .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}
