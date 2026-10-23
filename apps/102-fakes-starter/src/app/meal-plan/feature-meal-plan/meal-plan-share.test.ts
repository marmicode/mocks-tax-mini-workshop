import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, vi } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { WEEKDAYS } from '@whiskmate/shared/model';
import { MealPlanShare } from './meal-plan-share.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
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

describe(MealPlanShare.name, () => {
  it('shows the week as text', async () => {
    const { fixture } = mountMealPlanShare({
      ...emptyAssignments,
      wednesday: 'shakshuka',
    });
    await fixture.whenStable();

    expect(mealPlanText(fixture.nativeElement)).toBe(
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
    const { fixture } = mountMealPlanShare(emptyAssignments);
    await fixture.whenStable();

    expect(mealPlanText(fixture.nativeElement)).toBe(
      [
        'Monday: —',
        'Tuesday: —',
        'Wednesday: —',
        'Thursday: —',
        'Friday: —',
        'Saturday: —',
        'Sunday: —',
      ].join('\n'),
    );
  });

  it('copies the text to the clipboard', async () => {
    const { fixture } = mountMealPlanShare({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Copy').click();
    await fixture.whenStable();

    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('Monday: Shakshuka'),
    );
    expect(buttonByText(fixture.nativeElement, 'Copied!')).toBeDefined();
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

  const fixture = TestBed.createComponent(MealPlanShare);

  return { fixture, mealPlanStore };
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

function mealPlanText(root: HTMLElement): string | undefined {
  return (
    root.querySelector('[data-testid="meal-plan-text"]')?.textContent ??
    undefined
  );
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
