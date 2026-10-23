import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { CourseCounts } from './course-counts.ng';

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .build();

const fritters = recipeMother
  .withBasicInfo({ name: 'Courgette and Herb Fritters', course: 'starter' })
  .build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

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
