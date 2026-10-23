import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { ThreeStepRecipes } from './three-step-recipes.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: ['Blend the chickpeas.', 'Warm the ful.', 'Serve.'],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [],
  steps: ['Burn the aubergine.', 'Dress with tahini.'],
};

const lamb: Recipe = {
  id: 'slow-roasted-lamb',
  course: 'main',
  name: 'Slow-roasted Lamb',
  description: null,
  pictureUri: 'https://example.com/lamb.jpg',
  ingredients: [],
  steps: ['Marinate.', 'Sear.', 'Roast.', 'Rest.', 'Carve.'],
};

describe(ThreeStepRecipes.name, () => {
  it('shows only recipes with at most three steps', async () => {
    const { fixture } = mountThreeStepRecipes();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('shows the steps of each recipe', async () => {
    const { fixture } = mountThreeStepRecipes({ recipes: [salad] });
    await fixture.whenStable();

    expect(steps(fixture.nativeElement)).toEqual([
      'Burn the aubergine.',
      'Dress with tahini.',
    ]);
  });

  it('links each recipe to its detail page', async () => {
    const { fixture } = mountThreeStepRecipes({ recipes: [hummus] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="recipe-name"]')
        ?.getAttribute('href'),
    ).toBe('/recipes/hummus-ful');
  });

  it('shows a message when there are no three-step recipes', async () => {
    const { fixture } = mountThreeStepRecipes({ recipes: [lamb] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No three-step recipes found');
  });
});

function mountThreeStepRecipes({
  recipes = [hummus, salad, lamb],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(ThreeStepRecipes);

  return { fixture };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function steps(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-step"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
