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
import {
  provideLocalStorageFake,
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
import { WEEKDAYS } from '@whiskmate/shared/model';
import { MealPlanRandomWeek } from './meal-plan-random-week.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: ['Blend.'],
};

/* A long recipe: 6 steps. */
const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [
    'Heat the oil.',
    'Cook the onions.',
    'Add the peppers.',
    'Pour the tomatoes.',
    'Poach the eggs.',
    'Serve.',
  ],
};

/* A quick recipe: 3 steps. */
const lambKofte: Recipe = {
  id: 'lamb-kofte',
  course: 'main',
  name: 'Lamb Kofte with Yogurt and Sumac',
  description: null,
  pictureUri: 'https://example.com/lamb-kofte.jpg',
  ingredients: [],
  steps: ['Mix.', 'Shape.', 'Grill.'],
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

describe(MealPlanRandomWeek.name, () => {
  it('shows a random main for each empty day', async () => {
    const { fixture } = mountMealPlanRandomWeek({
      assignments: { ...fullWeek, saturday: null, sunday: null },
    });
    await fixture.whenStable();

    expect(randomPicks(fixture.nativeElement)).toEqual([
      'Saturday: Shakshuka',
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('only picks quick recipes when asked', async () => {
    const { fixture } = mountMealPlanRandomWeek({
      assignments: { ...fullWeek, sunday: null },
    });
    await fixture.whenStable();
    expect(randomPicks(fixture.nativeElement)).toEqual(['Sunday: Shakshuka']);

    checkboxByLabel(fixture.nativeElement, 'Quick recipes only').click();
    await fixture.whenStable();

    expect(randomPicks(fixture.nativeElement)).toEqual([
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('shuffles the picks again', async () => {
    const { fixture, randomAdapterFake } = mountMealPlanRandomWeek({
      assignments: { ...fullWeek, sunday: null },
    });
    await fixture.whenStable();
    expect(randomPicks(fixture.nativeElement)).toEqual(['Sunday: Shakshuka']);

    randomAdapterFake.setPickIndex(-1);
    buttonByText(fixture.nativeElement, 'Shuffle').click();
    await fixture.whenStable();

    expect(randomPicks(fixture.nativeElement)).toEqual([
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('applies the picks and goes back to the meal plan', async () => {
    const { fixture, mealPlanStore, router } = mountMealPlanRandomWeek({
      assignments: { ...fullWeek, friday: null },
      recipes: [lambKofte],
    });
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Apply').click();
    await fixture.whenStable();

    expect(mealPlanStore.assignments().friday).toBe('lamb-kofte');
    expect(router.url).toBe('/meal-plan');
  });

  it('says there is nothing to pick when the week is full', async () => {
    const { fixture } = mountMealPlanRandomWeek({ assignments: fullWeek });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-picks"]'),
    ).not.toBeNull();
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

  const fixture = TestBed.createComponent(MealPlanRandomWeek);

  return { fixture, randomAdapterFake, mealPlanStore, router };
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

function randomPicks(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="random-pick"]')].map(
    (el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

function checkboxByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const checkbox = [...root.querySelectorAll('mat-checkbox')].find(
    (el) => el.textContent?.trim() === label,
  );
  const input = checkbox?.querySelector('input');
  if (input == null) {
    throw new Error(`Checkbox "${label}" not found.`);
  }
  return input;
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
