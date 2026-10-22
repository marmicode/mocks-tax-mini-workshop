import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { CatalogSize } from './catalog-size.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: '400g chickpeas' }, { name: 'tahini' }],
  steps: [],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [{ name: '2 aubergines' }, { name: 'Tahini' }],
  steps: [],
};

describe(CatalogSize.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountCatalogSize();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows the number of recipes', async () => {
    const { fixture, search } = mountCatalogSize();
    search.mockReturnValue(of([hummus, salad]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(textOf(fixture.nativeElement, 'catalog-size')).toBe('2 recipes');
  });

  it('uses the singular for a single recipe', async () => {
    const { fixture, search } = mountCatalogSize();
    search.mockReturnValue(of([hummus]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(textOf(fixture.nativeElement, 'catalog-size')).toBe('1 recipe');
  });

  it('counts distinct ingredients', async () => {
    const { fixture, search } = mountCatalogSize();
    search.mockReturnValue(of([hummus, salad]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(textOf(fixture.nativeElement, 'ingredient-count')).toBe(
      'Using 3 distinct ingredients.',
    );
  });

  it('shows a message when the catalog is empty', async () => {
    const { fixture, search } = mountCatalogSize();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(textOf(fixture.nativeElement, 'no-recipes-message')).toBe(
      'The catalog is empty.',
    );
  });
});

function mountCatalogSize() {
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([hummus, salad]));

  const fixture = TestBed.createComponent(CatalogSize);

  return { fixture, search };
}

function textOf(root: HTMLElement, testId: string): string | undefined {
  return root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
}
