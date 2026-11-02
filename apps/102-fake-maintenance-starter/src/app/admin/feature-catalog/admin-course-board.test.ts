import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminCourseBoard } from './admin-course-board.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(AdminCourseBoard, () => {
  it('searches recipes for each course', async () => {
    mountAdminCourseBoard({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
          .withManyIngredients()
          .build(),
        recipeMother.withBasicInfo('Shakshuka').withManySteps().build(),
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

    await expect
      .poll(() => columnRecipeNames('starter'))
      .toEqual(['Hummus with Ful']);
    await expect.poll(() => columnRecipeNames('main')).toEqual(['Shakshuka']);
    await expect
      .poll(() => columnRecipeNames('dessert'))
      .toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('shows each recipe in its course column', async () => {
    mountAdminCourseBoard();

    await expect
      .poll(() => columnRecipeNames('starter'))
      .toEqual(['Hummus with Ful']);
    await expect.poll(() => columnRecipeNames('main')).toEqual(['Shakshuka']);
    await expect
      .poll(() => columnRecipeNames('dessert'))
      .toEqual(['Lemon and Ricotta Cheesecake']);
  });

  it('only offers to move a recipe to other courses', async () => {
    mountAdminCourseBoard();

    await expect
      .element(page.getByLabelText('Move Shakshuka to'))
      .toBeVisible();
    expect(moveOptions('Shakshuka')).toEqual([
      'Move to…',
      'starter',
      'dessert',
    ]);
  });

  it('moves a recipe to another course', async () => {
    const { recipeRepositoryFake } = mountAdminCourseBoard();

    await page.getByLabelText('Move Shakshuka to').selectOptions('starter');

    await expect
      .poll(() => recipeRepositoryFake.getRecipesSync())
      .toEqual([
        hummus,
        recipeMother
          .withBasicInfo({ name: 'Shakshuka', course: 'starter' })
          .build(),
        cheesecake,
      ]);
  });

  it('refreshes the source and target columns after a move', async () => {
    mountAdminCourseBoard();

    await page.getByLabelText('Move Shakshuka to').selectOptions('dessert');

    await expect.poll(() => columnRecipeNames('main')).toEqual([]);
    await expect
      .poll(() => columnRecipeNames('dessert'))
      .toEqual(['Shakshuka', 'Lemon and Ricotta Cheesecake']);
  });
});

function mountAdminCourseBoard({
  recipes = [hummus, shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);

  TestBed.createComponent(AdminCourseBoard);

  return { recipeRepositoryFake };
}

function columnRecipeNames(course: string) {
  return page
    .getByTestId(`column-${course}`)
    .getByTestId('board-recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function moveOptions(recipeName: string) {
  const select = page
    .getByLabelText(`Move ${recipeName} to`)
    .element() as HTMLSelectElement;
  return [...select.options].map((option) => option.textContent?.trim());
}
