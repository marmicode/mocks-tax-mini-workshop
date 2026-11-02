import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page, userEvent } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { Pantry } from './pantry.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: '2 red peppers, sliced' },
    { name: 'garlic, crushed', quantity: { amount: 4, unit: 'cloves' } },
    { name: 'large eggs', quantity: { amount: 6, unit: '' } },
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

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [{ name: 'ricotta', quantity: { amount: 250, unit: 'g' } }],
  steps: [],
};

describe(Pantry, () => {
  it('searches all recipes', async () => {
    const { search } = mountPantry();

    await expect.element(page.getByTestId('pantry-hint')).toBeVisible();
    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
      });
  });

  it('shows recipes using an ingredient I have', async () => {
    mountPantry();

    await addIngredient('Ricotta');

    await expect
      .poll(matchedRecipeNames)
      .toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('ranks recipes by number of matching ingredients', async () => {
    mountPantry();

    await addIngredient('garlic');
    await addIngredient('eggs');

    await expect
      .poll(matchedRecipeNames)
      .toEqual(['Shakshuka', 'Hummus with Ful']);
    await expect
      .poll(() => textsOf('match-count'))
      .toEqual(['2/3 ingredients', '1/2 ingredients']);
  });

  it('shows missing ingredients', async () => {
    mountPantry();

    await addIngredient('garlic');

    await expect
      .poll(() => textsOf('missing-ingredients'))
      .toEqual(['Missing: tahini', 'Missing: red peppers, large eggs']);
  });

  it('removes an ingredient', async () => {
    mountPantry();

    await addIngredient('garlic');
    await addIngredient('ricotta');
    await page.getByRole('button', { name: 'Remove garlic' }).click();

    await expect
      .poll(matchedRecipeNames)
      .toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('tells when no recipe uses my ingredients', async () => {
    const { search } = mountPantry();

    await addIngredient('saffron');

    await expect
      .element(page.getByTestId('no-match-message'))
      .toMatchTextContent('No recipe uses these ingredients.');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('ignores blank and duplicate ingredients', async () => {
    const { search } = mountPantry();

    await expect.poll(() => search.mock.calls).toHaveLength(1);
    await addIngredient('garlic');
    await addIngredient('  GARLIC ');
    await addIngredient('   ');

    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
    await expect.poll(itemLabels).toEqual(['Remove garlic']);
  });

  it('does not show missing ingredients when I have them all', async () => {
    mountPantry();

    await addIngredient('ricotta');

    await expect
      .poll(() => textsOf('match-count'))
      .toEqual(['1/1 ingredients']);
    expect(textsOf('missing-ingredients')).toEqual([]);
  });

  it('shows the hint again once the last ingredient is removed', async () => {
    const { search } = mountPantry();

    await addIngredient('tahini');
    await expect.poll(matchedRecipeNames).toEqual(['Hummus with Ful']);

    await page.getByRole('button', { name: 'Remove tahini' }).click();

    await expect.element(page.getByTestId('pantry-hint')).toBeVisible();
    await expect.poll(matchedRecipeNames).toEqual([]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('tells when the repository returns no recipes', async () => {
    const { search } = mountPantry();
    search.mockReturnValue(of([]));

    await addIngredient('garlic');

    await expect
      .element(page.getByTestId('no-match-message'))
      .toMatchTextContent('No recipe uses these ingredients.');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });
});

function mountPantry() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) =>
      of(isWholeCatalogSearch(params) ? [shakshuka, hummus, cheesecake] : []),
    );

  TestBed.createComponent(Pantry);

  return { search };
}

async function addIngredient(ingredient: string) {
  const input = page.getByLabelText('Add an ingredient I have');
  await input.fill(ingredient);
  await userEvent.type(input, '{Enter}');
}

function itemLabels() {
  return page
    .getByRole('button', { name: /^Remove / })
    .elements()
    .map((el) => el.getAttribute('aria-label') ?? '');
}

function matchedRecipeNames() {
  return page
    .getByTestId('pantry-match')
    .getByRole('link')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function textsOf(testId: string) {
  return page
    .getByTestId(testId)
    .elements()
    .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

/**
 * The pantry matches ingredients locally so it needs the whole catalog.
 */
function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return Object.values(params).every((value) => value === '' || value === null);
}
