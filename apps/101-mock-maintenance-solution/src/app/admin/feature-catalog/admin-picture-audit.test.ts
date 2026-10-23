import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminPictureAudit } from './admin-picture-audit.ng';

describe(AdminPictureAudit.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminPictureAudit();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('accepts https and local pictures', async () => {
    const { fixture, search } = mountAdminPictureAudit();
    search.mockReturnValue(
      of([
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: 'Eggs poached in a spiced tomato sauce.',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }],
          steps: ['Cook.'],
        },
        {
          id: 'tahini-halva-brownies',
          course: 'dessert',
          name: 'Tahini and Halva Brownies',
          description: null,
          pictureUri: '/images/tahini-halva-brownies.svg',
          ingredients: [{ name: 'tahini' }],
          steps: ['Bake.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(emptyState(fixture.nativeElement)).toBe('All pictures are safe.');
  });

  it('flags pictures served over plain http', async () => {
    const { fixture, search } = mountAdminPictureAudit();
    search.mockReturnValue(
      of([
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'http://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }],
          steps: ['Fry.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters http://example.com/fritters.jpg Not served over https',
    ]);
  });

  it('flags missing pictures', async () => {
    const { fixture, search } = mountAdminPictureAudit();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: '',
          ingredients: [{ name: 'chickpeas' }],
          steps: ['Blend.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Hummus with Ful Missing picture',
    ]);
  });

  it('flags pictures from unknown locations', async () => {
    const { fixture, search } = mountAdminPictureAudit();
    search.mockReturnValue(
      of([
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: null,
          pictureUri: 'ftp://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }],
          steps: ['Cook.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Shakshuka ftp://example.com/shakshuka.jpg Unknown location',
    ]);
  });
});

function mountAdminPictureAudit() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminPictureAudit);

  return { fixture, search };
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
