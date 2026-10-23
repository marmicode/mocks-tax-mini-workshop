import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import {
  provideRandomAdapterFake,
  RandomAdapterFake,
} from '@whiskmate/shared/infra';
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

describe(IngredientSpotlight.name, () => {
  it('picks a random ingredient among all distinct ingredients', async () => {
    const { fixture, randomAdapterFake } = mountIngredientSpotlight();
    /* Distinct ingredients are sorted: aubergines, chickpeas, tahini. */
    randomAdapterFake.setPickIndex(-1);
    await fixture.whenStable();

    expect(spotlightIngredient(fixture.nativeElement)).toBe('tahini');
  });

  it('shows the recipes using the spotlighted ingredient', async () => {
    const { fixture, randomAdapterFake } = mountIngredientSpotlight();
    randomAdapterFake.setPickIndex(-1);
    await fixture.whenStable();

    expect(spotlightIngredient(fixture.nativeElement)).toBe('tahini');
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('only shows recipes using the spotlighted ingredient', async () => {
    const { fixture } = mountIngredientSpotlight();
    await fixture.whenStable();

    expect(spotlightIngredient(fixture.nativeElement)).toBe('aubergines');
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('spotlights another ingredient when asked', async () => {
    const { fixture, randomAdapterFake } = mountIngredientSpotlight();
    await fixture.whenStable();

    randomAdapterFake.setPickIndex(-1);
    buttonByText(fixture.nativeElement, 'Another ingredient').click();
    await fixture.whenStable();

    expect(spotlightIngredient(fixture.nativeElement)).toBe('tahini');
  });

  it('shows a message when there is no ingredient to spotlight', async () => {
    const { fixture } = mountIngredientSpotlight({ recipes: [] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No ingredient to put in the spotlight');
  });
});

function mountIngredientSpotlight({
  recipes = [hummus, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideRandomAdapterFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const randomAdapterFake = TestBed.inject(RandomAdapterFake);

  const fixture = TestBed.createComponent(IngredientSpotlight);

  return { fixture, randomAdapterFake };
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
