import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it, onTestFinished, vi } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { WEEKDAYS } from '@whiskmate/shared/model';
import { MealPlanShare } from './meal-plan-share.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const emptyAssignments: WeekdayAssignments = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

const emptyWeek = [
  'Monday: —',
  'Tuesday: —',
  'Wednesday: —',
  'Thursday: —',
  'Friday: —',
  'Saturday: —',
  'Sunday: —',
].join('\n');

describe(MealPlanShare, () => {
  it('shows the week as text', async () => {
    mountMealPlanShare({
      ...emptyAssignments,
      wednesday: shakshuka.id,
    });

    await expect
      .poll(() => mealPlanText())
      .toBe(
        [
          'Monday: —',
          'Tuesday: —',
          'Wednesday: Shakshuka',
          'Thursday: —',
          'Friday: —',
          'Saturday: —',
          'Sunday: —',
        ].join('\n'),
      );
  });

  it('shows an empty week when nothing is planned', async () => {
    mountMealPlanShare(emptyAssignments);

    await expect.poll(() => mealPlanText()).toBe(emptyWeek);
  });

  it('copies the text to the clipboard', async () => {
    mountMealPlanShare({
      ...emptyAssignments,
      monday: shakshuka.id,
    });
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    onTestFinished(() => {
      vi.restoreAllMocks();
    });

    await expect.element(page.getByTestId('meal-plan-text')).toBeVisible();
    await page.getByRole('button', { name: 'Copy' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Copied!' }))
      .toBeVisible();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('Monday: Shakshuka'),
    );
  });
});

function mountMealPlanShare(assignments: WeekdayAssignments) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes([shakshuka]);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  planWeek(mealPlanStore, assignments);

  TestBed.createComponent(MealPlanShare);
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

function mealPlanText() {
  return page.getByTestId('meal-plan-text').element().textContent ?? undefined;
}
