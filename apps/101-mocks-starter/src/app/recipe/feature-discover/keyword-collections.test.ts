import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { KeywordCollections } from './keyword-collections.ng';

const soup: Recipe = {
  id: 'lentil-soup',
  course: 'starter',
  name: 'Red Lentil Soup',
  description: null,
  pictureUri: 'https://example.com/soup.jpg',
  ingredients: [],
  steps: [],
};

const cake: Recipe = {
  id: 'orange-polenta-cake',
  course: 'dessert',
  name: 'Orange Polenta Cake',
  description: null,
  pictureUri: 'https://example.com/cake.jpg',
  ingredients: [],
  steps: [],
};

describe(KeywordCollections.name, () => {
  it('searches soups by default', async () => {
    const { fixture, search } = mountKeywordCollections();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'soup',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows the recipes of the collection', async () => {
    const { fixture, search } = mountKeywordCollections();
    search.mockReturnValue(of([soup]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'soup',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipeNames(fixture.nativeElement)).toEqual(['Red Lentil Soup']);
  });

  it('searches salads when the salads collection is chosen', async () => {
    const { fixture, search } = mountKeywordCollections();
    await fixture.whenStable();

    clickToggle(fixture.nativeElement, 'Salads');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith({
      keywords: 'salad',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows cakes when the cakes collection is chosen', async () => {
    const { fixture, search } = mountKeywordCollections();
    await fixture.whenStable();

    search.mockReturnValue(of([cake]));
    clickToggle(fixture.nativeElement, 'Cakes');
    await fixture.whenStable();

    expect(search).toHaveBeenLastCalledWith({
      keywords: 'cake',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipeNames(fixture.nativeElement)).toEqual(['Orange Polenta Cake']);
  });

  it('shows a message when the collection is empty', async () => {
    const { fixture, search } = mountKeywordCollections();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'soup',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('Nothing in this collection yet');
  });
});

function mountKeywordCollections() {
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
    .mockReturnValue(of([soup, cake]));

  const fixture = TestBed.createComponent(KeywordCollections);

  return { fixture, search };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function clickToggle(root: HTMLElement, label: string): void {
  const toggle = [...root.querySelectorAll('mat-button-toggle')].find(
    (el) => el.textContent?.trim() === label,
  );
  const button = toggle?.querySelector('button');
  if (button == null) {
    throw new Error(`Toggle "${label}" not found.`);
  }
  button.click();
}
