import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
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

describe(MealPlanShare, () => {
  it('shows the week as text', async () => {
    const { findById } = mountMealPlanShare({
      ...emptyAssignments,
      wednesday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));

    await expect.poll(() => mealPlanText()).toBe(
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
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('does not fetch any recipe when nothing is planned', async () => {
    const { findById } = mountMealPlanShare(emptyAssignments);

    await expect.poll(() => mealPlanText()).toContain('Monday: —');
    expect(findById).not.toHaveBeenCalled();
  });

  it('copies the text to the clipboard', async () => {
    const { findById } = mountMealPlanShare({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);

    await expect.poll(() => mealPlanText()).toContain('Monday: Shakshuka');
    await page.getByRole('button', { name: 'Copy' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Copied!' }))
      .toBeVisible();
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('Monday: Shakshuka'),
    );
  });
});

function mountMealPlanShare(assignments: WeekdayAssignments) {
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

  const findById = vi
    .spyOn(TestBed.inject(RecipeRepository), 'findById')
    .mockReturnValue(of(undefined));
  const mealPlanStore = TestBed.inject(MealPlanStore);
  vi.spyOn(mealPlanStore, 'assignments').mockReturnValue(assignments);

  TestBed.createComponent(MealPlanShare);

  return { findById, mealPlanStore };
}

function mealPlanText() {
  return page.getByTestId('meal-plan-text').element().textContent ?? '';
}
