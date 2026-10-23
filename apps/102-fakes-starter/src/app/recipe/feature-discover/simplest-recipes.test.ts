import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { SimplestRecipes } from './simplest-recipes.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'chickpeas' }, { name: 'ful' }, { name: 'tahini' }],
  steps: [],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [{ name: 'aubergine' }, { name: 'tahini' }],
  steps: [],
};

describe(SimplestRecipes.name, () => {
  it('shows recipes with the fewest ingredients first', async () => {
    const { fixture } = mountSimplestRecipes({ recipes: [hummus, salad] });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Burnt Aubergine with Tahini and Pomegranate',
      'Hummus with Ful',
    ]);
  });

  it('sorts recipes with as many ingredients by name', async () => {
    const { fixture } = mountSimplestRecipes({
      recipes: [
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: null,
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
          steps: [],
        },
        salad,
      ],
    });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Burnt Aubergine with Tahini and Pomegranate',
      'Shakshuka',
    ]);
  });

  it('shows the ingredient count of each recipe', async () => {
    const { fixture } = mountSimplestRecipes({ recipes: [hummus] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="ingredient-count"]')
        ?.textContent?.trim(),
    ).toBe('3 ingredients');
  });

  it('shows a message when there are no recipes', async () => {
    const { fixture } = mountSimplestRecipes({ recipes: [] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes found');
  });
});

function mountSimplestRecipes({
  recipes = [hummus, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(SimplestRecipes);

  return { fixture };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
