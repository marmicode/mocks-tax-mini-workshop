import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminRecipeDelete } from './admin-recipe-delete.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

describe(AdminRecipeDelete, () => {
  it('shows the recipe and asks for confirmation', async () => {
    mountAdminRecipeDelete(shakshuka.id);

    await expect
      .element(page.getByRole('heading', { name: 'Delete Shakshuka?' }))
      .toBeVisible();
  });

  it('removes the recipe and goes back to the list', async () => {
    const { recipeRepositoryFake, router } = mountAdminRecipeDelete(
      shakshuka.id,
    );

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect.poll(() => recipeRepositoryFake.getRecipesSync()).toEqual([]);
    await expect.poll(() => router.url).toBe('/admin/recipes');
  });

  it('links back to the list without removing anything', async () => {
    const { recipeRepositoryFake } = mountAdminRecipeDelete(shakshuka.id);

    await expect
      .element(page.getByRole('link', { name: 'Cancel' }))
      .toBeVisible();
    expect(
      page.getByRole('link', { name: 'Cancel' }).element().getAttribute('href'),
    ).toBe('/admin/recipes');
    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka]);
  });

  it('shows "Recipe not found" for an unknown recipe', async () => {
    const { recipeRepositoryFake } = mountAdminRecipeDelete('missing');

    await expect
      .element(page.getByRole('heading', { name: 'Recipe not found' }))
      .toBeVisible();
    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka]);
  });
});

function mountAdminRecipeDelete(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'admin/recipes', children: [] }]),
      provideRecipeRepositoryFake(),
    ],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes([shakshuka]);
  const router = TestBed.inject(Router);

  TestBed.createComponent(AdminRecipeDelete, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });

  return { recipeRepositoryFake, router };
}
