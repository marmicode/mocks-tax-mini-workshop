import { inputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import { WIP_STORAGE_KEY } from '../authz/wip.guard';
import { MealPlanStore } from '../meal-plan/meal-plan-store';
import { LocalStorage } from '../shared/local-storage';
import { RECIPES } from './recipe-data';
import { RecipePreview } from './recipe-preview.ng';

const shakshuka = RECIPES.find((recipe) => recipe.name === 'Shakshuka');
if (shakshuka == null) {
  throw new Error('Catalog must include Shakshuka.');
}

class MemoryStorage implements LocalStorage {
  private readonly items = signal(new Map<string, string>());

  setItem(key: string, value: string): void {
    this.items.update((items) => new Map(items).set(key, value));
  }

  getItem(key: string): string | null {
    return this.items().get(key) ?? null;
  }
}

const emptyAssignments = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

describe(RecipePreview, () => {
  it('asks which weekday, then assigns it', async () => {
    const { store } = mountRecipePreview();

    await page.getByRole('button', { name: 'Add to meal plan' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Wednesday' }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Wednesday' }).click();

    await expect.poll(() => store.assignments().wednesday).toBe(shakshuka.id);
  });

  it('leaves the plan unchanged when the picker is dismissed', async () => {
    const { store } = mountRecipePreview();

    await page.getByRole('button', { name: 'Add to meal plan' }).click();
    await expect
      .element(page.getByRole('button', { name: 'Wednesday' }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Dismiss' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Wednesday' }))
      .not.toBeInTheDocument();
    expect(store.assignments()).toEqual(emptyAssignments);
  });

  it('hides add to meal plan unless wip is set', async () => {
    const storage = new MemoryStorage();
    mountRecipePreview({ storage });

    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeVisible();

    storage.setItem(WIP_STORAGE_KEY, 'true');

    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeVisible();
  });

  it('disables add when the recipe is already planned', async () => {
    const storage = new MemoryStorage();
    storage.setItem(WIP_STORAGE_KEY, 'true');
    mountRecipePreview({
      storage,
      beforeCreate: (store) => {
        store.assign({ weekday: 'monday', recipeId: shakshuka.id });
      },
    });

    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeDisabled();
    await expect
      .element(page.getByRole('button', { name: 'Wednesday' }))
      .not.toBeInTheDocument();
  });

  it('shows add to meal plan with the wip flag removed', async () => {
    const storage = new MemoryStorage();
    mountRecipePreview({ storage });

    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeVisible();
  });
});

function mountRecipePreview(arrange?: {
  storage?: MemoryStorage;
  beforeCreate?: (store: MealPlanStore) => void;
}) {
  TestBed.resetTestingModule();
  const storage = arrange?.storage ?? new MemoryStorage();
  if (arrange?.storage == null) {
    storage.setItem(WIP_STORAGE_KEY, 'true');
  }
  TestBed.overrideProvider(LocalStorage, { useValue: storage });
  const store = TestBed.inject(MealPlanStore);
  arrange?.beforeCreate?.(store);

  TestBed.createComponent(RecipePreview, {
    bindings: [inputBinding('recipe', () => shakshuka)],
  });

  return { storage, store };
}
