import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminPictureAudit } from './admin-picture-audit.ng';

describe(AdminPictureAudit.name, () => {
  it('searches all recipes', async () => {
    const { fixture } = mountAdminPictureAudit({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withPictureUri('http://example.com/cheesecake.jpg')
          .build(),
        recipeMother
          .withBasicInfo('Shakshuka')
          .withPictureUri('http://example.com/shakshuka.jpg')
          .withManyIngredients()
          .build(),
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withPictureUri('http://example.com/hummus.jpg')
          .withManySteps()
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake http://example.com/cheesecake.jpg Not served over https',
      'Shakshuka http://example.com/shakshuka.jpg Not served over https',
      'Hummus with Ful http://example.com/hummus.jpg Not served over https',
    ]);
  });

  it('accepts https and local pictures', async () => {
    const { fixture } = mountAdminPictureAudit({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Shakshuka',
          })
          .build(),
        recipeMother
          .withBasicInfo({
            name: 'Tahini and Halva Brownies',
          })
          .withPictureUri('/images/tahini-halva-brownies.svg')
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe('All pictures are safe.');
  });

  it('flags pictures served over plain http', async () => {
    const { fixture } = mountAdminPictureAudit({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Courgette Fritters', course: 'starter' })
          .withPictureUri('http://example.com/fritters.jpg')
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters http://example.com/fritters.jpg Not served over https',
    ]);
  });

  it('flags missing pictures', async () => {
    const { fixture } = mountAdminPictureAudit({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
          })
          .withPictureUri('')
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Hummus with Ful Missing picture',
    ]);
  });

  it('flags pictures from unknown locations', async () => {
    const { fixture } = mountAdminPictureAudit({
      recipes: [
        recipeMother
          .withBasicInfo('Shakshuka')
          .withPictureUri('ftp://example.com/shakshuka.jpg')
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Shakshuka ftp://example.com/shakshuka.jpg Unknown location',
    ]);
  });
});

function mountAdminPictureAudit({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminPictureAudit);

  return { fixture };
}

function rowTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="picture-audit-row"]')].map(
    (row) =>
      [...row.querySelectorAll('td')]
        .map((cell) => cell.textContent?.trim())
        .filter(Boolean)
        .join(' '),
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
