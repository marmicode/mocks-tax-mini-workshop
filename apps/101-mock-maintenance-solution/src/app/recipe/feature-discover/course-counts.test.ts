import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { CourseCounts } from './course-counts.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const fritters: Recipe = {
  id: 'courgette-fritters',
  course: 'starter',
  name: 'Courgette and Herb Fritters',
  description: null,
  pictureUri: 'https://example.com/fritters.jpg',
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

describe(CourseCounts, () => {
  it('searches each course', async () => {
    const { search } = mountCourseCounts();

    await expect.poll(() => search.mock.calls.length).toBe(3);
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

  it('shows the recipe count of each course', async () => {
    const { search } = mountCourseCounts();
    search
      .mockReturnValueOnce(of([hummus, fritters]))
      .mockReturnValueOnce(of([shakshuka]))
      .mockReturnValueOnce(of([]));

    await expect
      .poll(courseCountTexts)
      .toEqual(['Starters (2)', 'Mains (1)', 'Desserts (0)']);
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
  });

  it('links each course to its page', async () => {
    const { search } = mountCourseCounts();

    await expect
      .poll(courseCountLinks)
      .toEqual([
        '/discover/courses/starter',
        '/discover/courses/main',
        '/discover/courses/dessert',
      ]);
    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });
});

function mountCourseCounts() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(CourseCounts);

  return { search };
}

function courseCounts() {
  return page.getByTestId('course-count');
}

function courseCountTexts() {
  return courseCounts()
    .elements()
    .map((el) => el.textContent?.trim() ?? '');
}

function courseCountLinks() {
  return courseCounts()
    .elements()
    .map((el) => el.getAttribute('href'));
}
