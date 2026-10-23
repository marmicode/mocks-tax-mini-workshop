import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
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
  it('fetches the recipe and asks for confirmation', async () => {
    const { fixture, findById } = mountAdminRecipeDelete('shakshuka');
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(fixture.nativeElement.querySelector('h2')?.textContent).toContain(
      'Delete Shakshuka?',
    );
  });

  it('removes the recipe and goes back to the list', async () => {
    const { fixture, findById, remove, navigate } =
      mountAdminRecipeDelete('shakshuka');
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Delete').click();
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(remove).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'admin', 'recipes']);
  });

  it('links back to the list without removing anything', async () => {
    const { fixture, findById, remove } = mountAdminRecipeDelete('shakshuka');
    await fixture.whenStable();

    const cancel = [...fixture.nativeElement.querySelectorAll('a')].find(
      (el: HTMLAnchorElement) => el.textContent?.trim() === 'Cancel',
    );

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'shakshuka' });
    expect(cancel?.getAttribute('href')).toBe('/admin/recipes');
    expect(remove).not.toHaveBeenCalled();
  });

  it('shows "Recipe not found" for an unknown recipe', async () => {
    const { fixture, findById, remove } = mountAdminRecipeDelete('missing');
    findById.mockReturnValue(of(undefined));
    await fixture.whenStable();

    expect(findById).toHaveBeenCalledExactlyOnceWith({ id: 'missing' });
    expect(fixture.nativeElement.textContent).toContain('Recipe not found');
    expect(remove).not.toHaveBeenCalled();
  });
});

function mountAdminRecipeDelete(recipeId: string) {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const recipeRepository = TestBed.inject(RecipeRepository);
  const findById = vi
    .spyOn(recipeRepository, 'findById')
    .mockReturnValue(of(shakshuka));
  const remove = vi
    .spyOn(recipeRepository, 'remove')
    .mockReturnValue(of(undefined));
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigate')
    .mockResolvedValue(true);

  const fixture = TestBed.createComponent(AdminRecipeDelete);
  fixture.componentRef.setInput('recipeId', recipeId);

  return { fixture, findById, remove, navigate };
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
