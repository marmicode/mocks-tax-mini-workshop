import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
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
  [JSON.stringify({
    keywords: '',
    maxIngredientCount: null,
    maxStepCount: 5,
    courses: [],
  })]: [hummus, salad],
  [JSON.stringify({
    keywords: '',
    maxIngredientCount: 6,
    maxStepCount: 5,
    courses: [],
  })]: [hummus],
};

describe(QuickRecipes, () => {
  it('searches recipes with few steps', async () => {
    const { search } = mountQuickRecipes();

    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: 5,
        courses: [],
      });
  });

  it('shows the quick recipes', async () => {
    mountQuickRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('also caps ingredients when asked', async () => {
    const { search } = mountQuickRecipes();

    await expect.poll(() => search.mock.calls.length).toBe(1);

    await page.getByRole('checkbox', { name: 'At most 6 ingredients' }).click();

    await expect.poll(() => search.mock.calls.length).toBe(2);
    expect(search.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "courses": [],
          "keywords": "",
          "maxIngredientCount": 6,
          "maxStepCount": 5,
        },
      ]
    `);
  });

  it('stops capping ingredients once unchecked', async () => {
    const { search } = mountQuickRecipes();

    await expect.poll(() => search.mock.calls.length).toBe(1);

    await page.getByRole('checkbox', { name: 'At most 6 ingredients' }).click();
    await expect.poll(() => search.mock.calls.length).toBe(2);

    await page.getByRole('checkbox', { name: 'At most 6 ingredients' }).click();

    await expect
      .poll(() => search)
      .toHaveBeenLastCalledWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: 5,
        courses: [],
      });
  });

  it('shows a message when there are no quick recipes', async () => {
    const { search } = mountQuickRecipes();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No quick recipes found');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: 5,
      courses: [],
    });
  });

  it('mentions the step cap', async () => {
    const { search } = mountQuickRecipes();

    await expect
      .element(page.getByText('Recipes with at most 5 steps.'))
      .toMatchTextContent('Recipes with at most 5 steps.');
    await expect.poll(() => search.mock.calls).toHaveLength(1);
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('shows the recipes with few ingredients once capped', async () => {
    mountQuickRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);

    await page.getByRole('checkbox', { name: 'At most 6 ingredients' }).click();

    await expect.poll(recipeNames).toEqual(['Hummus with Ful']);
  });

  it('shows a message when no quick recipe has few ingredients', async () => {
    const { search } = mountQuickRecipes();

    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);

    search.mockReturnValue(of([]));
    await page.getByRole('checkbox', { name: 'At most 6 ingredients' }).click();

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No quick recipes found');
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: 6,
      maxStepCount: 5,
      courses: [],
    });
    await expect.poll(recipeNames).toEqual([]);
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

  TestBed.createComponent(QuickRecipes);

  return { search };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
