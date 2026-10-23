import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, vi } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminExport } from './admin-export.ng';

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .build();

describe(AdminExport.name, () => {
  it('searches all recipes without a course filter', async () => {
    const lambShoulder = recipeMother
      .withBasicInfo('Slow-Roasted Lamb Shoulder')
      .withManyIngredients()
      .build();
    const kofte = recipeMother
      .withBasicInfo('Lamb Kofte')
      .withManySteps()
      .build();
    const { fixture } = mountAdminExport({
      recipes: [shakshuka, cheesecake, lambShoulder, kofte],
    });
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '4 recipe(s) to export',
    );
    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([shakshuka, cheesecake, lambShoulder, kofte]);
  });

  it('previews the exported recipes as JSON', async () => {
    const { fixture } = mountAdminExport();
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '2 recipe(s) to export',
    );
    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([shakshuka, cheesecake]);
  });

  it('exports a single course', async () => {
    const { fixture } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([cheesecake]);
  });

  it('goes back to all courses', async () => {
    const { fixture } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([shakshuka, cheesecake]);
  });

  it('downloads the recipes as recipes.json', async () => {
    const { fixture } = mountAdminExport();
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:recipes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Download recipes.json').click();

    const blob = createObjectURL.mock.lastCall?.[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual([shakshuka, cheesecake]);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('recipes.json');
    expect(link.href).toBe('blob:recipes');
  });

  it('previews an empty export when the catalog is empty', async () => {
    const { fixture } = mountAdminExport({ recipes: [] });
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '0 recipe(s) to export',
    );
    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([]);
  });

  it('switches from one course to another', async () => {
    const { fixture } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '1 recipe(s) to export',
    );
    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([cheesecake]);
  });

  it('counts the recipes to export again after going back to all courses', async () => {
    const { fixture } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '1 recipe(s) to export',
    );

    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '2 recipe(s) to export',
    );
  });

  it('downloads only the recipes of the selected course', async () => {
    const { fixture } = mountAdminExport();
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:recipes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Download recipes.json').click();

    const blob = createObjectURL.mock.lastCall?.[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual([shakshuka]);
  });
});

function mountAdminExport({
  recipes = [shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(AdminExport);

  return { fixture };
}

function textByTestId(root: HTMLElement, testId: string): string {
  return (
    root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? ''
  );
}

function selectCourse(root: HTMLElement, course: string): void {
  const select = root.querySelector<HTMLSelectElement>(
    'select[aria-label="Course"]',
  );
  if (select == null) {
    throw new Error('Course select not found.');
  }
  select.value = course;
  select.dispatchEvent(new Event('change'));
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}
