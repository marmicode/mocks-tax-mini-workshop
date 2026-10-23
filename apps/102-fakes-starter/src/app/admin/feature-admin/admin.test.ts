import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

describe(Admin.name, () => {
  it('searches the whole catalog to compute stats', async () => {
    const { fixture } = mountAdmin({
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
    await fixture.whenStable();

    expect(tiles(fixture.nativeElement)).toEqual(
      expect.arrayContaining([
        '3 Recipes',
        '1 starters',
        '1 mains',
        '1 desserts',
      ]),
    );
  });

  it('shows the recipe count and the count per course', async () => {
    const { fixture } = mountAdmin();
    await fixture.whenStable();

    expect(tiles(fixture.nativeElement)).toEqual(
      expect.arrayContaining([
        '2 Recipes',
        '1 starters',
        '1 mains',
        '0 desserts',
      ]),
    );
  });

  it('shows averages and missing descriptions', async () => {
    const { fixture } = mountAdmin();
    await fixture.whenStable();

    expect(tiles(fixture.nativeElement)).toEqual(
      expect.arrayContaining([
        '3 Avg. ingredients',
        '5.5 Avg. steps',
        '1 Missing descriptions',
      ]),
    );
  });

  it('links to every admin page', async () => {
    const { fixture } = mountAdmin();
    await fixture.whenStable();

    expect(links(fixture.nativeElement)).toEqual([
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
      { label: 'Recipes without steps', href: '/admin/catalog/missing-steps' },
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
  const fixture = TestBed.createComponent(Admin);
  return { fixture };
}

function tiles(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="stat-tile"]')].map((tile) =>
    [...tile.querySelectorAll('span')]
      .map((span) => span.textContent?.trim())
      .join(' '),
  );
}

function links(root: HTMLElement) {
  return [...root.querySelectorAll('nav a')].map((link) => ({
    label: link.textContent?.trim(),
    href: link.getAttribute('href'),
  }));
}
