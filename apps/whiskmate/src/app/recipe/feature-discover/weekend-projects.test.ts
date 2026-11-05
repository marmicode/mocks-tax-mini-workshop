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

describe(WeekendProjects, () => {
  it('searches all recipes', async () => {
    const { search } = mountWeekendProjects();

    await expect.poll(() => search.mock.calls).toHaveLength(1);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('shows the most involved recipes first', async () => {
    const { search } = mountWeekendProjects();
    search.mockImplementation((params) =>
      of(filterByCourses([hummus, lamb], params)),
    );

    await expect
      .poll(recipeNames)
      .toEqual(['Slow-roasted Lamb', 'Hummus with Ful']);
  });

  it('shows the step count of each project', async () => {
    const { search } = mountWeekendProjects();
    search
      .mockReturnValue(of([]))
      .mockImplementationOnce((params) =>
        of(
          params.courses?.length
            ? [lamb].filter((recipe) => params.courses?.includes(recipe.course))
            : [lamb],
        ),
      );

    await expect
      .element(page.getByTestId('step-count'))
      .toHaveTextContent('5 steps');
    expect(search).toHaveBeenCalledOnce();
  });

  it('keeps only the top five projects', async () => {
    const { search } = mountWeekendProjects();
    search.mockImplementation((params) =>
      of(
        filterByCourses(
          [1, 2, 3, 4, 5, 6].map((stepCount) => ({
            id: `recipe-${stepCount}`,
            course: 'main' as const,
            name: `Recipe ${stepCount}`,
            description: null,
            pictureUri: `https://example.com/recipe-${stepCount}.jpg`,
            ingredients: [],
            steps: Array.from({ length: stepCount }, () => 'Cook.'),
          })),
          params,
        ),
      ),
    );

    await expect
      .poll(recipeNames)
      .toEqual(['Recipe 6', 'Recipe 5', 'Recipe 4', 'Recipe 3', 'Recipe 2']);
  });

  it('shows a message when there are no projects', async () => {
    const { search } = mountWeekendProjects();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No weekend projects found');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });
});

function mountWeekendProjects() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([hummus, lamb]));

  TestBed.createComponent(WeekendProjects);

  return { search };
}

function recipeNames() {
  return page
    .getByTestId('recipe-name')
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

/* Mimics the backend: recipes are only filtered by course when asked to. */
function filterByCourses(
  recipes: Recipe[],
  params: RecipeSearchParams,
): Recipe[] {
  return 'courses' in params
    ? recipes.filter((recipe) => params.courses?.includes(recipe.course))
    : recipes;
}
