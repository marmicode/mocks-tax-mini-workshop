import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { WeekendProjects } from './weekend-projects.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: ['Blend.', 'Serve.'],
};

const lamb: Recipe = {
  id: 'slow-roasted-lamb',
  course: 'main',
  name: 'Slow-roasted Lamb',
  description: null,
  pictureUri: 'https://example.com/lamb.jpg',
  ingredients: [],
  steps: ['Marinate.', 'Sear.', 'Roast.', 'Rest.', 'Carve.'],
};

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
    ).toBe('5 steps');
  });

  it('keeps only the top five projects', async () => {
    const { fixture } = mountWeekendProjects({
      recipes: [1, 2, 3, 4, 5, 6].map((stepCount) => ({
        id: `recipe-${stepCount}`,
        course: 'main' as const,
        name: `Recipe ${stepCount}`,
        description: null,
        pictureUri: `https://example.com/recipe-${stepCount}.jpg`,
        ingredients: [],
        steps: Array.from({ length: stepCount }, () => 'Cook.'),
      })),
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
