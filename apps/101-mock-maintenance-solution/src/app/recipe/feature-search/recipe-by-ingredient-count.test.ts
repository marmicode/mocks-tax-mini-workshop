import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecipeByIngredientCount } from './recipe-by-ingredient-count.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeByIngredientCount.name, () => {
  it('searches recipes with at most 5 ingredients by default', async () => {
    const { fixture, search } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows the matching recipes', async () => {
    const { fixture, search } = mountRecipeByIngredientCount();
    search.mockReturnValue(of([hummus, shakshuka]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Shakshuka',
    ]);
  });

  it('counts the matching recipes', async () => {
    const { fixture, search } = mountRecipeByIngredientCount();
    search.mockReturnValue(of([shakshuka]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
    expect(recipeCount(fixture.nativeElement)).toBe(
      '1 recipes with at most 5 ingredients',
    );
  });

  it('searches with fewer ingredients when asked', async () => {
    const { fixture, search } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'At most 3 ingredients').click();
    await fixture.whenStable();

    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": 5,
            "maxStepCount": null,
          },
        ],
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": 3,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('searches with more ingredients when asked', async () => {
    const { fixture, search } = mountRecipeByIngredientCount();
    await fixture.whenStable();

    search.mockReturnValue(of([]));
    buttonByText(fixture.nativeElement, 'At most 8 ingredients').click();
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: 8,
      maxStepCount: null,
      courses: [],
    });
    expect(recipeCount(fixture.nativeElement)).toBe(
      '0 recipes with at most 8 ingredients',
    );
  });
});

function mountRecipeByIngredientCount() {
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
    .mockReturnValue(of([hummus]));

  const fixture = TestBed.createComponent(RecipeByIngredientCount);

  return { fixture, search };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function recipeCount(root: HTMLElement): string | undefined {
  return root
    .querySelector('[data-testid="recipe-count"]')
    ?.textContent?.replace(/\s+/g, ' ')
    .trim();
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
