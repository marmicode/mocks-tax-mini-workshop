import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe(CourseCounts.name, () => {
  it('searches each course', async () => {
    const { fixture, search } = mountCourseCounts();
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

  it('shows the recipe count of each course', async () => {
    const { fixture, search } = mountCourseCounts();
    search
      .mockReturnValueOnce(of([hummus, fritters]))
      .mockReturnValueOnce(of([shakshuka]))
      .mockReturnValueOnce(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['starter'],
    });
    expect(courseCountTexts(fixture.nativeElement)).toEqual([
      'Starters (2)',
      'Mains (1)',
      'Desserts (0)',
    ]);
  });

  it('links each course to its page', async () => {
    const { fixture, search } = mountCourseCounts();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
    expect(courseCountLinks(fixture.nativeElement)).toEqual([
      '/discover/courses/starter',
      '/discover/courses/main',
      '/discover/courses/dessert',
    ]);
  });
});

function mountCourseCounts() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(CourseCounts);

  return { fixture, search };
}

function courseCountElements(root: HTMLElement): HTMLAnchorElement[] {
  return [
    ...root.querySelectorAll<HTMLAnchorElement>('[data-testid="course-count"]'),
  ];
}

function courseCountTexts(root: HTMLElement): string[] {
  return courseCountElements(root).map((el) => el.textContent?.trim() ?? '');
}

function courseCountLinks(root: HTMLElement): (string | null)[] {
  return courseCountElements(root).map((el) => el.getAttribute('href'));
}
