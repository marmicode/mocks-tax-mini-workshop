import { TestBed } from '@angular/core/testing';
import { describe, it } from 'vitest';
import {
  LocalStorageFake,
  provideLocalStorageFake,
} from '@whiskmate/shared/infra';
import { MealPlanStore, type WeekdayAssignments } from './meal-plan-store';

const MEAL_PLAN_STORAGE_KEY = 'whiskmate:meal-plan';

describe(MealPlanStore.name, () => {
  it('replaces the recipe on a weekday', () => {
    const { store } = setUpMealPlanStore();

    store.assign({ weekday: 'monday', recipeId: 'shakshuka' });
    store.assign({ weekday: 'monday', recipeId: 'hummus' });

    expect(store.assignments()).toEqual({
      monday: 'hummus',
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    });
  });

  it('clears a weekday', () => {
    const { store } = setUpMealPlanStore();
    store.assign({ weekday: 'monday', recipeId: 'shakshuka' });

    store.clear({ weekday: 'monday' });

    expect(store.assignments()).toEqual({
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    });
  });

  it('allows add only when the recipe is not already planned', () => {
    const { store } = setUpMealPlanStore();
    store.assign({ weekday: 'wednesday', recipeId: 'shakshuka' });

    expect(store.canAdd({ recipeId: 'shakshuka' })).toBe(false);
    expect(store.canAdd({ recipeId: 'hummus' })).toBe(true);
  });

  it('restores assignments after reload', () => {
    const storedWeek: WeekdayAssignments = {
      monday: 'shakshuka',
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    };
    const { store, localStorageFake } = setUpMealPlanStore({
      storedValue: JSON.stringify(storedWeek),
    });

    expect(store.assignments()).toEqual(storedWeek);

    store.assign({ weekday: 'tuesday', recipeId: 'hummus' });

    expect(
      JSON.parse(localStorageFake.getItem(MEAL_PLAN_STORAGE_KEY) ?? ''),
    ).toEqual({
      ...storedWeek,
      tuesday: 'hummus',
    });
  });
});

function setUpMealPlanStore({ storedValue }: { storedValue?: string } = {}) {
  TestBed.configureTestingModule({
    providers: [provideLocalStorageFake()],
  });
  const localStorageFake = TestBed.inject(LocalStorageFake);
  if (storedValue != null) {
    localStorageFake.setItem(MEAL_PLAN_STORAGE_KEY, storedValue);
  }
  /* Instantiate the store once the storage is set up. */
  const store = TestBed.inject(MealPlanStore);
  return { store, localStorageFake };
}
