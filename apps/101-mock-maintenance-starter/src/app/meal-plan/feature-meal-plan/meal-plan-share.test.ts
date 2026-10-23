import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe(MealPlanShare.name, () => {
  it('shows the week as text', async () => {
    const { fixture, findById } = mountMealPlanShare({
      ...emptyAssignments,
      wednesday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
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

  it('does not fetch any recipe when nothing is planned', async () => {
    const { fixture, findById } = mountMealPlanShare(emptyAssignments);
    await fixture.whenStable();

    expect(findById).not.toHaveBeenCalled();
    expect(mealPlanText(fixture.nativeElement)).toContain('Monday: —');
  });

  it('copies the text to the clipboard', async () => {
    const { fixture, findById } = mountMealPlanShare({
      ...emptyAssignments,
      monday: 'shakshuka',
    });
    findById.mockReturnValue(of(shakshuka));
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Copy').click();
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
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

  const fixture = TestBed.createComponent(MealPlanShare);

  return { fixture, findById, mealPlanStore };
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
