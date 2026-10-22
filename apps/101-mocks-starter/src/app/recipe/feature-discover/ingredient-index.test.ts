import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { IngredientIndex } from './ingredient-index.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: '2 red peppers, sliced' },
    { name: 'garlic, crushed', quantity: { amount: 4, unit: 'cloves' } },
    { name: '800g tinned chopped tomatoes' },
  ],
  steps: [],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [
    { name: 'tahini', quantity: { amount: 4, unit: 'tbsp' } },
    { name: 'garlic', quantity: { amount: 1, unit: 'clove' } },
  ],
  steps: [],
};

describe(IngredientIndex.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountIngredientIndex();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('lists normalized ingredient names alphabetically', async () => {
    const { fixture, search } = mountIngredientIndex();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(ingredientNames(fixture.nativeElement)).toEqual([
      'garlic',
      'red peppers',
      'tahini',
      'tinned chopped tomatoes',
    ]);
  });

  it('groups ingredients by first letter', async () => {
    const { fixture, search } = mountIngredientIndex();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(sectionLetters(fixture.nativeElement)).toEqual(['g', 'r', 't']);
  });

  it('lists every recipe using an ingredient', async () => {
    const { fixture, search } = mountIngredientIndex();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipeNamesFor(fixture.nativeElement, 'garlic')).toEqual([
      'Shakshuka',
      'Hummus with Ful',
    ]);
  });

  it('filters ingredients', async () => {
    const { fixture, search } = mountIngredientIndex();
    await fixture.whenStable();

    typeInto(fixture.nativeElement.querySelector('input'), 'ta');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(ingredientNames(fixture.nativeElement)).toEqual(['tahini']);
  });

  it('shows a message when no ingredient matches', async () => {
    const { fixture, search } = mountIngredientIndex();
    await fixture.whenStable();

    typeInto(fixture.nativeElement.querySelector('input'), 'saffron');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="no-ingredients-message"]',
      )?.textContent,
    ).toContain('No ingredients found.');
  });
});

function mountIngredientIndex() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([shakshuka, hummus]));

  const fixture = TestBed.createComponent(IngredientIndex);

  return { fixture, search };
}

function entries(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-testid="index-entry"]')];
}

function ingredientNames(root: HTMLElement): string[] {
  return entries(root).map(
    (entry) => entry.querySelector('dt')?.textContent?.trim() ?? '',
  );
}

function sectionLetters(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="index-section"] h3')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function recipeNamesFor(root: HTMLElement, ingredient: string): string[] {
  const entry = entries(root).find(
    (el) => el.querySelector('dt')?.textContent?.trim() === ingredient,
  );
  return [...(entry?.querySelectorAll('dd a') ?? [])].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}
