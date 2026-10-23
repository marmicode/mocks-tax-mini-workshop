import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { KeywordSuggester } from './keyword-suggester';

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

const lemonChicken: Recipe = {
  id: 'lemon-chicken',
  course: 'main',
  name: 'Lemony Chicken with Lemongrass',
  description: null,
  pictureUri: 'https://example.com/lemon-chicken.jpg',
  ingredients: [],
  steps: [],
};

const lentilSoup: Recipe = {
  id: 'lentil-soup',
  course: 'starter',
  name: 'Red Lentil Soup',
  description: null,
  pictureUri: 'https://example.com/lentil-soup.jpg',
  ingredients: [],
  steps: [],
};

describe(KeywordSuggester.name, () => {
  it('searches recipes matching the prefix', async () => {
    const { keywordSuggester, search } = setUpKeywordSuggester();

    await firstValueFrom(keywordSuggester.suggest('lem'));

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: 'lem',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('suggests the words of recipe names that start with the prefix', async () => {
    const { keywordSuggester, search } = setUpKeywordSuggester();
    search.mockImplementation(
      respondBySearchKey({
        'lem|||*': [lemonChicken, cheesecake],
      }),
    );

    const keywords = await firstValueFrom(keywordSuggester.suggest('lem'));

    expect(keywords).toEqual(['lemon', 'lemongrass', 'lemony']);
  });

  it('ignores the case and surrounding spaces of the prefix', async () => {
    const { keywordSuggester, search } = setUpKeywordSuggester();
    search.mockImplementation(respondBySearchKey({ 'le|||*': [lentilSoup] }));

    const keywords = await firstValueFrom(keywordSuggester.suggest('  LE '));

    expect(keywords).toEqual(['lentil']);
  });

  it('suggests nothing when no recipe matches', async () => {
    const { keywordSuggester, search } = setUpKeywordSuggester();
    search.mockReturnValue(of([]));

    const keywords = await firstValueFrom(keywordSuggester.suggest('zz'));

    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "zz",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
    expect(keywords).toEqual([]);
  });

  it('does not search when the prefix is too short', async () => {
    const { keywordSuggester, search } = setUpKeywordSuggester();

    const keywords = await firstValueFrom(keywordSuggester.suggest('l'));

    expect(search).not.toHaveBeenCalled();
    expect(keywords).toEqual([]);
  });
});

function setUpKeywordSuggester() {
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([cheesecake]));
  const keywordSuggester = TestBed.inject(KeywordSuggester);
  return { keywordSuggester, search };
}

function respondBySearchKey(responses: Record<string, Recipe[]>) {
  return (params: RecipeSearchParams) => {
    const key = searchKey(params);
    return key in responses
      ? of(responses[key])
      : throwError(() => new Error(`unexpected search ${key}`));
  };
}

/**
 * `*` stands for "any course".
 */
function searchKey({
  keywords,
  maxIngredientCount,
  maxStepCount,
  courses,
}: RecipeSearchParams): string {
  return [keywords, maxIngredientCount, maxStepCount, courses ?? '*'].join('|');
}
