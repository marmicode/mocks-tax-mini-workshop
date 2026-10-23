import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
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
  it('shows the recipe count of each course', async () => {
    const { fixture } = mountCourseCounts({
      recipes: [hummus, fritters, shakshuka],
    });
    await fixture.whenStable();

    expect(courseCountTexts(fixture.nativeElement)).toEqual([
      'Starters (2)',
      'Mains (1)',
      'Desserts (0)',
    ]);
  });

  it('links each course to its page', async () => {
    const { fixture } = mountCourseCounts();
    await fixture.whenStable();

    expect(courseCountLinks(fixture.nativeElement)).toEqual([
      '/discover/courses/starter',
      '/discover/courses/main',
      '/discover/courses/dessert',
    ]);
  });
});

function mountCourseCounts({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(CourseCounts);

  return { fixture };
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
