import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import {
  provideLocalStorageFake,
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
import { WEEKDAYS } from '@whiskmate/shared/model';
import { MealPlanRandomWeek } from './meal-plan-random-week.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

/* A long recipe: 6 steps. */
const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withManySteps()
  .build();

/* A quick recipe: 3 steps. */
const lambKofte = recipeMother
  .withBasicInfo('Lamb Kofte with Yogurt and Sumac')
  .build();

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
    mountMealPlanRandomWeek({
      assignments: { ...fullWeek, saturday: null, sunday: null },
    });

    await expect
      .poll(() => randomPicks())
      .toEqual([
        'Saturday: Shakshuka',
        'Sunday: Lamb Kofte with Yogurt and Sumac',
      ]);
  });

  it('only picks quick recipes when asked', async () => {
    mountMealPlanRandomWeek({
      assignments: { ...fullWeek, sunday: null },
    });

    await expect.poll(() => randomPicks()).toEqual(['Sunday: Shakshuka']);
    await page.getByRole('checkbox', { name: 'Quick recipes only' }).click();

    await expect
      .poll(() => randomPicks())
      .toEqual(['Sunday: Lamb Kofte with Yogurt and Sumac']);
  });

  it('shuffles the picks again', async () => {
    const { randomAdapterFake } = mountMealPlanRandomWeek({
      assignments: { ...fullWeek, sunday: null },
    });

    await expect.poll(() => randomPicks()).toEqual(['Sunday: Shakshuka']);
    randomAdapterFake.setPickIndex(-1);
    await page.getByRole('button', { name: 'Shuffle' }).click();

    await expect
      .poll(() => randomPicks())
      .toEqual(['Sunday: Lamb Kofte with Yogurt and Sumac']);
  });

  it('applies the picks and goes back to the meal plan', async () => {
    const { mealPlanStore, router } = mountMealPlanRandomWeek({
      assignments: { ...fullWeek, friday: null },
      recipes: [lambKofte],
    });

    await expect.element(page.getByTestId('random-pick')).toBeVisible();
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect
      .poll(() => mealPlanStore.assignments().friday)
      .toBe(lambKofte.id);
    await expect.poll(() => router.url).toBe('/meal-plan');
  });

  it('says there is nothing to pick when the week is full', async () => {
    mountMealPlanRandomWeek({ assignments: fullWeek });

    await expect.element(page.getByTestId('no-picks')).toBeVisible();
  });
});

function mountMealPlanRandomWeek({
  assignments,
  recipes = [hummus, shakshuka, lambKofte],
}: {
  assignments: WeekdayAssignments;
  recipes?: Recipe[];
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'meal-plan', children: [] }]),
      provideLocalStorageFake(),
      provideRandomAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const randomAdapterFake = TestBed.inject(RandomAdapterFake);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  planWeek(mealPlanStore, assignments);
  const router = TestBed.inject(Router);

  TestBed.createComponent(MealPlanRandomWeek);

  return { randomAdapterFake, mealPlanStore, router };
}

function planWeek(
  mealPlanStore: MealPlanStore,
  assignments: WeekdayAssignments,
): void {
  for (const weekday of WEEKDAYS) {
    const recipeId = assignments[weekday];
    if (recipeId != null) {
      mealPlanStore.assign({ weekday, recipeId });
    }
  }
}

function randomPicks() {
  return page
    .getByTestId('random-pick')
    .elements()
    .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}
