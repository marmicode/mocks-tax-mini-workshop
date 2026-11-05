import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RandomAdapter } from '@whiskmate/shared/infra';
import { IngredientSpotlight } from './ingredient-spotlight.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: '400g chickpeas' }, { name: 'Tahini' }],
  steps: [],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [{ name: '2 aubergines, burnt' }, { name: 'tahini' }],
  steps: [],
};

/**
 * Canned backend responses, keyed by the exact search body.
 */
const searchResults: Record<string, Recipe[]> = {
  '{"keywords":"","maxIngredientCount":null,"maxStepCount":null}': [
    hummus,
    salad,
  ],
};

describe(IngredientSpotlight, () => {
  it('picks a random ingredient among all distinct ingredients', async () => {
    const { search, pick } = mountIngredientSpotlight();

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('chickpeas');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(pick).toHaveBeenCalledExactlyOnceWith([
      'aubergines',
      'chickpeas',
      'tahini',
    ]);
  });

  it('shows the recipes using the spotlighted ingredient', async () => {
    const { pick } = mountIngredientSpotlight();
    pick.mockReturnValue('tahini');

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('tahini');
    await expect
      .poll(recipeNames)
      .toEqual([
        'Hummus with Ful',
        'Burnt Aubergine with Tahini and Pomegranate',
      ]);
  });

  it('only shows recipes using the spotlighted ingredient', async () => {
    const { pick } = mountIngredientSpotlight();
    pick.mockReturnValue('aubergines');

    await expect
      .poll(recipeNames)
      .toEqual(['Burnt Aubergine with Tahini and Pomegranate']);
  });

  it('spotlights another ingredient when asked', async () => {
    const { search, pick } = mountIngredientSpotlight();
    pick.mockReturnValueOnce('chickpeas').mockReturnValueOnce('aubergines');

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('chickpeas');

    await page.getByRole('button', { name: 'Another ingredient' }).click();

    await expect
      .element(page.getByTestId('spotlight-ingredient'))
      .toHaveTextContent('aubergines');
    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1]).toEqual(search.mock.calls[0]);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('shows a message when there is no ingredient to spotlight', async () => {
    const { search, pick } = mountIngredientSpotlight();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No ingredient to put in the spotlight');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(pick).not.toHaveBeenCalled();
  });
});

function mountIngredientSpotlight() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) => {
      const recipes = searchResults[JSON.stringify(params)];
      if (recipes == null) {
        throw new Error(`unexpected search ${JSON.stringify(params)}`);
      }
      return of(recipes);
    });
  const pick = vi
    .spyOn(TestBed.inject(RandomAdapter), 'pick')
    .mockReturnValue('chickpeas');

  TestBed.createComponent(IngredientSpotlight);

  return { search, pick };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}
