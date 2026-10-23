import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

describe(AdminCourseBoard.name, () => {
  it('searches recipes for each course', async () => {
    const { fixture } = mountAdminCourseBoard({
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
    const { fixture, recipeRepositoryFake } = mountAdminCourseBoard();
    await fixture.whenStable();

    selectOption(moveSelect(fixture.nativeElement, 'Shakshuka'), 'starter');
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([
      hummus,
      recipeMother
        .withBasicInfo({ name: 'Shakshuka', course: 'starter' })
        .build(),
      cheesecake,
    ]);
  });

  it('refreshes the source and target columns after a move', async () => {
    const { fixture } = mountAdminCourseBoard();
    await fixture.whenStable();

    selectOption(moveSelect(fixture.nativeElement, 'Shakshuka'), 'dessert');
    await fixture.whenStable();

    expect(columnRecipeNames(fixture.nativeElement, 'main')).toEqual([]);
    expect(columnRecipeNames(fixture.nativeElement, 'dessert')).toEqual([
      'Shakshuka',
      'Lemon and Ricotta Cheesecake',
    ]);
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

  const fixture = TestBed.createComponent(AdminCourseBoard);

  return { fixture, recipeRepositoryFake };
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
