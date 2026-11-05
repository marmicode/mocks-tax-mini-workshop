import { inputBinding, outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';
import { MealPlanDay } from './meal-plan-day.ng';

describe(MealPlanDay, () => {
  it('shows the empty state', async () => {
    mountMealPlanDay(null);

    await expect.element(page.getByText('Monday')).toBeVisible();
    await expect
      .element(page.getByText('No recipe is planned'))
      .toBeVisible();
    expect(page.getByRole('button').query()).toBeNull();
  });

  it('shows the recipe', async () => {
    mountMealPlanDay({
      name: 'Shakshuka',
      pictureUri: 'https://example.com/shakshuka.jpg',
    });

    await expect.element(page.getByText('Shakshuka')).toBeVisible();
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toBeVisible();
    expect(
      page
        .getByRole('img', { name: 'Shakshuka' })
        .element()
        .getAttribute('src'),
    ).toBe('https://example.com/shakshuka.jpg');
  });

  it('emits remove', async () => {
    const { remove } = mountMealPlanDay({
      name: 'Shakshuka',
      pictureUri: 'https://example.com/shakshuka.jpg',
    });

    await page.getByRole('button', { name: 'Remove' }).click();

    expect(remove).toHaveBeenCalledOnce();
  });
});

function mountMealPlanDay(
  recipe: { name: string; pictureUri: string } | null,
) {
  const remove = vi.fn();

  TestBed.createComponent(MealPlanDay, {
    bindings: [
      inputBinding('weekday', () => 'monday' as Weekday),
      inputBinding('recipe', () => recipe as Recipe | null),
      outputBinding('remove', remove),
    ],
  });

  return { remove };
}
