import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { RecipeCompare } from './recipe-compare.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withIngredients([
    { name: 'Olive oil' },
    { name: 'garlic, crushed' },
    { name: 'large eggs' },
  ])
  .withSteps(['Heat the oil.', 'Add the eggs.'])
  .build();

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .withIngredients([{ name: 'olive oil' }, { name: 'tahini' }])
  .withSteps(['Blitz everything.'])
  .build();

describe(RecipeCompare.name, () => {
  it('lists all recipes in the pickers', async () => {
    const { fixture } = mountRecipeCompare({});
    await fixture.whenStable();

    expect(optionLabels(selects(fixture.nativeElement)[0])).toEqual([
      'Pick a recipe',
      'Shakshuka',
      'Hummus with Ful',
    ]);
  });

  it('compares course, ingredient count and step count', async () => {
    const { fixture } = mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
    });
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    expect(textOf(root, 'left-name')).toBe('Shakshuka');
    expect(textOf(root, 'right-name')).toBe('Hummus with Ful');
    expect(cellsOf(root, 'course-row')).toEqual(['main', 'starter']);
    expect(cellsOf(root, 'ingredient-count-row')).toEqual(['3', '2']);
    expect(cellsOf(root, 'step-count-row')).toEqual(['2', '1']);
  });

  it('lists shared ingredients ignoring case', async () => {
    const { fixture } = mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
    });
    await fixture.whenStable();

    expect(
      [
        ...fixture.nativeElement.querySelectorAll(
          '[data-testid="shared-ingredient"]',
        ),
      ].map((el) => (el as HTMLElement).textContent?.trim()),
    ).toEqual(['olive oil']);
  });

  it('navigates when a recipe is picked', async () => {
    const { fixture, router } = mountRecipeCompare({});
    await fixture.whenStable();

    const [leftSelect] = selects(fixture.nativeElement);
    leftSelect.value = hummus.id;
    leftSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(router.url).toBe(`/compare?left=${hummus.id}`);
  });

  it('preselects the compared recipes in the pickers', async () => {
    const { fixture } = mountRecipeCompare({
      left: hummus.id,
      right: shakshuka.id,
    });
    await fixture.whenStable();

    expect(
      selects(fixture.nativeElement).map((select) => select.value),
    ).toEqual([hummus.id, shakshuka.id]);
  });

  it('does not compare until both recipes are picked', async () => {
    const { fixture } = mountRecipeCompare({
      left: shakshuka.id,
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('tells when recipes share no ingredients', async () => {
    const { fixture } = mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
      recipes: [
        shakshuka,
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withIngredients([{ name: 'tahini' }])
          .build(),
      ],
    });
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'no-shared-ingredients')).toBe(
      'No shared ingredients.',
    );
  });

  it('clears a side when "Pick a recipe" is chosen', async () => {
    const { fixture, router } = mountRecipeCompare({
      left: shakshuka.id,
      right: hummus.id,
    });
    await router.navigateByUrl(
      `/compare?left=${shakshuka.id}&right=${hummus.id}`,
    );
    await fixture.whenStable();

    const [, rightSelect] = selects(fixture.nativeElement);
    rightSelect.value = '';
    rightSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(router.url).toBe(`/compare?left=${shakshuka.id}`);
  });
});

function mountRecipeCompare({
  left,
  right,
  recipes = [shakshuka, hummus],
}: {
  left?: string;
  right?: string;
  recipes?: Recipe[];
}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'compare', children: [] }]),
      provideRecipeRepositoryFake(),
    ],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const router = TestBed.inject(Router);

  const fixture = TestBed.createComponent(RecipeCompare);
  fixture.componentRef.setInput('left', left);
  fixture.componentRef.setInput('right', right);

  return { fixture, router };
}

function selects(root: HTMLElement): HTMLSelectElement[] {
  return [...root.querySelectorAll('select')];
}

function optionLabels(select: HTMLSelectElement | undefined): string[] {
  return [...(select?.options ?? [])].map((option) => option.text.trim());
}

function textOf(root: HTMLElement, testId: string): string | undefined {
  return root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
}

function cellsOf(root: HTMLElement, testId: string): string[] {
  return [...root.querySelectorAll(`[data-testid="${testId}"] td`)].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
