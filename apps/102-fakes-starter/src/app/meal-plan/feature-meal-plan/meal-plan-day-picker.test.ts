import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { WEEKDAYS, type Weekday } from '@whiskmate/shared/model';
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

describe(MealPlanDayPicker.name, () => {
  it('only lists mains', async () => {
    const { fixture } = mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: emptyAssignments,
      recipes: [hummus, shakshuka, lambKofte],
    });
    await fixture.whenStable();

    expect(candidateNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('does not list mains that are already planned', async () => {
    const { fixture } = mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: { ...emptyAssignments, tuesday: 'shakshuka' },
      recipes: [shakshuka, lambKofte],
    });
    await fixture.whenStable();

    expect(candidateNames(fixture.nativeElement)).toEqual([
      'Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('assigns the picked main and goes back to the meal plan', async () => {
    const { fixture, mealPlanStore, router } = mountMealPlanDayPicker({
      weekday: 'thursday',
      assignments: emptyAssignments,
      recipes: [shakshuka, lambKofte],
    });
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Pick Shakshuka').click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments().thursday).toBe('shakshuka');
    expect(router.url).toBe('/meal-plan');
  });

  it('says there is nothing left to pick when every main is planned', async () => {
    const { fixture } = mountMealPlanDayPicker({
      weekday: 'monday',
      assignments: { ...emptyAssignments, tuesday: 'shakshuka' },
      recipes: [hummus, shakshuka],
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-candidates"]'),
    ).not.toBeNull();
  });
});

function mountMealPlanDayPicker({
  weekday,
  assignments,
  recipes,
}: {
  weekday: Weekday;
  assignments: WeekdayAssignments;
  recipes: Recipe[];
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'meal-plan', children: [] }]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  planWeek(mealPlanStore, assignments);
  const router = TestBed.inject(Router);

  const fixture = TestBed.createComponent(MealPlanDayPicker);
  fixture.componentRef.setInput('weekday', weekday);

  return { fixture, mealPlanStore, router };
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

function candidateNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="candidate-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
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
