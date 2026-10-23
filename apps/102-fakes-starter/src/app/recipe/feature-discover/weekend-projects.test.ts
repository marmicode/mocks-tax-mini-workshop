import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { WeekendProjects } from './weekend-projects.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const lamb = recipeMother
  .withBasicInfo('Slow-roasted Lamb')
  .withManySteps()
  .build();

describe(WeekendProjects.name, () => {
  it('shows the most involved recipes first', async () => {
    const { fixture } = mountWeekendProjects({ recipes: [hummus, lamb] });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Slow-roasted Lamb',
      'Hummus with Ful',
    ]);
  });

  it('shows the step count of each project', async () => {
    const { fixture } = mountWeekendProjects({ recipes: [lamb] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="step-count"]')
        ?.textContent?.trim(),
    ).toBe('8 steps');
  });

  it('keeps only the top five projects', async () => {
    const { fixture } = mountWeekendProjects({
      recipes: [1, 2, 3, 4, 5, 6].map((stepCount) =>
        recipeMother
          .withBasicInfo(`Recipe ${stepCount}`)
          .withSteps(Array.from({ length: stepCount }, () => 'Stir.'))
          .build(),
      ),
    });
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Recipe 6',
      'Recipe 5',
      'Recipe 4',
      'Recipe 3',
      'Recipe 2',
    ]);
  });

  it('shows a message when there are no projects', async () => {
    const { fixture } = mountWeekendProjects({ recipes: [] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No weekend projects found');
  });
});

function mountWeekendProjects({
  recipes = [hummus, lamb],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(WeekendProjects);

  return { fixture };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
