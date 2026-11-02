import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeCreate } from './admin-recipe-create.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const falafel: Recipe = {
  id: 'falafel-bowl',
  course: 'starter',
  name: 'Falafel Bowl',
  description: 'Crispy falafel with tahini.',
  pictureUri: 'https://example.com/falafel.jpg',
  ingredients: [
    { quantity: { amount: 400, unit: 'g' }, name: 'chickpeas' },
    { quantity: { amount: 2, unit: 'tbsp' }, name: 'tahini' },
    { name: 'fresh parsley' },
  ],
  steps: ['Blend the chickpeas.', 'Shape and fry.'],
};

describe(AdminRecipeCreate, () => {
  it('derives the id from the name and checks it is available', async () => {
    const { findById } = mountAdminRecipeCreate();

    await page.getByLabelText('Name').fill('Falafel Bowl');

    await expect
      .element(page.getByLabelText('Id'))
      .toHaveValue('falafel-bowl');
    await expect
      .poll(() => findById)
      .toHaveBeenCalledExactlyOnceWith({ id: 'falafel-bowl' });
    expect(page.getByText('This id is already taken').query()).toBeNull();
  });

  it('warns when the id is already taken and prevents creation', async () => {
    const { findById, create } = mountAdminRecipeCreate();
    findById.mockReturnValue(of(shakshuka));

    await page.getByLabelText('Name').fill('Shakshuka');

    await expect
      .element(page.getByText('This id is already taken'))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Create' }))
      .toBeDisabled();
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps a hand-edited id when the name changes', async () => {
    const { findById } = mountAdminRecipeCreate();

    await page.getByLabelText('Id').fill('my-falafel');
    await page.getByLabelText('Name').fill('Falafel Bowl');

    await expect.element(page.getByLabelText('Id')).toHaveValue('my-falafel');
    await expect
      .poll(() => findById)
      .toHaveBeenCalledExactlyOnceWith({ id: 'my-falafel' });
  });

  it('creates the recipe and goes back to the list', async () => {
    const { findById, create, navigate } = mountAdminRecipeCreate();

    await fillRecipeForm();
    await page.getByRole('button', { name: 'Create' }).click();

    await expect.poll(() => create).toHaveBeenCalledExactlyOnceWith(falafel);
    expect(findById).toHaveBeenLastCalledWith({ id: 'falafel-bowl' });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'admin', 'recipes']);
  });

  it('does not create a recipe without a name', async () => {
    const { findById, create } = mountAdminRecipeCreate();

    await expect
      .element(page.getByRole('button', { name: 'Create' }))
      .toBeDisabled();
    expect(findById).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});

function mountAdminRecipeCreate() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(undefined));
  const create = vi
    .spyOn(recipeRepository, 'create')
    .mockImplementation((recipe) => of(recipe));
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);

  TestBed.createComponent(AdminRecipeCreate);

  return { findById, create, navigate };
}

async function fillRecipeForm() {
  await page.getByLabelText('Name').fill('Falafel Bowl');
  await page.getByLabelText('Course').selectOptions('starter');
  await page
    .getByLabelText('Description')
    .fill('Crispy falafel with tahini.');
  await page
    .getByLabelText('Picture URI')
    .fill('https://example.com/falafel.jpg');
  await page
    .getByLabelText('Ingredients (one per line)')
    .fill('400 g chickpeas\n2 tbsp tahini\nfresh parsley');
  await page
    .getByLabelText('Steps (one per line)')
    .fill('Blend the chickpeas.\n\nShape and fry.');
}
