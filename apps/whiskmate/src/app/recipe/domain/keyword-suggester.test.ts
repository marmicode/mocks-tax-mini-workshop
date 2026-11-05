import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { KeywordSuggester } from './keyword-suggester';

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .build();

const lemonChicken = recipeMother
  .withBasicInfo('Lemony Chicken with Lemongrass')
  .build();

const lentilSoup = recipeMother.withBasicInfo('Red Lentil Soup').build();

describe(KeywordSuggester.name, () => {
  it('searches recipes matching the prefix', async () => {
    const { keywordSuggester } = setUpKeywordSuggester({
      /* A dessert with many ingredients and steps: only the prefix filters. */
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withManyIngredients()
          .withManySteps()
          .build(),
      ],
    });

    const keywords = await firstValueFrom(keywordSuggester.suggest('lem'));

    expect(keywords).toEqual(['lemon']);
  });

  it('suggests the words of recipe names that start with the prefix', async () => {
    const { keywordSuggester } = setUpKeywordSuggester();

    const keywords = await firstValueFrom(keywordSuggester.suggest('lem'));

    expect(keywords).toEqual(['lemon', 'lemongrass', 'lemony']);
  });

  it('ignores the case and surrounding spaces of the prefix', async () => {
    const { keywordSuggester } = setUpKeywordSuggester();

    const keywords = await firstValueFrom(keywordSuggester.suggest('  LE '));

    expect(keywords).toEqual(['lemon', 'lemongrass', 'lemony', 'lentil']);
  });

  it('suggests nothing when no recipe matches', async () => {
    const { keywordSuggester } = setUpKeywordSuggester();

    const keywords = await firstValueFrom(keywordSuggester.suggest('zz'));

    expect(keywords).toEqual([]);
  });

  it('suggests nothing when the prefix is too short', async () => {
    const { keywordSuggester } = setUpKeywordSuggester();

    const keywords = await firstValueFrom(keywordSuggester.suggest('l'));

    expect(keywords).toEqual([]);
  });
});

function setUpKeywordSuggester({
  recipes = [cheesecake, lemonChicken, lentilSoup],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const keywordSuggester = TestBed.inject(KeywordSuggester);
  return { keywordSuggester };
}
