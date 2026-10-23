import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { QuickRecipes } from './quick-recipes.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [],
  steps: [],
};

const quickRecipesBySearch: Record<string, Recipe[]> = {
  [JSON.stringify({ keywords: '', maxIngredientCount: null, maxStepCount: 5 })]:
    [hummus, salad],
  [JSON.stringify({ keywords: '', maxIngredientCount: 6, maxStepCount: 5 })]: [
    hummus,
  ],
};

describe(QuickRecipes.name, () => {
  it('searches recipes with few steps', async () => {
    const { fixture, search } = mountQuickRecipes();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 5,
    });
  });

  it('shows the quick recipes', async () => {
    const { fixture, search } = mountQuickRecipes();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('also caps ingredients when asked', async () => {
    const { fixture, search } = mountQuickRecipes();
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "keywords": "",
          "maxIngredientCount": 6,
          "maxStepCount": 5,
        },
      ]
    `);
  });

  it('stops capping ingredients once unchecked', async () => {
    const { fixture, search } = mountQuickRecipes();
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();
    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 5,
    });
  });

  it('shows a message when there are no quick recipes', async () => {
    const { fixture, search } = mountQuickRecipes();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 5,
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No quick recipes found');
  });

  it('mentions the step cap', async () => {
    const { fixture, search } = mountQuickRecipes();
    await fixture.whenStable();

    expect(search.mock.calls).toMatchSnapshot();
    expect(fixture.nativeElement.textContent).toContain(
      'Recipes with at most 5 steps.',
    );
  });

  it('shows the recipes with few ingredients once capped', async () => {
    const { fixture, search } = mountQuickRecipes();
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('shows a message when no quick recipe has few ingredients', async () => {
    const { fixture, search } = mountQuickRecipes();
    await fixture.whenStable();

    search.mockReturnValue(of([]));
    checkboxByLabel(fixture.nativeElement, 'At most 6 ingredients').click();
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: 6,
      maxStepCount: 5,
    });
    expect(recipeNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No quick recipes found');
  });
});

function mountQuickRecipes() {
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
    .mockImplementation((params) => {
      const recipes = quickRecipesBySearch[JSON.stringify(params)];
      return recipes != null
        ? of(recipes)
        : throwError(
            () => new Error(`unexpected search ${JSON.stringify(params)}`),
          );
    });

  const fixture = TestBed.createComponent(QuickRecipes);

  return { fixture, search };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function checkboxByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const checkbox = [...root.querySelectorAll('mat-checkbox')].find(
    (el) => el.textContent?.trim() === label,
  );
  const input = checkbox?.querySelector('input');
  if (input == null) {
    throw new Error(`Checkbox "${label}" not found.`);
  }
  return input;
}
