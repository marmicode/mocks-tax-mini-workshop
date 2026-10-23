import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AlphabeticalIndex } from './alphabetical-index.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
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

const sabich: Recipe = {
  id: 'sabich',
  course: 'main',
  name: 'Sabich',
  description: null,
  pictureUri: 'https://example.com/sabich.jpg',
  ingredients: [],
  steps: [],
};

describe(AlphabeticalIndex.name, () => {
  it('groups recipes by first letter in alphabetical order', async () => {
    const { fixture } = mountAlphabeticalIndex({
      recipes: [shakshuka, salad, sabich],
    });
    await fixture.whenStable();

    expect(letters(fixture.nativeElement)).toEqual(['B', 'S']);
  });

  it('sorts recipes by name within a letter', async () => {
    const { fixture } = mountAlphabeticalIndex({
      recipes: [shakshuka, sabich],
    });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Sabich', 'Shakshuka']);
  });

  it('puts recipes not starting with a letter at the end', async () => {
    const { fixture } = mountAlphabeticalIndex({
      recipes: [
        {
          id: '7-hour-lamb',
          course: 'main',
          name: '7-hour Lamb',
          description: null,
          pictureUri: 'https://example.com/lamb.jpg',
          ingredients: [],
          steps: [],
        },
        shakshuka,
      ],
    });
    await fixture.whenStable();

    expect(letters(fixture.nativeElement)).toEqual(['S', '#']);
  });

  it('links each recipe to its detail page', async () => {
    const { fixture } = mountAlphabeticalIndex({ recipes: [sabich] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="recipe-name"]')
        ?.getAttribute('href'),
    ).toBe('/recipes/sabich');
  });

  it('shows a message when there are no recipes', async () => {
    const { fixture } = mountAlphabeticalIndex({ recipes: [] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes to index');
  });
});

function mountAlphabeticalIndex({
  recipes = [shakshuka, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AlphabeticalIndex);

  return { fixture };
}

function letters(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="letter"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
