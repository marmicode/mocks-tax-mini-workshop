import { inputBinding } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { UserFavorites } from '@whiskmate/recipe/domain';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { LocalStorage } from '@whiskmate/shared/infra';
import { RecipeDetail } from './recipe-detail.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { quantity: { amount: 3, unit: 'tbsp' }, name: 'olive oil' },
    { quantity: { amount: 6, unit: '' }, name: 'large eggs' },
    { name: 'fresh coriander, to serve' },
  ],
  steps: ['Heat the olive oil.', 'Crack the eggs into the sauce.'],
};

const harissaChicken: Recipe = {
  id: 'harissa-chicken',
  course: 'main',
  name: 'Harissa-Roasted Chicken',
  description: null,
  pictureUri: 'https://example.com/harissa-chicken.jpg',
  ingredients: [],
  steps: [],
};

describe(RecipeDetail, () => {
  it('fetches the recipe by id', async () => {
    const { findById } = mountRecipeDetail('shakshuka');

    await expect
      .poll(() => findById)
      .toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
  });

  it('shows the recipe name, course, description and picture', async () => {
    const { findById } = mountRecipeDetail('shakshuka');

    await expect
      .element(page.getByRole('heading', { name: 'Shakshuka' }))
      .toHaveTextContent('Shakshuka');
    await expect
      .element(page.getByTestId('recipe-course'))
      .toHaveTextContent('main');
    await expect
      .element(page.getByText('Eggs poached in a spiced tomato sauce.'))
      .toHaveTextContent('Eggs poached in a spiced tomato sauce.');
    await expect
      .element(page.getByRole('img', { name: 'Shakshuka' }))
      .toHaveAttribute('src', 'https://example.com/shakshuka.jpg');
    expect(findById).toHaveBeenCalledWith({ id: 'shakshuka' });
  });

  it('shows ingredients with their quantities and steps', async () => {
    const { findById, texts } = mountRecipeDetail('shakshuka');

    await expect
      .poll(() => texts('ingredient'))
      .toEqual([
        '3 tbsp olive oil',
        '6 large eggs',
        'fresh coriander, to serve',
      ]);
    await expect
      .poll(() => texts('step'))
      .toEqual(['Heat the olive oil.', 'Crack the eggs into the sauce.']);
    expect(findById).toHaveBeenCalledWith({ id: 'shakshuka' });
  });

  it('links to cooking mode and scaler', async () => {
    mountRecipeDetail('shakshuka');

    await expect
      .element(page.getByRole('link', { name: /Start cooking/ }))
      .toHaveAttribute('href', '/recipes/shakshuka/cook');
    await expect
      .element(page.getByRole('link', { name: /Scale servings/ }))
      .toHaveAttribute('href', '/recipes/shakshuka/scale');
  });

  it('shows similar recipes of the same course', async () => {
    const { findById, search, texts } = mountRecipeDetail('shakshuka');
    search.mockReturnValue(of([shakshuka, harissaChicken]));

    await expect
      .poll(() => texts('similar-recipe'))
      .toEqual(['Harissa-Roasted Chicken']);
    expect(findById).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('adds the recipe to favorites', async () => {
    const { userFavorites } = mountRecipeDetail('shakshuka');
    const addFavorite = vi
      .spyOn(userFavorites, 'addFavorite')
      .mockImplementation(() => undefined);

    await page.getByRole('button', { name: 'Add to favorites' }).click();

    expect(addFavorite).toHaveBeenCalledExactlyOnceWith('shakshuka');
  });

  it('shows a message when the recipe does not exist', async () => {
    const { findById, search } = mountRecipeDetail('missing');
    findById.mockReturnValue(of(undefined));

    await expect
      .element(page.getByText('This recipe does not exist.'))
      .toHaveTextContent('This recipe does not exist.');
    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(search).not.toHaveBeenCalled();
  });
});

function mountRecipeDetail(recipeId: string) {
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

  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(shakshuka));
  const search = vi.spyOn(recipeRepository, 'search').mockReturnValue(of([]));
  const userFavorites = TestBed.inject(UserFavorites);

  TestBed.createComponent(RecipeDetail, {
    bindings: [inputBinding('recipeId', () => recipeId)],
  });

  return {
    findById,
    search,
    userFavorites,
    texts: (testId: string) =>
      page
        .getByTestId(testId)
        .elements()
        .map((el) => el.textContent?.trim() ?? ''),
  };
}
