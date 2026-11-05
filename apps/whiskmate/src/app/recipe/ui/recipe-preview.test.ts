import { inputBinding, outputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';
import { RecipePreview } from './recipe-preview.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

describe(RecipePreview, () => {
  it('asks which weekday, then emits it', async () => {
    const { addToMealPlan } = mountRecipePreview();

    await page.getByRole('button', { name: 'Add to meal plan' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Wednesday' }))
      .toBeVisible();

    await page.getByRole('button', { name: 'Wednesday' }).click();

    expect(addToMealPlan).toHaveBeenCalledExactlyOnceWith('wednesday');
  });

  it('does not emit when the picker is dismissed', async () => {
    const { addToMealPlan } = mountRecipePreview();

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
    expect(addToMealPlan).not.toHaveBeenCalled();
  });

  it('shows add to meal plan', async () => {
    mountRecipePreview();

    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeVisible();
  });

  it('disables add when the recipe cannot be added', async () => {
    mountRecipePreview(false);

    await expect
      .element(page.getByRole('button', { name: 'Add to meal plan' }))
      .toBeDisabled();
    await expect
      .element(page.getByRole('button', { name: 'Wednesday' }))
      .not.toBeInTheDocument();
  });
});

function mountRecipePreview(canAdd = true) {
  const recipe = signal<Recipe>(shakshuka);
  const addToMealPlan = vi.fn<(weekday: Weekday) => void>();

  TestBed.createComponent(RecipePreview, {
    bindings: [
      inputBinding('recipe', recipe),
      inputBinding('canAdd', () => canAdd),
      outputBinding('addToMealPlan', addToMealPlan),
    ],
  });

  return { recipe, addToMealPlan };
}
