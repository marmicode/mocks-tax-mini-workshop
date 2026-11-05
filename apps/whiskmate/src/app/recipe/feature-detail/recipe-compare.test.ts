import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RecipeCompare } from './recipe-compare.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: 'Olive oil' },
    { name: 'garlic, crushed' },
    { name: 'large eggs' },
  ],
  steps: ['Heat the oil.', 'Add the eggs.'],
};

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [{ name: 'olive oil' }, { name: 'tahini' }],
  steps: ['Blitz everything.'],
};

describe(RecipeCompare, () => {
  it('lists all recipes in the pickers', async () => {
    const { search, findById } = mountRecipeCompare({});

    await expect
      .poll(() => optionLabels('Left recipe'))
      .toEqual(['Pick a recipe', 'Shakshuka', 'Hummus with Ful']);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(findById).not.toHaveBeenCalled();
  });

  it('fetches both compared recipes', async () => {
    const { search, findById } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });

    await expect
      .element(page.getByTestId('left-name'))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByTestId('right-name'))
      .toHaveTextContent('Hummus with Ful');
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
    expect(findById).toHaveBeenCalledTimes(2);
    expect(findById).toHaveBeenNthCalledWith(1, { id: 'shakshuka' });
    expect(findById).toHaveBeenNthCalledWith(2, { id: 'hummus-ful' });
  });

  it('compares course, ingredient count and step count', async () => {
    const { search } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });

    await expect
      .element(page.getByTestId('left-name'))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByTestId('right-name'))
      .toHaveTextContent('Hummus with Ful');
    expect(searchKey(search.mock.calls[0][0])).toBe(
      'keywords=&maxIngredientCount=&maxStepCount=&courses=',
    );
    await expect.poll(() => rowCells('course-row')).toEqual(['main', 'starter']);
    await expect.poll(() => rowCells('ingredient-count-row')).toEqual(['3', '2']);
    await expect.poll(() => rowCells('step-count-row')).toEqual(['2', '1']);
  });

  it('lists shared ingredients ignoring case', async () => {
    mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });

    await expect
      .poll(() =>
        page
          .getByRole('listitem')
          .elements()
          .map((el) => el.textContent?.trim() ?? ''),
      )
      .toEqual(['olive oil']);
  });

  it('navigates when a recipe is picked', async () => {
    const { search } = mountRecipeCompare({});
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    await expect.poll(() => search.mock.calls).toHaveLength(1);

    await page.getByRole('combobox', { name: 'Left recipe' }).selectOptions('hummus-ful');

    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'compare'], {
      queryParams: { left: 'hummus-ful' },
      queryParamsHandling: 'merge',
    });
  });

  it('preselects the compared recipes in the pickers', async () => {
    mountRecipeCompare({
      left: 'hummus-ful',
      right: 'shakshuka',
    });

    await expect
      .element(page.getByRole('combobox', { name: 'Left recipe' }))
      .toHaveValue('hummus-ful');
    await expect
      .element(page.getByRole('combobox', { name: 'Right recipe' }))
      .toHaveValue('shakshuka');
  });

  it('does not compare until both recipes are picked', async () => {
    const { search, findById } = mountRecipeCompare({
      left: 'shakshuka',
    });

    await expect
      .element(page.getByRole('combobox', { name: 'Left recipe' }))
      .toHaveValue('shakshuka');
    await expect
      .poll(() => findById)
      .toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: [],
      });
    await expect.element(page.getByRole('table')).not.toBeInTheDocument();
  });

  it('tells when recipes share no ingredients', async () => {
    const { search, findById } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });
    findById.mockImplementation(({ id }) =>
      of(
        id === 'shakshuka'
          ? shakshuka
          : { ...hummus, ingredients: [{ name: 'tahini' }] },
      ),
    );

    await expect
      .element(page.getByText('No shared ingredients.'))
      .toHaveTextContent('No shared ingredients.');
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('clears a side when "Pick a recipe" is chosen', async () => {
    const { search } = mountRecipeCompare({
      left: 'shakshuka',
      right: 'hummus-ful',
    });
    search.mockImplementationOnce((params) => {
      expect(params).toHaveProperty('courses', []);
      expect(isWholeCatalogSearch(params)).toBe(true);
      return of([shakshuka, hummus]);
    });
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    await expect
      .element(page.getByTestId('left-name'))
      .toHaveTextContent('Shakshuka');
    await page.getByRole('combobox', { name: 'Right recipe' }).selectOptions('Pick a recipe');

    expect(search).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'compare'], {
      queryParams: { right: null },
      queryParamsHandling: 'merge',
    });
  });
});

function mountRecipeCompare({
  left,
  right,
}: {
  left?: string;
  right?: string;
}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const recipeRepository = TestBed.inject(RecipeRepository);
  const search = vi
    .spyOn(recipeRepository, 'search')
    .mockImplementation((params) =>
      isWholeCatalogSearch(params)
        ? of([shakshuka, hummus])
        : throwError(
            () => new Error(`unexpected search ${JSON.stringify(params)}`),
          ),
    );
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockImplementation(({ id }) =>
      of([shakshuka, hummus].find((recipe) => recipe.id === id)),
    );

  TestBed.createComponent(RecipeCompare, {
    bindings: [
      inputBinding('left', () => left),
      inputBinding('right', () => right),
    ],
  });

  return { search, findById };
}

function optionLabels(label: 'Left recipe' | 'Right recipe'): string[] {
  const select = page.getByRole('combobox', { name: label }).element() as HTMLSelectElement;
  return [...select.options].map((option) => option.text.trim());
}

function rowCells(testId: string): string[] {
  return [...page.getByTestId(testId).element().querySelectorAll('td')].map(
    (cell) => cell.textContent?.trim() ?? '',
  );
}

/**
 * The pickers need the whole catalog: no keywords, no limits, no extra filters.
 */
function isWholeCatalogSearch(params: RecipeSearchParams): boolean {
  return (
    params.keywords === '' &&
    params.maxIngredientCount === null &&
    params.maxStepCount === null &&
    params.courses.length === 0
  );
}

function searchKey(params: RecipeSearchParams): string {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value ?? '')]),
  ).toString();
}
