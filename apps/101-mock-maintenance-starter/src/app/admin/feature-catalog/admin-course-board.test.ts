import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminCourseBoard } from './admin-course-board.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

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

describe(AdminCourseBoard, () => {
  it('searches recipes for each course', async () => {
    const { search } = mountAdminCourseBoard();

    await expect.poll(() => search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(search).toHaveBeenNthCalledWith(3, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('shows each recipe in its course column', async () => {
    mountAdminCourseBoard();

    await expect
      .poll(() => columnRecipeNames('starter'))
      .toEqual(['Hummus with Ful']);
    await expect
      .poll(() => columnRecipeNames('main'))
      .toEqual(['Shakshuka']);
    await expect
      .poll(() => columnRecipeNames('dessert'))
      .toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('only offers to move a recipe to other courses', async () => {
    mountAdminCourseBoard();

    await expect.poll(() => moveOptions('Shakshuka')).toEqual([
      'Move to…',
      'starter',
      'dessert',
    ]);
  });

  it('moves a recipe to another course', async () => {
    const { update } = mountAdminCourseBoard();

    await page
      .getByRole('combobox', { name: 'Move Shakshuka to' })
      .selectOptions('starter');

    await expect.poll(() => update).toHaveBeenCalledExactlyOnceWith({
      id: 'shakshuka',
      course: 'starter',
      name: 'Shakshuka',
      description: null,
      pictureUri: 'https://example.com/shakshuka.jpg',
      ingredients: [],
      steps: [],
    });
  });

  it('refreshes the source and target columns after a move', async () => {
    const { search } = mountAdminCourseBoard();

    await expect.poll(() => search).toHaveBeenCalledTimes(3);
    search.mockClear();

    await page
      .getByRole('combobox', { name: 'Move Shakshuka to' })
      .selectOptions('dessert');

    await expect.poll(() => search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });
});

function mountAdminCourseBoard() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const search = vi
    .spyOn(recipeRepository, 'search')
    .mockImplementation(({ courses }) =>
      of(
        [hummus, shakshuka, cheesecake].filter((recipe) =>
          courses?.includes(recipe.course),
        ),
      ),
    );
  const update = vi
    .spyOn(recipeRepository, 'update')
    .mockImplementation((recipe) => of(recipe));

  TestBed.createComponent(AdminCourseBoard);

  return { search, update };
}

function columnRecipeNames(course: string) {
  return page
    .getByTestId(`column-${course}`)
    .getByTestId('board-recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function moveOptions(recipeName: string) {
  return page
    .getByRole('combobox', { name: `Move ${recipeName} to` })
    .getByRole('option')
    .elements()
    .map((option) => option.textContent?.trim());
}
