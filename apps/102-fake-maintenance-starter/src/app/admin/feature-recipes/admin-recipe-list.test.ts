import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminRecipeList } from './admin-recipe-list.ng';

const shakshuka = recipeMother
  .withBasicInfo('Shakshuka')
  .withSomeIngredients()
  .withSomeSteps()
  .build();

const cheesecake = recipeMother
  .withBasicInfo({ name: 'Lemon and Ricotta Cheesecake', course: 'dessert' })
  .withManyIngredients()
  .withManySteps()
  .build();

const hummus = recipeMother
  .withBasicInfo({ name: 'Hummus with Ful', course: 'starter' })
  .withSomeIngredients()
  .withSomeSteps()
  .build();

describe(AdminRecipeList.name, () => {
  it('lists all recipes on load', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '3', '3'],
      ['Lemon and Ricotta Cheesecake', 'dessert', '8', '8'],
    ]);
  });

  it('searches by keywords', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'lemon');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '8', '8'],
    ]);
  });

  it('searches by course', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '8', '8'],
    ]);
  });

  it('stops filtering by course when "All courses" is selected', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '3', '3'],
      ['Lemon and Ricotta Cheesecake', 'dessert', '8', '8'],
    ]);
  });

  it('links to the edit and delete pages of each recipe', async () => {
    const { fixture } = mountAdminRecipeList({ recipes: [shakshuka] });
    await fixture.whenStable();

    expect(linkByText(fixture.nativeElement, 'Edit').getAttribute('href')).toBe(
      '/admin/recipes/shakshuka/edit',
    );
    expect(
      linkByText(fixture.nativeElement, 'Delete').getAttribute('href'),
    ).toBe('/admin/recipes/shakshuka/delete');
    expect(
      linkByText(fixture.nativeElement, 'New recipe').getAttribute('href'),
    ).toBe('/admin/recipes/new');
  });

  it('shows "No recipes found" when nothing matches', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'xyz');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No recipes found');
  });

  it('shows the number of recipes found', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('.count')?.textContent?.trim(),
    ).toBe('2 recipe(s)');
  });

  it('renders the recipes matching the keywords', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'ricotta');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '8', '8'],
    ]);
  });

  it('combines keywords and course', async () => {
    const { fixture } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'shak');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '3', '3'],
    ]);
  });

  it('keeps keywords when "All courses" is selected again', async () => {
    const { fixture } = mountAdminRecipeList({
      recipes: [shakshuka, cheesecake, hummus],
    });
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();
    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'hummus');
    await fixture.whenStable();
    expect(rows(fixture.nativeElement)).toEqual([]);

    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Hummus with Ful', 'starter', '3', '3'],
    ]);
  });
});

function mountAdminRecipeList({
  recipes = [shakshuka, cheesecake],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);
  const fixture = TestBed.createComponent(AdminRecipeList);
  return { fixture };
}

function rows(root: HTMLElement): string[][] {
  return [...root.querySelectorAll('[data-testid="recipe-row"]')].map((row) =>
    [...row.querySelectorAll('td')]
      .slice(0, 4)
      .map((cell) => cell.textContent?.trim() ?? ''),
  );
}

function inputByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const field = [...root.querySelectorAll('mat-form-field')].find(
    (el) => el.querySelector('mat-label')?.textContent?.trim() === label,
  );
  const input = field?.querySelector('input');
  if (input == null) {
    throw new Error(`Input "${label}" not found.`);
  }
  return input;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function selectCourse(root: HTMLElement, course: string): void {
  const select = root.querySelector('select');
  if (select == null) {
    throw new Error('Course select not found.');
  }
  select.value = course;
  select.dispatchEvent(new Event('change'));
}

function linkByText(root: HTMLElement, text: string): HTMLAnchorElement {
  const link = [...root.querySelectorAll('a')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (link == null) {
    throw new Error(`Link "${text}" not found.`);
  }
  return link;
}
