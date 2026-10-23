import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeQuickSearch } from './recipe-quick-search.ng';

const burntAubergine: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/burnt-aubergine.jpg',
  ingredients: [],
  steps: [],
};

const roastedAubergine: Recipe = {
  id: 'roasted-aubergine-tahini',
  course: 'starter',
  name: 'Roasted Aubergine with Tahini and Pine Nuts',
  description: null,
  pictureUri: 'https://example.com/roasted-aubergine.jpg',
  ingredients: [],
  steps: [],
};

const SEARCH_PARAM_KEYS = ['keywords', 'maxIngredientCount', 'maxStepCount'];

describe(RecipeQuickSearch.name, () => {
  it('does not search with less than 2 characters', async () => {
    const { fixture, search } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'a');
    await fixture.whenStable();

    expect(search).not.toHaveBeenCalled();
    expect(suggestionNames(fixture.nativeElement)).toEqual([]);
  });

  it('searches by keywords', async () => {
    const { fixture, search } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'aub');
    await fixture.whenStable();

    expect(suggestionNames(fixture.nativeElement)).toEqual([
      'Burnt Aubergine with Tahini and Pomegranate',
      'Roasted Aubergine with Tahini and Pine Nuts',
    ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'aub',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows at most 5 suggestions', async () => {
    const { fixture, search } = mountQuickSearch();
    search.mockReturnValue(
      of(
        Array.from({ length: 7 }, (_, index) => ({
          ...burntAubergine,
          id: `aubergine-${index}`,
          name: `Aubergine ${index}`,
        })),
      ),
    );
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'aub');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'aub',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(suggestionNames(fixture.nativeElement)).toHaveLength(5);
  });

  it('links suggestions to the recipe detail page', async () => {
    const { fixture } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'aub');
    await fixture.whenStable();

    expect(
      suggestionLinks(fixture.nativeElement)[0]?.getAttribute('href'),
    ).toBe('/recipes/burnt-aubergine-salad');
  });

  it('says when nothing matches', async () => {
    const { fixture, search } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'xyz');
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="quick-search-empty"]')
        ?.textContent,
    ).toContain('No recipes found');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'xyz',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('clears the search once a suggestion is picked', async () => {
    const { fixture } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'aub');
    await fixture.whenStable();
    suggestionLinks(fixture.nativeElement)[0]?.click();
    await fixture.whenStable();

    expect(quickSearchInput(fixture.nativeElement).value).toBe('');
    expect(suggestionNames(fixture.nativeElement)).toEqual([]);
  });

  it('trims keywords before searching', async () => {
    const { fixture, search } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), '  tahini  ');
    await fixture.whenStable();

    expect(suggestionNames(fixture.nativeElement)).toEqual([
      'Burnt Aubergine with Tahini and Pomegranate',
      'Roasted Aubergine with Tahini and Pine Nuts',
    ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'tahini',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('waits for 2 non-blank characters before searching', async () => {
    const { fixture, search } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'a ');
    await fixture.whenStable();
    typeInto(quickSearchInput(fixture.nativeElement), 'au');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'au',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('refines suggestions while typing', async () => {
    const { fixture, search } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'aub');
    await fixture.whenStable();
    typeInto(quickSearchInput(fixture.nativeElement), 'pine');
    await fixture.whenStable();

    expect(suggestionNames(fixture.nativeElement)).toEqual([
      'Roasted Aubergine with Tahini and Pine Nuts',
    ]);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: 'aub',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: 'pine',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('hides suggestions once keywords become too short again', async () => {
    const { fixture, search } = mountQuickSearch();
    await fixture.whenStable();

    typeInto(quickSearchInput(fixture.nativeElement), 'aub');
    await fixture.whenStable();
    typeInto(quickSearchInput(fixture.nativeElement), 'a');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'aub',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(suggestionNames(fixture.nativeElement)).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="quick-search-empty"]'),
    ).toBeNull();
  });
});

@Component({ template: '' })
class Blank {}

function mountQuickSearch() {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: '**', component: Blank }])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) => {
      /* Fail fast on params this stub does not know how to handle. */
      const unexpectedKeys = Object.keys(params).filter(
        (key) => !SEARCH_PARAM_KEYS.includes(key),
      );
      if (unexpectedKeys.length > 0) {
        return throwError(
          () =>
            new Error(`Unexpected search params: ${unexpectedKeys.join(', ')}`),
        );
      }

      const keywords = params.keywords.toLowerCase();
      return of(
        [burntAubergine, roastedAubergine].filter((recipe) =>
          recipe.name.toLowerCase().includes(keywords),
        ),
      );
    });

  const fixture = TestBed.createComponent(RecipeQuickSearch);

  return { fixture, search };
}

function quickSearchInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>(
    'input[aria-label="Quick search"]',
  );
  if (input == null) {
    throw new Error('Quick search input not found.');
  }
  return input;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function suggestionLinks(root: HTMLElement): HTMLAnchorElement[] {
  return [
    ...root.querySelectorAll<HTMLAnchorElement>(
      '[data-testid="quick-search-suggestion"]',
    ),
  ];
}

function suggestionNames(root: HTMLElement): string[] {
  return suggestionLinks(root).map((link) => link.textContent?.trim() ?? '');
}
