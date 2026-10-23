import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { AdminIdAudit } from './admin-id-audit.ng';

describe(AdminIdAudit.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminIdAudit();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('accepts a kebab-case id matching the name', async () => {
    const { fixture, search } = mountAdminIdAudit();
    search.mockImplementationOnce((params) => {
      expect(params).toStrictEqual(createRecipeSearchParams());
      return of([
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }],
          steps: ['Fry.'],
        },
      ]);
    });
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe('All ids look good.');
  });

  it('flags ids that are not kebab-case', async () => {
    const { fixture, search } = mountAdminIdAudit();
    search.mockImplementation((params) =>
      'courses' in params
        ? of([])
        : of([
            {
              id: 'Shakshuka_v2',
              course: 'main',
              name: 'Shakshuka',
              description: 'Eggs poached in a spiced tomato sauce.',
              pictureUri: 'https://example.com/shakshuka.jpg',
              ingredients: [{ name: 'eggs' }],
              steps: ['Cook.'],
            },
          ]),
    );
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Shakshuka_v2 Not kebab-case shakshuka',
    ]);
  });

  it('flags kebab-case ids that do not match the name', async () => {
    const { fixture, search } = mountAdminIdAudit();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
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
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'hummus-ful Does not match name hummus-with-ful',
    ]);
  });

  it('suggests ids without accents or punctuation', async () => {
    const { fixture, search } = mountAdminIdAudit();
    search.mockReturnValue(
      of([
        {
          id: 'creme-brulee',
          course: 'dessert',
          name: 'Crème Brûlée (Classic!)',
          description: null,
          pictureUri: '/images/creme-brulee.svg',
          ingredients: [{ name: 'cream' }],
          steps: ['Bake.', 'Torch.'],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search.mock.calls).toMatchSnapshot();
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'creme-brulee Does not match name creme-brulee-classic',
    ]);
  });
});

function mountAdminIdAudit() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminIdAudit);

  return { fixture, search };
}

function rowTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="id-audit-row"]')].map((row) =>
    [...row.querySelectorAll('td')]
      .map((cell) => cell.textContent?.trim())
      .join(' '),
  );
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
