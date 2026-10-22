import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { ClockAdapter } from '@whiskmate/shared/infra';
import { RecipeOfTheDay } from './recipe-of-the-day.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeOfTheDay.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountRecipeOfTheDay(new Date(2026, 0, 1));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('picks the recipe matching the day of the year', async () => {
    /* January 2nd is the 2nd day of the year: 2 % 3 = 2. */
    const { fixture, search } = mountRecipeOfTheDay(new Date(2026, 0, 2));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipeName(fixture.nativeElement)).toBe(
      'Lemon and Ricotta Cheesecake',
    );
  });

  it('picks another recipe the next day', async () => {
    /* January 3rd is the 3rd day of the year: 3 % 3 = 0. */
    const { fixture, search } = mountRecipeOfTheDay(new Date(2026, 0, 3));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipeName(fixture.nativeElement)).toBe('Shakshuka');
  });

  it('shows the description, picture and a link to the recipe', async () => {
    const { fixture, search } = mountRecipeOfTheDay(new Date(2026, 0, 3));
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(
      root.querySelector('[data-testid="recipe-description"]')?.textContent,
    ).toContain('Eggs poached in a spiced tomato sauce.');
    expect(root.querySelector('img')?.getAttribute('src')).toBe(
      'https://example.com/shakshuka.jpg',
    );
    expect(root.querySelector('a')?.getAttribute('href')).toBe(
      '/recipes/shakshuka',
    );
  });

  it('shows a message when there are no recipes', async () => {
    const { fixture, search } = mountRecipeOfTheDay(new Date(2026, 0, 3));
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipe today');
  });
});

function mountRecipeOfTheDay(now: Date) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([shakshuka, hummus, cheesecake]));
  vi.spyOn(TestBed.inject(ClockAdapter), 'now').mockReturnValue(now);

  const fixture = TestBed.createComponent(RecipeOfTheDay);

  return { fixture, search };
}

function recipeName(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="recipe-name"]')?.textContent?.trim();
}
