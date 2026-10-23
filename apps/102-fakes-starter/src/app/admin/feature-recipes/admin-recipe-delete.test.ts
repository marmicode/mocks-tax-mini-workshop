import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeDelete } from './admin-recipe-delete.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

describe(AdminRecipeDelete.name, () => {
  it('shows the recipe and asks for confirmation', async () => {
    const { fixture } = mountAdminRecipeDelete('shakshuka');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain(
      'Delete Shakshuka?',
    );
  });

  it('removes the recipe and goes back to the list', async () => {
    const { fixture, recipeRepositoryFake, router } =
      mountAdminRecipeDelete('shakshuka');
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Delete').click();
    await fixture.whenStable();

    expect(recipeRepositoryFake.getRecipesSync()).toEqual([]);
    expect(router.url).toBe('/admin/recipes');
  });

  it('links back to the list without removing anything', async () => {
    const { fixture, recipeRepositoryFake } =
      mountAdminRecipeDelete('shakshuka');
    await fixture.whenStable();

    const cancel = [...fixture.nativeElement.querySelectorAll('a')].find(
      (el: HTMLAnchorElement) => el.textContent?.trim() === 'Cancel',
    );

    expect(cancel?.getAttribute('href')).toBe('/admin/recipes');
    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka]);
  });

  it('shows "Recipe not found" for an unknown recipe', async () => {
    const { fixture, recipeRepositoryFake } = mountAdminRecipeDelete('missing');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Recipe not found');
    expect(recipeRepositoryFake.getRecipesSync()).toEqual([shakshuka]);
  });
});

function mountAdminRecipeDelete(recipeId: string) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'admin/recipes', children: [] }]),
      provideRecipeRepositoryFake(),
    ],
  });
  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes([shakshuka]);
  const router = TestBed.inject(Router);

  const fixture = TestBed.createComponent(AdminRecipeDelete);
  fixture.componentRef.setInput('recipeId', recipeId);

  return { fixture, recipeRepositoryFake, router };
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
