import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminPictureAudit } from './admin-picture-audit.ng';

describe(AdminPictureAudit, () => {
  it('searches all recipes', async () => {
    mountAdminPictureAudit({
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

    await expect
      .poll(() => rowTexts('picture-audit-row'))
      .toEqual([
        'Lemon and Ricotta Cheesecake http://example.com/cheesecake.jpg Not served over https',
        'Shakshuka http://example.com/shakshuka.jpg Not served over https',
        'Hummus with Ful http://example.com/hummus.jpg Not served over https',
      ]);
  });

  it('accepts https and local pictures', async () => {
    mountAdminPictureAudit({
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

    await expect.element(page.getByTestId('empty-state')).toHaveTextContent('All pictures are safe.');
  });

  it('flags pictures served over plain http', async () => {
    mountAdminPictureAudit({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Courgette Fritters', course: 'starter' })
          .withPictureUri('http://example.com/fritters.jpg')
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('picture-audit-row'))
      .toEqual([
        'Courgette Fritters http://example.com/fritters.jpg Not served over https',
      ]);
  });

  it('flags missing pictures', async () => {
    mountAdminPictureAudit({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
          })
          .withPictureUri('')
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('picture-audit-row'))
      .toEqual(['Hummus with Ful Missing picture']);
  });

  it('flags pictures from unknown locations', async () => {
    mountAdminPictureAudit({
      recipes: [
        recipeMother
          .withBasicInfo('Shakshuka')
          .withPictureUri('ftp://example.com/shakshuka.jpg')
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('picture-audit-row'))
      .toEqual(['Shakshuka ftp://example.com/shakshuka.jpg Unknown location']);
  });
});

function mountAdminPictureAudit({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminPictureAudit);
}

function rowTexts(testId: string) {
  return page.getByTestId(testId).elements().map((row) => rowText(row));
}

function rowText(row: Element) {
  return textOf(row);
}

function textOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }
  if (!(node instanceof Element)) {
    return '';
  }
  return [...node.childNodes]
    .map((child) => textOf(child))
    .filter((text) => text.length > 0)
    .join(' ');
}
