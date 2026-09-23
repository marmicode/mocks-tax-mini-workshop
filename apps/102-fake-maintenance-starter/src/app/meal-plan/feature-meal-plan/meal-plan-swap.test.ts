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
import { WEEKDAYS, type Weekday } from '@whiskmate/shared/model';
import { MealPlanSwap } from './meal-plan-swap.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const lambKofte = recipeMother
  .withBasicInfo('Lamb Kofte with Yogurt and Sumac')
  .build();

const harissaChicken = recipeMother
  .withBasicInfo('Harissa-Roasted Chicken')
  .build();

const emptyAssignments: WeekdayAssignments = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

describe(MealPlanSwap.name, () => {
  it('shows the planned recipe and the other recipes of its course', async () => {
    const { fixture } = mountMealPlanSwap({
      weekday: 'monday',
      assignments: { ...emptyAssignments, monday: shakshuka.id },
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="current-recipe"]')
        ?.textContent,
    ).toBe('Shakshuka');
    expect(alternativeNames(fixture.nativeElement)).toEqual([
      'Lamb Kofte with Yogurt and Sumac',
      'Harissa-Roasted Chicken',
    ]);
  });

  it('lists alternatives that are not planned yet', async () => {
    const { fixture } = mountMealPlanSwap({
      weekday: 'monday',
      assignments: {
        ...emptyAssignments,
        monday: shakshuka.id,
        tuesday: harissaChicken.id,
      },
    });
    await fixture.whenStable();

    expect(alternativeNames(fixture.nativeElement)).toEqual([
      'Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('assigns the picked recipe and goes back to the meal plan', async () => {
    const { fixture, mealPlanStore, router } = mountMealPlanSwap({
      weekday: 'friday',
      assignments: { ...emptyAssignments, friday: shakshuka.id },
    });
    await fixture.whenStable();

    buttonByText(
      fixture.nativeElement,
      'Pick Lamb Kofte with Yogurt and Sumac',
    ).click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments().friday).toBe(lambKofte.id);
    expect(router.url).toBe('/meal-plan');
  });

  it('says there is no alternative when every recipe of the course is planned', async () => {
    const { fixture } = mountMealPlanSwap({
      weekday: 'monday',
      assignments: { ...emptyAssignments, monday: shakshuka.id },
      recipes: [hummus, shakshuka],
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-alternatives"]'),
    ).not.toBeNull();
  });

  it('says nothing is planned that day', async () => {
    const { fixture } = mountMealPlanSwap({
      weekday: 'monday',
      assignments: emptyAssignments,
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="nothing-planned"]'),
    ).not.toBeNull();
  });
});

function mountMealPlanSwap({
  weekday,
  assignments,
  recipes = [hummus, shakshuka, lambKofte, harissaChicken],
}: {
  weekday: Weekday;
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

  const fixture = TestBed.createComponent(MealPlanSwap);
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

function alternativeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="alternative-name"]')].map(
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
