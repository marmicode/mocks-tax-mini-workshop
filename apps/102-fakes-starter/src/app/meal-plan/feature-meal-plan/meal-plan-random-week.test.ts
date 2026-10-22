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
import { LocalStorage, RandomAdapter } from '@whiskmate/shared/infra';
import { MealPlanRandomWeek } from './meal-plan-random-week.ng';

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

describe(MealPlanRandomWeek.name, () => {
  it('shows a random main for each empty day', async () => {
    const { fixture, search } = mountMealPlanRandomWeek({
      ...fullWeek,
      saturday: null,
      sunday: null,
    });
    search.mockReturnValue(of([shakshuka, lambKofte]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(randomPicks(fixture.nativeElement)).toEqual([
      'Saturday: Shakshuka',
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('only picks quick recipes when asked', async () => {
    const { fixture, search } = mountMealPlanRandomWeek({
      ...fullWeek,
      sunday: null,
    });
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Quick recipes only').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 4,
    });
  });

  it('shuffles the picks again', async () => {
    const { fixture, search, pick } = mountMealPlanRandomWeek({
      ...fullWeek,
      sunday: null,
    });
    search.mockReturnValue(of([shakshuka, lambKofte]));
    await fixture.whenStable();

    pick.mockImplementation((recipes) => recipes.at(-1));
    buttonByText(fixture.nativeElement, 'Shuffle').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(randomPicks(fixture.nativeElement)).toEqual([
      'Sunday: Lamb Kofte with Yogurt and Sumac',
    ]);
  });

  it('applies the picks and goes back to the meal plan', async () => {
    const { fixture, search, mealPlanStore, router } = mountMealPlanRandomWeek({
      ...fullWeek,
      friday: null,
    });
    search.mockReturnValue(of([lambKofte]));
    const assign = vi
      .spyOn(mealPlanStore, 'assign')
      .mockImplementation(() => undefined);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Apply').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(assign).toHaveBeenCalledExactlyOnceWith({
      weekday: 'friday',
      recipeId: 'lamb-kofte',
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'meal-plan']);
  });

  it('says there is nothing to pick when the week is full', async () => {
    const { fixture, search } = mountMealPlanRandomWeek(fullWeek);
    search.mockReturnValue(of([shakshuka]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-picks"]'),
    ).not.toBeNull();
  });
});

function mountMealPlanRandomWeek(assignments: WeekdayAssignments) {
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
    .mockReturnValue(of([shakshuka]));
  const pick = vi
    .spyOn(TestBed.inject(RandomAdapter), 'pick')
    .mockImplementation((items) => items[0]);
  const mealPlanStore = TestBed.inject(MealPlanStore);
  vi.spyOn(mealPlanStore, 'assignments').mockReturnValue(assignments);
  const router = TestBed.inject(Router);

  const fixture = TestBed.createComponent(MealPlanRandomWeek);

  return { fixture, search, pick, mealPlanStore, router };
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
