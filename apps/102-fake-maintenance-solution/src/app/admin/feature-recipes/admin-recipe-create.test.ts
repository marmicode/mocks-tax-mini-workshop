import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminRecipeCreate } from './admin-recipe-create.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const falafel = recipeMother
  .withBasicInfo({
    name: 'Falafel Bowl',
    course: 'starter',
    description: 'Crispy falafel with tahini.',
  })
  .withPictureUri('https://example.com/falafel.jpg')
  .withIngredients([
    { quantity: { amount: 400, unit: 'g' }, name: 'chickpeas' },
    { quantity: { amount: 2, unit: 'tbsp' }, name: 'tahini' },
    { name: 'fresh parsley' },
  ])
  .withSteps(['Blend the chickpeas.', 'Shape and fry.'])
  .build();

describe(AdminRecipeCreate, () => {
  it('derives the id from the name and checks it is available', async () => {
    mountAdminRecipeCreate();

    await page.getByLabelText('Name').fill('Falafel Bowl');

    await expect.element(page.getByLabelText('Id')).toHaveValue('falafel-bowl');
    await expect
      .element(page.getByText('This id is already taken', { exact: true }))
      .not.toBeInTheDocument();
  });

  it('warns when the id is already taken and prevents creation', async () => {
    const { recipeRepositoryFake } = mountAdminRecipeCreate();

    await page.getByLabelText('Name').fill('Shakshuka');

    await expect
      .element(page.getByText('This id is already taken', { exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Create' }))
      .toBeDisabled();
    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka]);
  });

  it('keeps a hand-edited id when the name changes', async () => {
    mountAdminRecipeCreate();

    await page.getByLabelText('Id').fill('my-falafel');
    await page.getByLabelText('Name').fill('Falafel Bowl');

    await expect.element(page.getByLabelText('Id')).toHaveValue('my-falafel');
  });

  it('checks that a hand-edited id is available', async () => {
    mountAdminRecipeCreate();

    await page.getByLabelText('Id').fill(shakshuka.id);

    await expect
      .element(page.getByText('This id is already taken', { exact: true }))
      .toBeVisible();
  });

  it('creates the recipe and goes back to the list', async () => {
    const { recipeRepositoryFake, router } = mountAdminRecipeCreate();

    await fillRecipeForm();
    await page.getByRole('button', { name: 'Create' }).click();

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([shakshuka, falafel]);
    await expect.poll(() => router.url).toBe('/admin/recipes');
  });

  it('does not create a recipe without a name', async () => {
    const { recipeRepositoryFake } = mountAdminRecipeCreate();

    await expect
      .element(page.getByRole('button', { name: 'Create' }))
      .toBeDisabled();
    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka]);
  });
});

function mountAdminRecipeCreate() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'admin/recipes', children: [] }]),
      provideRecipeRepositoryFake(),
    ],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes([shakshuka]);
  const router = TestBed.inject(Router);

  TestBed.createComponent(AdminRecipeCreate);

  return { recipeRepositoryFake, router };
}

async function fillRecipeForm() {
  await page.getByLabelText('Name').fill('Falafel Bowl');
  await page.getByLabelText('Course').selectOptions('starter');
  await page.getByLabelText('Description').fill('Crispy falafel with tahini.');
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
