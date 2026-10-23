import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import {
  MealPlanStore,
  type WeekdayAssignments,
} from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { MealPlanAutoFill } from './meal-plan-auto-fill.ng';

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

describe(MealPlanAutoFill.name, () => {
  it('searches mains to fill the empty days', async () => {
    const { fixture, search } = mountMealPlanAutoFill({
      ...fullWeek,
      saturday: null,
      sunday: null,
    });
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('shows a suggestion for each empty day', async () => {
    const { fixture, search } = mountMealPlanAutoFill({
      ...fullWeek,
      saturday: null,
      sunday: null,
    });
    search.mockReturnValue(of([shakshuka, lambKofte]));
    await fixture.whenStable();

    expect(suggestions(fixture.nativeElement)).toEqual([
      'Saturday: Shakshuka',
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('does not suggest recipes that are already planned', async () => {
    const { fixture, search } = mountMealPlanAutoFill({
      ...fullWeek,
      monday: 'shakshuka',
      sunday: null,
    });
    search.mockReturnValue(of([shakshuka, lambKofte]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(suggestions(fixture.nativeElement)).toEqual([
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('applies the suggestions and goes back to the meal plan', async () => {
    const { fixture, search, mealPlanStore, router } = mountMealPlanAutoFill({
      ...fullWeek,
      saturday: null,
      sunday: null,
    });
    search.mockReturnValue(of([shakshuka]));
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Apply').click();
    await fixture.whenStable();

    expect(assign).toHaveBeenCalledTimes(2);
    expect(assign).toHaveBeenNthCalledWith(1, {
      weekday: 'saturday',
      recipeId: 'shakshuka',
    });
    expect(assign).toHaveBeenNthCalledWith(2, {
      weekday: 'sunday',
      recipeId: 'shakshuka',
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'meal-plan']);
  });

  it('says there is nothing to suggest when the week is full', async () => {
    const { fixture, search } = mountMealPlanAutoFill(fullWeek);
    search.mockReturnValue(of([shakshuka]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-suggestions"]'),
    ).not.toBeNull();
  });
});

function mountMealPlanAutoFill(assignments: WeekdayAssignments) {
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
    .mockReturnValue(of([]));
  const mealPlanStore = TestBed.inject(MealPlanStore);
  vi.spyOn(mealPlanStore, 'assignments').mockReturnValue(assignments);
  const router = TestBed.inject(Router);

  const fixture = TestBed.createComponent(MealPlanAutoFill);

  return { fixture, search, mealPlanStore, router };
}

function suggestions(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="suggestion"]')].map(
    (el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '',
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
