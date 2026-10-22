import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { Admin } from './admin.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: 'Creamy hummus.',
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'tahini' }],
  steps: ['Blend.', 'Serve.'],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }, { name: 'peppers' }],
  steps: ['Cook the sauce.', 'Poach the eggs.', 'Serve.', 'Enjoy.'],
};

describe(Admin.name, () => {
  it('searches the whole catalog to compute stats', async () => {
    const { fixture, search } = mountAdmin();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows the recipe count and the count per course', async () => {
    const { fixture, search } = mountAdmin();
    search.mockReturnValue(of([hummus, shakshuka]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
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
    const { fixture, search } = mountAdmin();
    search.mockReturnValue(of([hummus, shakshuka]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(tiles(fixture.nativeElement)).toEqual(
      expect.arrayContaining([
        '2.5 Avg. ingredients',
        '3 Avg. steps',
        '1 Missing descriptions',
      ]),
    );
  });

  it('links to every admin page', async () => {
    const { fixture, search } = mountAdmin();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
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

function mountAdmin() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));
  const fixture = TestBed.createComponent(Admin);
  return { fixture, search };
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
