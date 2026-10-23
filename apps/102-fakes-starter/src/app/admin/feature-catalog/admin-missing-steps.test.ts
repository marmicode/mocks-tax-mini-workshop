import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminMissingSteps } from './admin-missing-steps.ng';

describe(AdminMissingSteps.name, () => {
  it('searches all recipes', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .build(),
        recipeMother.withBasicInfo('Shakshuka').withManyIngredients().build(),
        /* Too many steps for any quick filter, all of them blank. */
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withSteps(['', '', '', '', '', '', '', ''])
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
      'Shakshuka',
      'Hummus with Ful (8 blank)',
    ]);
  });

  it('shows an empty state when every recipe has steps', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Shakshuka',
          })
          .withSomeSteps()
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe('Every recipe has steps.');
  });

  it('lists recipes without any step', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
          })
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });

  it('lists recipes with only blank steps', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Courgette Fritters', course: 'starter' })
          .withSteps(['', '  '])
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters (2 blank)',
    ]);
  });

  it('ignores recipes with at least one real step', async () => {
    const { fixture } = mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Tahini and Halva Brownies',
          })
          .withSteps(['', 'Bake.'])
          .build(),
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
          })
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual(['Hummus with Ful']);
  });
});

function mountAdminMissingSteps({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminMissingSteps);

  return { fixture };
}

function rowTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="missing-steps-row"]')].map(
    (row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
