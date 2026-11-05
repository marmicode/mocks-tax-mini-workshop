import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { RandomAdapter } from '@whiskmate/shared/infra';
import { SurpriseMe } from './surprise-me.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
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

describe(SurpriseMe, () => {
  it('picks a random recipe among all recipes', async () => {
    const { search, pick } = mountSurpriseMe();
    pick.mockReturnValue(cheesecake);

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
    expect(pick).toHaveBeenCalledExactlyOnceWith([shakshuka, cheesecake]);
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('searches only the chosen course', async () => {
    const { search } = mountSurpriseMe();

    await expect.poll(() => search.mock.calls.length).toBe(1);

    await page.getByRole('radio', { name: 'Desserts' }).click();

    await expect
      .poll(() => search.mock.calls.map(([params]) => searchKey(params)))
      .toEqual([
        'keywords=&maxIngredientCount=&maxStepCount=&courses=',
        'keywords=&maxIngredientCount=&maxStepCount=&courses=dessert',
      ]);
  });

  it('stops filtering by course when "Any" is chosen', async () => {
    const { search, pick } = mountSurpriseMe();

    await expect.poll(() => search.mock.calls.length).toBe(1);

    await page.getByRole('radio', { name: 'Mains' }).click();
    await expect.poll(() => search.mock.calls.length).toBe(2);

    await page.getByRole('radio', { name: 'Any' }).click();

    await expect
      .poll(() => pick)
      .toHaveBeenLastCalledWith([shakshuka, cheesecake]);
    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(search.mock.lastCall).toMatchInlineSnapshot(`
      [
        {
          "courses": [],
          "keywords": "",
          "maxIngredientCount": null,
          "maxStepCount": null,
        },
      ]
    `);
    expect(search.mock.lastCall?.[0]).toHaveProperty('courses', []);
  });

  it('picks another recipe when asked again', async () => {
    const { search, pick } = mountSurpriseMe();
    pick.mockReturnValueOnce(shakshuka).mockReturnValueOnce(cheesecake);

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    await page.getByRole('button', { name: 'Surprise me again' }).click();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows a message when there is nothing to pick', async () => {
    const { search, pick } = mountSurpriseMe();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('Nothing to surprise you with');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(pick).not.toHaveBeenCalled();
  });

  it('picks among the recipes of the chosen course', async () => {
    const { search, pick } = mountSurpriseMe();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    await page.getByRole('radio', { name: 'Desserts' }).click();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Lemon and Ricotta Cheesecake');
    expect(pick).toHaveBeenLastCalledWith([cheesecake]);
    expect(searchKey(search.mock.lastCall![0])).toBe(
      'keywords=&maxIngredientCount=&maxStepCount=&courses=dessert',
    );
  });

  it('links the surprise to its recipe page', async () => {
    const { search } = mountSurpriseMe();

    await expect
      .element(page.getByText('🎲 main'))
      .toHaveTextContent('🎲 main');
    await expect
      .element(page.getByRole('link', { name: 'See the recipe' }))
      .toHaveAttribute('href', '/recipes/shakshuka');
    expect(search).toHaveBeenCalledOnce();
  });

  it('keeps the chosen course when asked again', async () => {
    const { search } = mountSurpriseMe();

    await expect.poll(() => search.mock.calls.length).toBe(1);

    await page.getByRole('radio', { name: 'Mains' }).click();
    await expect.poll(() => search.mock.calls.length).toBe(2);

    await page.getByRole('button', { name: 'Surprise me again' }).click();

    await expect.poll(() => search.mock.calls.length).toBe(3);
    expect(search).toHaveBeenCalledTimes(3);
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/surprise-me-keeps-course.calls.json',
    );
  });

  it('shows a message when the chosen course has no recipes', async () => {
    const { search, pick } = mountSurpriseMe();

    await expect
      .element(page.getByTestId('recipe-name'))
      .toHaveTextContent('Shakshuka');

    await page.getByRole('radio', { name: 'Starters' }).click();

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('Nothing to surprise you with');
    expect(pick).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
  });
});

function mountSurpriseMe() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const catalog = [shakshuka, cheesecake];
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) =>
      of(
        params.courses.length === 0
          ? catalog
          : catalog.filter((recipe) => params.courses.includes(recipe.course)),
      ),
    );
  const pick = vi
    .spyOn(TestBed.inject(RandomAdapter), 'pick')
    .mockImplementation((items) => items[0]);

  TestBed.createComponent(SurpriseMe);

  return { search, pick };
}

/* Same format as the backend access logs, so failures are easy to compare. */
function searchKey(params: RecipeSearchParams): string {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(',') : String(value ?? ''),
    ]),
  ).toString();
}
