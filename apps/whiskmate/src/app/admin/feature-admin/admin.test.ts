import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { Admin } from './admin.ng';

const hummus = recipeMother
  .withBasicInfo({
    name: 'Hummus with Ful',
    course: 'starter',
    description: 'Creamy hummus.',
  })
  .withSomeIngredients()
  .withSomeSteps()
  .build();

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withSomeIngredients()
  .withManySteps()
  .build();

describe(Admin, () => {
  it('searches the whole catalog to compute stats', async () => {
    mountAdmin({
      recipes: [
        hummus,
        shakshuka,
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withManyIngredients()
          .withSomeSteps()
          .build(),
      ],
    });

    await expect
      .poll(() => tiles())
      .toEqual(
        expect.arrayContaining([
          '3 Recipes',
          '1 starters',
          '1 mains',
          '1 desserts',
        ]),
      );
  });

  it('shows the recipe count and the count per course', async () => {
    mountAdmin();

    await expect
      .poll(() => tiles())
      .toEqual(
        expect.arrayContaining([
          '2 Recipes',
          '1 starters',
          '1 mains',
          '0 desserts',
        ]),
      );
  });

  it('shows averages and missing descriptions', async () => {
    mountAdmin();

    await expect
      .poll(() => tiles())
      .toEqual(
        expect.arrayContaining([
          '3 Avg. ingredients',
          '5.5 Avg. steps',
          '1 Missing descriptions',
        ]),
      );
  });

  it('links to every admin page', async () => {
    mountAdmin();

    await expect
      .poll(() => links())
      .toEqual([
        { label: 'Recipes', href: '/admin/recipes' },
        { label: 'New recipe', href: '/admin/recipes/new' },
        { label: 'Duplicates', href: '/admin/catalog/duplicates' },
        { label: 'Quality report', href: '/admin/catalog/quality' },
        { label: 'Courses', href: '/admin/catalog/courses' },
        { label: 'Ingredients', href: '/admin/catalog/ingredients' },
        { label: 'Export', href: '/admin/catalog/export' },
        { label: 'Import', href: '/admin/catalog/import' },
        {
          label: 'Descriptions to write',
          href: '/admin/catalog/missing-descriptions',
        },
        {
          label: 'Recipes without steps',
          href: '/admin/catalog/missing-steps',
        },
        {
          label: 'Recipes without ingredients',
          href: '/admin/catalog/missing-ingredients',
        },
        { label: 'Step counts', href: '/admin/catalog/step-histogram' },
        {
          label: 'Ingredient counts',
          href: '/admin/catalog/ingredient-histogram',
        },
        { label: 'Id audit', href: '/admin/catalog/id-audit' },
        { label: 'Long names', href: '/admin/catalog/long-names' },
        { label: 'Picture audit', href: '/admin/catalog/picture-audit' },
      ]);
  });
});

function mountAdmin({
  recipes = [hummus, shakshuka],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(Admin);
}

function tiles() {
  return page
    .getByTestId('stat-tile')
    .elements()
    .map((tile) =>
      [...tile.children]
        .filter((child) => child.tagName === 'SPAN')
        .map((span) => span.textContent?.trim())
        .join(' '),
    );
}

function links() {
  return page
    .getByRole('navigation')
    .getByRole('link')
    .elements()
    .map((link) => ({
      label: link.textContent?.trim(),
      href: link.getAttribute('href'),
    }));
}
