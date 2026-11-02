import { inputBinding } from '@angular/core';
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

describe(MealPlanSwap, () => {
  it('shows the planned recipe and the other recipes of its course', async () => {
    mountMealPlanSwap({
      weekday: 'monday',
      assignments: { ...emptyAssignments, monday: shakshuka.id },
    });

    await expect
      .element(page.getByTestId('current-recipe'))
      .toHaveTextContent('Shakshuka');
    await expect
      .poll(() => alternativeNames())
      .toEqual(['Lamb Kofte with Yogurt and Sumac', 'Harissa-Roasted Chicken']);
  });

  it('lists alternatives that are not planned yet', async () => {
    mountMealPlanSwap({
      weekday: 'monday',
      assignments: {
        ...emptyAssignments,
        monday: shakshuka.id,
        tuesday: harissaChicken.id,
      },
    });

    await expect
      .poll(() => alternativeNames())
      .toEqual(['Lamb Kofte with Yogurt and Sumac']);
  });

  it('assigns the picked recipe and goes back to the meal plan', async () => {
    const { mealPlanStore, router } = mountMealPlanSwap({
      weekday: 'friday',
      assignments: { ...emptyAssignments, friday: shakshuka.id },
    });

    await page
      .getByRole('button', { name: 'Pick Lamb Kofte with Yogurt and Sumac' })
      .click();

    await expect
      .poll(() => mealPlanStore.assignments().friday)
      .toBe(lambKofte.id);
    await expect.poll(() => router.url).toBe('/meal-plan');
  });

  it('says there is no alternative when every recipe of the course is planned', async () => {
    mountMealPlanSwap({
      weekday: 'monday',
      assignments: { ...emptyAssignments, monday: shakshuka.id },
      recipes: [hummus, shakshuka],
    });

    await expect.element(page.getByTestId('no-alternatives')).toBeVisible();
  });

  it('says nothing is planned that day', async () => {
    mountMealPlanSwap({
      weekday: 'monday',
      assignments: emptyAssignments,
    });

    await expect.element(page.getByTestId('nothing-planned')).toBeVisible();
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

  TestBed.createComponent(MealPlanSwap, {
    bindings: [inputBinding('weekday', () => weekday)],
  });

  return { mealPlanStore, router };
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

function alternativeNames() {
  return page
    .getByTestId('alternative-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
