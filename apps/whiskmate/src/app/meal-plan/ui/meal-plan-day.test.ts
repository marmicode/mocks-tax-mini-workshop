import { inputBinding, outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';
import { MealPlanDay } from './meal-plan-day.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

describe(MealPlanDay, () => {
  it('shows the empty state', async () => {
    mountMealPlanDay(null);

    await expect
      .element(page.getByText('Monday', { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByText('No recipe is planned', { exact: true }))
      .toBeVisible();
    await expect.element(page.getByRole('button')).not.toBeInTheDocument();
  });

  it('shows the recipe', async () => {
    mountMealPlanDay(shakshuka);

    await expect
      .element(page.getByText('Shakshuka', { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toBeVisible();
    expect(
      page
        .getByRole('img', { name: 'Shakshuka' })
        .element()
        .getAttribute('src'),
    ).toBe(shakshuka.pictureUri);
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
