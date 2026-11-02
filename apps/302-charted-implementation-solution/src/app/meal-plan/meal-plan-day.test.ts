import { inputBinding, outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import type { Recipe } from '../recipe/recipe';
import { RECIPES } from '../recipe/recipe-data';
import { MealPlanDay } from './meal-plan-day.ng';
import type { Weekday } from './meal-plan-store';

const shakshuka = RECIPES.find((recipe) => recipe.name === 'Shakshuka');
if (shakshuka == null) {
  throw new Error('Catalog must include Shakshuka.');
}

describe(MealPlanDay, () => {
  it('shows the empty state', async () => {
    mountMealPlanDay(null);

    await expect.element(page.getByText('Monday')).toBeVisible();
    await expect.element(page.getByText('No recipe is planned')).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Remove' }))
      .not.toBeInTheDocument();
  });

  it('shows the recipe', async () => {
    mountMealPlanDay(shakshuka);

    await expect.element(page.getByText('Shakshuka')).toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toHaveAttribute('src', shakshuka.pictureUri);
  });

  it('emits remove', async () => {
    const { remove } = mountMealPlanDay(shakshuka);

    await page.getByRole('button', { name: 'Remove' }).click();

    expect(remove).toHaveBeenCalledOnce();
  });
});

function mountMealPlanDay(recipe: Recipe | null) {
  const remove = vi.fn();

  TestBed.createComponent(MealPlanDay, {
    bindings: [
      inputBinding('weekday', () => 'monday' as Weekday),
      inputBinding('recipe', () => recipe),
      outputBinding('remove', remove),
    ],
  });

  return { remove };
}
