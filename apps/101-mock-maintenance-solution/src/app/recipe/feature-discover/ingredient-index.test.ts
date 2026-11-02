import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
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

describe(IngredientIndex, () => {
  it('searches all recipes', async () => {
    const { search } = mountIngredientIndex();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('lists normalized ingredient names alphabetically', async () => {
    mountIngredientIndex();

    await expect
      .poll(ingredientNames)
      .toEqual(['garlic', 'red peppers', 'tahini', 'tinned chopped tomatoes']);
  });

  it('groups ingredients by first letter', async () => {
    mountIngredientIndex();

    await expect.poll(sectionLetters).toEqual(['g', 'r', 't']);
  });

  it('lists every recipe using an ingredient', async () => {
    mountIngredientIndex();

    await expect
      .poll(() => recipeNamesFor('garlic'))
      .toEqual(['Shakshuka', 'Hummus with Ful']);
  });

  it('filters ingredients', async () => {
    const { search } = mountIngredientIndex();

    await expect
      .poll(ingredientNames)
      .toEqual(['garlic', 'red peppers', 'tahini', 'tinned chopped tomatoes']);

    await page.getByLabelText('Filter ingredients').fill('ta');

    await expect.poll(ingredientNames).toEqual(['tahini']);
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/ingredient-index-filter.calls.json',
    );
  });

  it('shows a message when no ingredient matches', async () => {
    const { search } = mountIngredientIndex();

    await expect
      .poll(ingredientNames)
      .toEqual(['garlic', 'red peppers', 'tahini', 'tinned chopped tomatoes']);

    await page.getByLabelText('Filter ingredients').fill('saffron');

    await expect
      .element(page.getByTestId('no-ingredients-message'))
      .toMatchTextContent('No ingredients found.');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('filters ingredients ignoring case and surrounding spaces', async () => {
    mountIngredientIndex();

    await expect
      .poll(ingredientNames)
      .toEqual(['garlic', 'red peppers', 'tahini', 'tinned chopped tomatoes']);

    await page.getByLabelText('Filter ingredients').fill('  GAR ');

    await expect.poll(ingredientNames).toEqual(['garlic']);
  });

  it('lists a recipe only once when it uses an ingredient twice', async () => {
    const { search } = mountIngredientIndex();
    search.mockReturnValue(
      of([
        {
          ...hummus,
          ingredients: [
            { name: 'garlic, crushed' },
            { name: '2 garlic, roasted' },
          ],
        },
      ]),
    );

    await expect.poll(ingredientNames).toEqual(['garlic']);
    await expect
      .poll(() => recipeNamesFor('garlic'))
      .toEqual(['Hummus with Ful']);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('links each recipe to its detail page', async () => {
    mountIngredientIndex();

    await expect
      .element(recipeLinks('tahini'))
      .toHaveAttribute('href', '/recipes/hummus-ful');
    await expect
      .element(recipeLinks('tahini'))
      .toHaveTextContent('Hummus with Ful');
  });

  it('shows a message when the repository returns no recipes', async () => {
    const { search } = mountIngredientIndex();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-ingredients-message'))
      .toMatchTextContent('No ingredients found.');
    await expect.poll(sectionLetters).toEqual([]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });
});

function mountIngredientIndex() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) => {
      expect(params).toEqual(
        expect.objectContaining({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: null,
          courses: [],
        }),
      );
      const catalog = [shakshuka, hummus];
      return of(
        params.courses?.length
          ? catalog.filter((recipe) => params.courses?.includes(recipe.course))
          : catalog,
      );
    });

  TestBed.createComponent(IngredientIndex);

  return { search };
}

function ingredientNames() {
  return page
    .getByRole('term')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function sectionLetters() {
  return page
    .getByTestId('index-section')
    .getByRole('heading')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function entry(ingredient: string) {
  return page
    .getByTestId('index-entry')
    .filter({ hasText: ingredient });
}

function recipeNamesFor(ingredient: string) {
  return entry(ingredient)
    .getByRole('link')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function recipeLinks(ingredient: string) {
  return entry(ingredient).getByRole('link');
}
