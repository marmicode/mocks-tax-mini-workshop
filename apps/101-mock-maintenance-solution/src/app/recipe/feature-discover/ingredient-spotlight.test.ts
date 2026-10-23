import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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
  '{"keywords":"","maxIngredientCount":null,"maxStepCount":null,"courses":[]}':
    [hummus, salad],
};

describe(IngredientSpotlight.name, () => {
  it('picks a random ingredient among all distinct ingredients', async () => {
    const { fixture, search, pick } = mountIngredientSpotlight();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(pick).toHaveBeenCalledExactlyOnceWith([
      'aubergines',
      'chickpeas',
      'tahini',
    ]);
  });

  it('shows the recipes using the spotlighted ingredient', async () => {
    const { fixture, search, pick } = mountIngredientSpotlight();
    pick.mockReturnValue('tahini');
    await fixture.whenStable();

    expect(spotlightIngredient(fixture.nativeElement)).toBe('tahini');
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('only shows recipes using the spotlighted ingredient', async () => {
    const { fixture, search, pick } = mountIngredientSpotlight();
    pick.mockReturnValue('aubergines');
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('spotlights another ingredient when asked', async () => {
    const { fixture, search, pick } = mountIngredientSpotlight();
    pick.mockReturnValueOnce('chickpeas').mockReturnValueOnce('aubergines');
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Another ingredient').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1]).toEqual(search.mock.calls[0]);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
    expect(spotlightIngredient(fixture.nativeElement)).toBe('aubergines');
  });

  it('shows a message when there is no ingredient to spotlight', async () => {
    const { fixture, search, pick } = mountIngredientSpotlight();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(pick).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No ingredient to put in the spotlight');
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

  const fixture = TestBed.createComponent(IngredientSpotlight);

  return { fixture, search, pick };
}

function spotlightIngredient(root: HTMLElement): string | undefined {
  return root
    .querySelector('[data-testid="spotlight-ingredient"]')
    ?.textContent?.trim();
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
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
