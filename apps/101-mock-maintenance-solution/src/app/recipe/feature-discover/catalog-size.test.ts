import { HttpClient, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import type { RecipeSearchParams } from '@whiskmate/recipe/infra';
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

describe(CatalogSize, () => {
  it('searches all recipes', async () => {
    const { post } = mountCatalogSize();

    await expect
      .poll(() => post)
      .toHaveBeenCalledExactlyOnceWith('/api/recipes/search', {
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: [],
      });
  });

  it('shows the number of recipes', async () => {
    const { post } = mountCatalogSize();
    post.mockImplementation(
      searchHandler((params) =>
        params.courses.length > 0
          ? [hummus, salad].filter((recipe) =>
              params.courses?.includes(recipe.course),
            )
          : [hummus, salad],
      ),
    );

    await expect
      .element(page.getByTestId('catalog-size'))
      .toHaveTextContent('2 recipes');
  });

  it('uses the singular for a single recipe', async () => {
    const { post } = mountCatalogSize();
    post.mockImplementation(
      searchHandler((params) => (isWholeCatalogSearch(params) ? [hummus] : [])),
    );

    await expect
      .element(page.getByTestId('catalog-size'))
      .toHaveTextContent('1 recipe');
  });

  it('counts distinct ingredients', async () => {
    const { post } = mountCatalogSize();
    post.mockReturnValue(of([hummus, salad]));

    await expect
      .element(page.getByTestId('ingredient-count'))
      .toHaveTextContent('Using 3 distinct ingredients.');
    expect(searchKey(post.mock.calls[0])).toBe(
      '/api/recipes/search?keywords=&maxIngredientCount=&maxStepCount=&courses=',
    );
  });

  it('shows a message when the catalog is empty', async () => {
    const { post } = mountCatalogSize();
    post.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toHaveTextContent('The catalog is empty.');
    expect(post).toHaveBeenCalledExactlyOnceWith('/api/recipes/search', {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    await expect(JSON.stringify(post.mock.calls, null, 2)).toMatchFileSnapshot(
      './__snapshots__/catalog-size-empty.calls.json',
    );
  });
});

function mountCatalogSize() {
  const post = vi
    .spyOn(TestBed.inject(HttpClient), 'post')
    .mockImplementation((url: string, body: unknown) => {
      if (
        url !== '/api/recipes/search' ||
        (body as RecipeSearchParams).courses.length > 0
      ) {
        throw new Error(`unexpected POST ${url} ${JSON.stringify(body)}`);
      }
      return of([hummus, salad]);
    });

  TestBed.createComponent(CatalogSize);

  return { post };
}

function searchHandler(
  respond: (params: RecipeSearchParams) => Recipe[],
): (url: string, body: unknown) => Observable<Recipe[]> {
  return (url, body) =>
    url === '/api/recipes/search'
      ? of(respond(body as RecipeSearchParams))
      : throwError(() => new Error(`unexpected POST ${url}`));
}

function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return Object.values(params).every(
    (value) => value === '' || value === null || isEmptyArray(value),
  );
}

function searchKey([url, body]: unknown[]): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(body as RecipeSearchParams)) {
    query.append(key, value == null ? '' : String(value));
  }
  return `${url}?${query}`;
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
