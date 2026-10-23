import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe(RecipeKeywordChips.name, () => {
  it('searches recipes matching the typed prefix', async () => {
    const { fixture, search } = mountRecipeKeywordChips();
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'le');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'le',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows a chip for each suggested keyword', async () => {
    const { fixture, search } = mountRecipeKeywordChips();
    search.mockImplementation((params) =>
      of(searchCatalog([cheesecake, lentilSoup], params)),
    );
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'le');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledOnce();
    expect(chipLabels(fixture.nativeElement)).toEqual(['lemon', 'lentil']);
  });

  it('searches recipes with the picked keyword', async () => {
    const { fixture, search } = mountRecipeKeywordChips();
    search.mockReturnValue(of([cheesecake, lentilSoup]));
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'le');
    await fixture.whenStable();
    search.mockReturnValue(of([lentilSoup]));
    chipByLabel(fixture.nativeElement, 'lentil').click();
    await fixture.whenStable();

    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "le",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
        [
          {
            "keywords": "lentil",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
    expect(recipeNames(fixture.nativeElement)).toEqual(['Red Lentil Soup']);
  });

  it('shows a message when the picked keyword matches no recipe', async () => {
    const { fixture, search } = mountRecipeKeywordChips();
    search
      .mockImplementationOnce((params) =>
        isKeywordOnlySearch(params) ? of([cheesecake]) : of([]),
      )
      .mockImplementationOnce((params) => {
        expect(params).toEqual({
          keywords: 'ricotta',
          maxIngredientCount: null,
          maxStepCount: null,
        });
        return of([]);
      });
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'ri');
    await fixture.whenStable();
    chipByLabel(fixture.nativeElement, 'ricotta').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes found for "ricotta"');
  });

  it('does not search while the prefix is too short', async () => {
    const { fixture, search } = mountRecipeKeywordChips();
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'l');
    await fixture.whenStable();

    expect(search).not.toHaveBeenCalled();
    expect(chipLabels(fixture.nativeElement)).toEqual([]);
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

  const fixture = TestBed.createComponent(RecipeKeywordChips);

  return { fixture, search };
}

function typeKeywordPrefix(root: HTMLElement, prefix: string): void {
  const input = root.querySelector<HTMLInputElement>(
    'input[aria-label="Keyword prefix"]',
  );
  if (input == null) {
    throw new Error('Keyword prefix input not found.');
  }
  input.value = prefix;
  input.dispatchEvent(new Event('input'));
}

function chipLabels(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="keyword-chip"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function chipByLabel(root: HTMLElement, label: string): HTMLButtonElement {
  const chip = [
    ...root.querySelectorAll<HTMLButtonElement>('[data-testid="keyword-chip"]'),
  ].find((el) => el.textContent?.trim() === label);
  if (chip == null) {
    throw new Error(`Chip "${label}" not found.`);
  }
  return chip;
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

/* Mimics the backend: keywords match the recipe name, and courses only
 * narrow the results down when they are sent. */
function searchCatalog(
  catalog: Recipe[],
  { keywords, courses }: RecipeSearchParams,
): Recipe[] {
  return catalog
    .filter((recipe) => recipe.name.toLowerCase().includes(keywords))
    .filter((recipe) => (courses ? courses.includes(recipe.course) : true));
}

function isKeywordOnlySearch({
  keywords,
  ...otherParams
}: RecipeSearchParams): boolean {
  return (
    keywords.length > 0 &&
    Object.values(otherParams).every((value) => value === null)
  );
}
