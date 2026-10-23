import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
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
  it('searches all recipes', async () => {
    const { fixture, search } = mountWeekendProjects();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows the most involved recipes first', async () => {
    const { fixture, search } = mountWeekendProjects();
    search.mockReturnValue(of([hummus, lamb]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Slow-roasted Lamb',
      'Hummus with Ful',
    ]);
  });

  it('shows the step count of each project', async () => {
    const { fixture, search } = mountWeekendProjects();
    search.mockReturnValue(of([lamb]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="step-count"]')
        ?.textContent?.trim(),
    ).toBe('5 steps');
  });

  it('keeps only the top five projects', async () => {
    const { fixture, search } = mountWeekendProjects();
    search.mockReturnValue(
      of(
        [1, 2, 3, 4, 5, 6].map((stepCount) => ({
          id: `recipe-${stepCount}`,
          course: 'main' as const,
          name: `Recipe ${stepCount}`,
          description: null,
          pictureUri: `https://example.com/recipe-${stepCount}.jpg`,
          ingredients: [],
          steps: Array.from({ length: stepCount }, () => 'Cook.'),
        })),
      ),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(recipeNames(fixture.nativeElement)).toEqual([
      'Recipe 6',
      'Recipe 5',
      'Recipe 4',
      'Recipe 3',
      'Recipe 2',
    ]);
  });

  it('shows a message when there are no projects', async () => {
    const { fixture, search } = mountWeekendProjects();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No weekend projects found');
  });
});

function mountWeekendProjects() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([hummus, lamb]));

  const fixture = TestBed.createComponent(WeekendProjects);

  return { fixture, search };
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
