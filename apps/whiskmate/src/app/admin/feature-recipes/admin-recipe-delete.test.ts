import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeDelete } from './admin-recipe-delete.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe(AdminRecipeDelete, () => {
  it('fetches the recipe and asks for confirmation', async () => {
    const { findById } = mountAdminRecipeDelete('shakshuka');

    await expect
      .element(page.getByRole('heading', { name: 'Delete Shakshuka?' }))
      .toBeVisible();
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('removes the recipe and goes back to the list', async () => {
    const { findById, remove, navigate } = mountAdminRecipeDelete('shakshuka');

    await expect
      .element(page.getByRole('heading', { name: 'Delete Shakshuka?' }))
      .toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect
      .poll(() => remove)
      .toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'admin', 'recipes']);
  });

  it('links back to the list without removing anything', async () => {
    const { findById, remove } = mountAdminRecipeDelete('shakshuka');

    await expect
      .element(page.getByRole('heading', { name: 'Delete Shakshuka?' }))
      .toBeVisible();
    expect(
      page.getByRole('link', { name: 'Cancel' }).element().getAttribute('href'),
    ).toBe('/admin/recipes');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(remove).not.toHaveBeenCalled();
  });

  it('shows "Recipe not found" for an unknown recipe', async () => {
    const { findById, remove } = mountAdminRecipeDelete('missing');
    findById.mockReturnValue(of(undefined));

    await expect
      .element(page.getByRole('heading', { name: 'Recipe not found' }))
      .toBeVisible();
    expect(page.getByRole('button', { name: 'Delete' }).query()).toBeNull();
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(remove).not.toHaveBeenCalled();
  });
});

function mountAdminRecipeDelete(recipeId: string) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(shakshuka));
  const remove = vi
    .spyOn(recipeRepository, 'remove')
    .mockReturnValue(of(undefined));
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);

  TestBed.createComponent(AdminRecipeDelete, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });

  return { findById, remove, navigate };
}
