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
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { WEEKDAYS } from '@whiskmate/shared/model';
import { MealPlanAutoFill } from './meal-plan-auto-fill.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

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

describe(MealPlanAutoFill.name, () => {
  it('searches mains to fill the empty days', async () => {
    const { fixture } = mountMealPlanAutoFill({
      assignments: { ...fullWeek, saturday: null, sunday: null },
      recipes: [hummus, shakshuka],
    });
    await fixture.whenStable();

    expect(suggestions(fixture.nativeElement)).toEqual([
      'Saturday: Shakshuka',
      'Sunday: Shakshuka',
    ]);
  });

  it('shows a suggestion for each empty day', async () => {
    const { fixture } = mountMealPlanAutoFill({
      assignments: { ...fullWeek, saturday: null, sunday: null },
    });
    await fixture.whenStable();

    expect(suggestions(fixture.nativeElement)).toEqual([
      'Saturday: Shakshuka',
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('does not suggest recipes that are already planned', async () => {
    const { fixture } = mountMealPlanAutoFill({
      assignments: { ...fullWeek, monday: shakshuka.id, sunday: null },
    });
    await fixture.whenStable();

    expect(suggestions(fixture.nativeElement)).toEqual([
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('applies the suggestions and goes back to the meal plan', async () => {
    const { fixture, mealPlanStore, router } = mountMealPlanAutoFill({
      assignments: { ...fullWeek, saturday: null, sunday: null },
      recipes: [shakshuka],
    });
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Apply').click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments()).toEqual({
      ...fullWeek,
      saturday: shakshuka.id,
      sunday: shakshuka.id,
    });
    expect(router.url).toBe('/meal-plan');
  });

  it('says there is nothing to suggest when the week is full', async () => {
    const { fixture } = mountMealPlanAutoFill({ assignments: fullWeek });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-suggestions"]'),
    ).not.toBeNull();
  });
});

function mountMealPlanAutoFill({
  assignments,
  recipes = [shakshuka, lambKofte],
}: {
  assignments: WeekdayAssignments;
  recipes?: Recipe[];
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

  const fixture = TestBed.createComponent(MealPlanAutoFill);

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
