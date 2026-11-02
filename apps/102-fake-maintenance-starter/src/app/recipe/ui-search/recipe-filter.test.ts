import { outputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import type { RecipeFilterCriteria } from '@whiskmate/recipe/model';
import { RecipeFilter } from './recipe-filter.ng';

describe(RecipeFilter, () => {
  it('emits the selected course', async () => {
    const { filterChange } = mountRecipeFilter();

    await page.getByRole('button', { name: 'starter' }).click();

    expect(filterChange).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
      favoritesOnly: false,
    });
  });

  it('emits every selected course', async () => {
    const { filterChange } = mountRecipeFilter();

    await page.getByRole('button', { name: 'main' }).click();
    await page.getByRole('button', { name: 'dessert' }).click();

    expect(filterChange).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main', 'dessert'],
      favoritesOnly: false,
    });
  });

  it('emits `null` when all courses are unselected', async () => {
    const { filterChange } = mountRecipeFilter();

    await page.getByRole('button', { name: 'main' }).click();
    await page.getByRole('button', { name: 'main' }).click();

    expect(filterChange).toHaveBeenCalledTimes(2);
    expect(filterChange).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: null,
      favoritesOnly: false,
    });
  });
});

function mountRecipeFilter() {
  const filterChange = vi.fn<(filter: RecipeFilterCriteria) => void>();

  TestBed.createComponent(RecipeFilter, {
    bindings: [outputBinding('filterChange', filterChange)],
  });

  return { filterChange };
}
