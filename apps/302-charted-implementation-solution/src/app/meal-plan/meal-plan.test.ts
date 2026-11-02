import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import { RECIPES } from '../recipe/recipe-data';
import { LocalStorage } from '../shared/local-storage';
import { MealPlan } from './meal-plan.ng';
import { MealPlanStore } from './meal-plan-store';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const shakshuka = RECIPES.find((recipe) => recipe.name === 'Shakshuka');
if (shakshuka == null) {
  throw new Error('Catalog must include Shakshuka.');
}

class MemoryStorage implements LocalStorage {
  private readonly items = new Map<string, string>();

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
}

describe(MealPlan, () => {
  it('shows seven empty weekdays', async () => {
    mountMealPlan();

    await expect.poll(weekdayLabels).toEqual(WEEKDAYS);
    await expect
      .element(page.getByText('No recipe is planned'))
      .toHaveLength(7);
  });

  it('shows the name and picture of a planned recipe', async () => {
    mountMealPlan((store) => {
      store.assign({ weekday: 'monday', recipeId: shakshuka.id });
    });

    await expect.element(page.getByText('Shakshuka')).toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toHaveAttribute('src', shakshuka.pictureUri);
    await expect
      .element(page.getByText('No recipe is planned'))
      .toHaveLength(6);
  });

  it('renders a missing recipe as an empty day', async () => {
    mountMealPlan((store) => {
      store.assign({ weekday: 'monday', recipeId: 'missing' });
    });

    await expect.element(page.getByText('Monday')).toBeVisible();
    await expect
      .element(page.getByText('No recipe is planned'))
      .toHaveLength(7);
  });

  it('clears a day', async () => {
    const { store } = mountMealPlan((plan) => {
      plan.assign({ weekday: 'monday', recipeId: shakshuka.id });
    });

    await expect.element(page.getByText('Shakshuka')).toBeVisible();

    await page.getByRole('button', { name: 'Remove' }).click();

    await expect.poll(() => store.assignments().monday).toBeNull();
    await expect.element(page.getByText('Shakshuka')).not.toBeInTheDocument();
    await expect
      .element(page.getByText('No recipe is planned'))
      .toHaveLength(7);
  });
});

function mountMealPlan(arrange?: (store: MealPlanStore) => void) {
  TestBed.resetTestingModule();
  TestBed.overrideProvider(LocalStorage, { useValue: new MemoryStorage() });
  const store = TestBed.inject(MealPlanStore);
  arrange?.(store);

  TestBed.createComponent(MealPlan);

  return { store };
}

function weekdayLabels() {
  return page
    .getByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/)
    .elements()
    .map((element) => element.textContent?.trim() ?? '');
}
