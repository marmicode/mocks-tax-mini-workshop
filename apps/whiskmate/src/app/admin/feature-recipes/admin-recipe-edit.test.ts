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
import { AdminRecipeEdit } from './admin-recipe-edit.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
    { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
    { name: 'fresh coriander' },
  ])
  .withSteps(['Cook the sauce.', 'Poach the eggs.'])
  .build();

describe(AdminRecipeEdit, () => {
  it('prefills the form with the recipe', async () => {
    mountAdminRecipeEdit(shakshuka.id);

    await expect.element(page.getByLabelText('Name')).toHaveValue('Shakshuka');
    await expect.element(page.getByLabelText('Course')).toHaveValue('main');
    await expect
      .element(page.getByLabelText('Ingredients (one per line)'))
      .toHaveValue('3 tbsp olive oil\n6 large eggs\nfresh coriander');
    await expect
      .element(page.getByLabelText('Steps (one per line)'))
      .toHaveValue('Cook the sauce.\nPoach the eggs.');
  });

  it('does not allow changing the id', async () => {
    mountAdminRecipeEdit(shakshuka.id);

    await expect.element(page.getByLabelText('Id')).toHaveValue(shakshuka.id);
    expect(
      (page.getByLabelText('Id').element() as HTMLInputElement).readOnly,
    ).toBe(true);
  });

  it('saves an unchanged recipe as is', async () => {
    const { recipeRepositoryFake } = mountAdminRecipeEdit(shakshuka.id);

    await expect.element(page.getByLabelText('Name')).toHaveValue('Shakshuka');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([shakshuka]);
  });

  it('updates the recipe and goes back to the list', async () => {
    const { recipeRepositoryFake, router } = mountAdminRecipeEdit(shakshuka.id);

    await expect.element(page.getByLabelText('Name')).toHaveValue('Shakshuka');
    await page.getByLabelText('Name').fill('Green Shakshuka');
    await page.getByLabelText('Course').selectOptions('starter');
    await page.getByLabelText('Description').fill('');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([
        recipeMother
          .withBasicInfo({ name: 'Green Shakshuka', course: 'starter' })
          .withId(shakshuka.id)
          .withPictureUri(shakshuka.pictureUri)
          .withIngredients([
            { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
            { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
            { name: 'fresh coriander' },
          ])
          .withSteps(['Cook the sauce.', 'Poach the eggs.'])
          .build(),
      ]);
    await expect.poll(() => router.url).toBe('/admin/recipes');
  });

  it('shows "Recipe not found" for an unknown recipe', async () => {
    mountAdminRecipeEdit('missing');

    await expect
      .element(page.getByRole('heading', { name: 'Recipe not found' }))
      .toBeVisible();
    await expect.element(page.getByLabelText('Name')).not.toBeInTheDocument();
  });
});

function mountAdminRecipeEdit(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'admin/recipes', children: [] }]),
      provideRecipeRepositoryFake(),
    ],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes([shakshuka]);
  const router = TestBed.inject(Router);

  TestBed.createComponent(AdminRecipeEdit, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });

  return { recipeRepositoryFake, router };
}
