import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecipeKeywordChips } from './recipe-keyword-chips.ng';

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

const lentilSoup: Recipe = {
  id: 'lentil-soup',
  course: 'starter',
  name: 'Red Lentil Soup',
  description: null,
  pictureUri: 'https://example.com/lentil-soup.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeKeywordChips, () => {
  it('searches recipes matching the typed prefix', async () => {
    const { search } = mountRecipeKeywordChips();

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('le');

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'le',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows a chip for each suggested keyword', async () => {
    const { search, chipLabels } = mountRecipeKeywordChips();
    search.mockImplementation((params) =>
      of(searchCatalog([cheesecake, lentilSoup], params)),
    );

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('le');

    await expect.poll(() => chipLabels()).toEqual(['lemon', 'lentil']);
    expect(search).toHaveBeenCalledOnce();
  });

  it('searches recipes with the picked keyword', async () => {
    const { search, chipLabels, recipeNames } = mountRecipeKeywordChips();
    search.mockReturnValue(of([cheesecake, lentilSoup]));

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('le');
    await expect.poll(() => chipLabels()).toEqual(['lemon', 'lentil']);
    search.mockReturnValue(of([lentilSoup]));
    await page.getByRole('button', { name: 'lentil' }).click();

    await expect.poll(() => recipeNames()).toEqual(['Red Lentil Soup']);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "le",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
        [
          {
            "courses": [],
            "keywords": "lentil",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('shows a message when the picked keyword matches no recipe', async () => {
    const { search } = mountRecipeKeywordChips();
    search
      .mockImplementationOnce((params) =>
        isKeywordOnlySearch(params) ? of([cheesecake]) : of([]),
      )
      .mockImplementationOnce((params) => {
        expect(params).toEqual({
          keywords: 'ricotta',
          maxIngredientCount: null,
          maxStepCount: null,
          courses: [],
        });
        return of([]);
      });

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('ri');
    await page.getByRole('button', { name: 'ricotta' }).click();

    await expect
      .element(page.getByText('No recipes found for "ricotta".'))
      .toHaveTextContent('No recipes found for "ricotta".');
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('does not search while the prefix is too short', async () => {
    const { search, chipLabels } = mountRecipeKeywordChips();

    await page.getByRole('searchbox', { name: 'Keyword prefix' }).fill('l');

    await expect
      .element(page.getByRole('searchbox', { name: 'Keyword prefix' }))
      .toHaveValue('l');
    expect(search).not.toHaveBeenCalled();
    await expect.poll(() => chipLabels()).toEqual([]);
  });
});

function mountRecipeKeywordChips() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: LocalStorage,
        useValue: {
          getItem: vi.fn().mockReturnValue(null),
          setItem: vi.fn(),
        },
      },
    ],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(RecipeKeywordChips);

  return {
    search,
    chipLabels: () =>
      page
        .getByTestId('keyword-chip')
        .elements()
        .map((el) => el.textContent?.trim() ?? ''),
    recipeNames: () =>
      page
        .getByTestId('recipe-name')
        .elements()
        .map((el) => el.textContent?.trim() ?? ''),
  };
}

/* Mimics the backend: keywords match the recipe name, and courses only
 * narrow the results down when they are sent. */
function searchCatalog(
  catalog: Recipe[],
  { keywords, courses }: RecipeSearchParams,
): Recipe[] {
  return catalog
    .filter((recipe) => recipe.name.toLowerCase().includes(keywords))
    .filter((recipe) =>
      courses.length > 0 ? courses.includes(recipe.course) : true,
    );
}

function isKeywordOnlySearch({
  keywords,
  ...otherParams
}: RecipeSearchParams): boolean {
  return (
    keywords.length > 0 &&
    Object.values(otherParams).every(
      (value) => value === null || isEmptyArray(value),
    )
  );
}

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}
