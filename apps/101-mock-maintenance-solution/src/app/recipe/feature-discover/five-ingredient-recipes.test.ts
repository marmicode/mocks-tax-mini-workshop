import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { FiveIngredientRecipes } from './five-ingredient-recipes.ng';

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

describe(FiveIngredientRecipes.name, () => {
  it('searches recipes with at most five ingredients', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows the five-ingredient recipes', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    search.mockReturnValue(of([hummus, salad]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Hummus with Ful',
      'Burnt Aubergine with Tahini and Pomegranate',
    ]);
  });

  it('narrows the search with keywords', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    typeKeywords(fixture.nativeElement, 'hummus');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith({
      keywords: 'hummus',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
  });

  it('searches again once keywords are cleared', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    await fixture.whenStable();

    typeKeywords(fixture.nativeElement, 'salad');
    await fixture.whenStable();
    typeKeywords(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows a message when there are no five-ingredient recipes', async () => {
    const { fixture, search } = mountFiveIngredientRecipes();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: 5,
      maxStepCount: null,
      courses: [],
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No five-ingredient recipes found');
  });
});

function mountFiveIngredientRecipes() {
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
    .mockReturnValue(of([hummus, salad]));

  const fixture = TestBed.createComponent(FiveIngredientRecipes);

  return { fixture, search };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function typeKeywords(root: HTMLElement, keywords: string): void {
  const input = root.querySelector<HTMLInputElement>(
    '[data-testid="keywords-input"]',
  );
  if (input == null) {
    throw new Error('Keywords input not found.');
  }
  input.value = keywords;
  input.dispatchEvent(new Event('input'));
}
