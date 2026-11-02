import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeEdit } from './admin-recipe-edit.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
    { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
    { name: 'fresh coriander' },
  ],
  steps: ['Cook the sauce.', 'Poach the eggs.'],
};

describe(AdminRecipeEdit, () => {
  it('fetches the recipe and prefills the form', async () => {
    const { findById } = mountAdminRecipeEdit('shakshuka');

    await expect.element(page.getByLabelText('Name')).toHaveValue('Shakshuka');
    await expect.element(page.getByLabelText('Course')).toHaveValue('main');
    await expect
      .element(page.getByLabelText('Ingredients (one per line)'))
      .toHaveValue('3 tbsp olive oil\n6 large eggs\nfresh coriander');
    await expect
      .element(page.getByLabelText('Steps (one per line)'))
      .toHaveValue('Cook the sauce.\nPoach the eggs.');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('does not allow changing the id', async () => {
    const { findById } = mountAdminRecipeEdit('shakshuka');

    await expect.element(page.getByLabelText('Id')).toHaveValue('shakshuka');
    await expect
      .poll(
        () => (page.getByLabelText('Id').element() as HTMLInputElement).readOnly,
      )
      .toBe(true);
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('saves an unchanged recipe as is', async () => {
    const { findById, update } = mountAdminRecipeEdit('shakshuka');

    await expect.element(page.getByLabelText('Name')).toHaveValue('Shakshuka');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => update).toHaveBeenCalledExactlyOnceWith(shakshuka);
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('updates the recipe and goes back to the list', async () => {
    const { findById, update, navigate } = mountAdminRecipeEdit('shakshuka');

    await expect.element(page.getByLabelText('Name')).toHaveValue('Shakshuka');
    await page.getByLabelText('Name').fill('Green Shakshuka');
    await page.getByLabelText('Course').selectOptions('starter');
    await page.getByLabelText('Description').fill('');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => update).toHaveBeenCalledExactlyOnceWith({
      id: 'shakshuka',
      course: 'starter',
      name: 'Green Shakshuka',
      description: null,
      pictureUri: 'https://example.com/shakshuka.jpg',
      ingredients: [
        { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
        { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
        { name: 'fresh coriander' },
      ],
      steps: ['Cook the sauce.', 'Poach the eggs.'],
    });
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'admin', 'recipes']);
  });

  it('shows "Recipe not found" for an unknown recipe', async () => {
    const { findById, update } = mountAdminRecipeEdit('missing');
    findById.mockReturnValue(of(undefined));

    await expect
      .element(page.getByRole('heading', { name: 'Recipe not found' }))
      .toBeVisible();
    expect(page.getByLabelText('Name').query()).toBeNull();
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(update).not.toHaveBeenCalled();
  });
});

function mountAdminRecipeEdit(recipeId: string) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(shakshuka));
  const update = vi
    .spyOn(recipeRepository, 'update')
    .mockImplementation((recipe) => of(recipe));
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);

  TestBed.createComponent(AdminRecipeEdit, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });

  return { findById, update, navigate };
}
