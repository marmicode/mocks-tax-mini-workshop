import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe(AdminCourseBoard.name, () => {
  it('searches recipes for each course', async () => {
    const { fixture, search } = mountAdminCourseBoard();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(3);
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
    const { fixture } = mountAdminCourseBoard();
    await fixture.whenStable();

    expect(columnRecipeNames(fixture.nativeElement, 'starter')).toEqual([
      'Hummus with Ful',
    ]);
    expect(columnRecipeNames(fixture.nativeElement, 'main')).toEqual([
      'Shakshuka',
    ]);
    expect(columnRecipeNames(fixture.nativeElement, 'dessert')).toEqual([
      'Lemon and Ricotta Cheesecake',
    ]);
  });

  it('only offers to move a recipe to other courses', async () => {
    const { fixture } = mountAdminCourseBoard();
    await fixture.whenStable();

    const options = [
      ...moveSelect(fixture.nativeElement, 'Shakshuka').querySelectorAll(
        'option',
      ),
    ].map((option) => option.textContent?.trim());
    expect(options).toEqual(['Move to…', 'starter', 'dessert']);
  });

  it('moves a recipe to another course', async () => {
    const { fixture, update } = mountAdminCourseBoard();
    await fixture.whenStable();

    selectOption(moveSelect(fixture.nativeElement, 'Shakshuka'), 'starter');
    await fixture.whenStable();

    expect(update).toHaveBeenCalledExactlyOnceWith({
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
    const { fixture, search } = mountAdminCourseBoard();
    await fixture.whenStable();
    search.mockClear();

    selectOption(moveSelect(fixture.nativeElement, 'Shakshuka'), 'dessert');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(2);
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

  const fixture = TestBed.createComponent(AdminCourseBoard);

  return { fixture, search, update };
}

function columnRecipeNames(root: HTMLElement, course: string): string[] {
  return [
    ...root.querySelectorAll(
      `[data-testid="column-${course}"] [data-testid="board-recipe-name"]`,
    ),
  ].map((el) => el.textContent?.trim() ?? '');
}

function moveSelect(root: HTMLElement, recipeName: string): HTMLSelectElement {
  const select = root.querySelector<HTMLSelectElement>(
    `select[aria-label="Move ${recipeName} to"]`,
  );
  if (select == null) {
    throw new Error(`Move select for "${recipeName}" not found.`);
  }
  return select;
}

function selectOption(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change'));
}
