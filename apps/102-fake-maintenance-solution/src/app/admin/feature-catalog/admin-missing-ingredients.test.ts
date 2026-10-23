import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminMissingIngredients } from './admin-missing-ingredients.ng';

describe(AdminMissingIngredients.name, () => {
  it('searches all recipes', async () => {
    const lambShoulder = recipeMother
      .withBasicInfo('Slow-Roasted Lamb Shoulder')
      .withManyIngredients()
      .build();
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .build(),
        /* Too many ingredients for any quick filter, one of them unnamed. */
        {
          ...lambShoulder,
          ingredients: [...lambShoulder.ingredients, { name: '' }],
        },
        recipeMother.withBasicInfo('Hummus with Ful').withManySteps().build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake — no ingredients',
      'Slow-Roasted Lamb Shoulder — 1 unnamed ingredient(s)',
      'Hummus with Ful — no ingredients',
    ]);
  });

  it('shows an empty state when every recipe has ingredients', async () => {
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Shakshuka',
          })
          .withSomeIngredients()
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe(
      'Every recipe has ingredients.',
    );
  });

  it('lists recipes without any ingredient', async () => {
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Courgette Fritters', course: 'starter' })
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters — no ingredients',
    ]);
  });

  it('lists recipes with unnamed ingredients', async () => {
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Tahini and Halva Brownies',
          })
          .withIngredients([{ name: 'butter' }, { name: '' }, { name: ' ' }])
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies — 2 unnamed ingredient(s)',
    ]);
  });

  it('only lists incomplete recipes', async () => {
    const { fixture } = mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
          })
          .withSomeIngredients()
          .build(),
        recipeMother
          .withBasicInfo({ name: 'Courgette Fritters', course: 'starter' })
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters — no ingredients',
    ]);
  });
});

function mountAdminMissingIngredients({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminMissingIngredients);

  return { fixture };
}

function rowTexts(root: HTMLElement): string[] {
  return [
    ...root.querySelectorAll('[data-testid="missing-ingredients-row"]'),
  ].map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '');
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
