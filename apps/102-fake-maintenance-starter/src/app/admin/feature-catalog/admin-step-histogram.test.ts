import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminStepHistogram } from './admin-step-histogram.ng';

describe(AdminStepHistogram.name, () => {
  it('searches all recipes', async () => {
    const { fixture } = mountAdminStepHistogram({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withSomeSteps()
          .build(),
        recipeMother.withBasicInfo('Shakshuka').withManySteps().build(),
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withManyIngredients()
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(histogram(fixture.nativeElement)).toEqual([
      { stepCount: '0', recipeCount: '1' },
      { stepCount: '3', recipeCount: '1' },
      { stepCount: '8', recipeCount: '1' },
    ]);
  });

  it('shows an empty state when there are no recipes', async () => {
    const { fixture } = mountAdminStepHistogram();
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe('No recipes yet.');
  });

  it('counts a single recipe', async () => {
    const { fixture } = mountAdminStepHistogram({
      recipes: [
        recipeMother.withBasicInfo('Shakshuka').withSomeSteps().build(),
      ],
    });
    await fixture.whenStable();

    expect(histogram(fixture.nativeElement)).toEqual([
      { stepCount: '3', recipeCount: '1' },
    ]);
  });

  it('groups recipes with the same step count', async () => {
    const { fixture } = mountAdminStepHistogram({
      recipes: [
        recipeMother.withBasicInfo('Hummus with Ful').withSomeSteps().build(),
        recipeMother
          .withBasicInfo('Courgette Fritters')
          .withSomeSteps()
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(histogram(fixture.nativeElement)).toEqual([
      { stepCount: '3', recipeCount: '2' },
    ]);
  });

  it('sorts buckets by step count, including recipes without steps', async () => {
    const { fixture } = mountAdminStepHistogram({
      recipes: [
        recipeMother
          .withBasicInfo('Tahini and Halva Brownies')
          .withManySteps()
          .build(),
        recipeMother.withBasicInfo('Hummus with Ful').build(),
        recipeMother.withBasicInfo('Shakshuka').withSomeSteps().build(),
      ],
    });
    await fixture.whenStable();

    expect(histogram(fixture.nativeElement)).toEqual([
      { stepCount: '0', recipeCount: '1' },
      { stepCount: '3', recipeCount: '1' },
      { stepCount: '8', recipeCount: '1' },
    ]);
  });
});

function mountAdminStepHistogram({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminStepHistogram);

  return { fixture };
}

function histogram(root: HTMLElement) {
  return [...root.querySelectorAll('[data-testid="histogram-row"]')].map(
    (row) => {
      const [stepCount, recipeCount] = [...row.querySelectorAll('td')].map(
        (cell) => cell.textContent?.trim(),
      );
      return { stepCount, recipeCount };
    },
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
