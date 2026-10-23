import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { SimilarRecipes } from './similar-recipes.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const harissaChicken: Recipe = {
  id: 'harissa-chicken',
  course: 'main',
  name: 'Harissa-Roasted Chicken',
  description: null,
  pictureUri: 'https://example.com/harissa-chicken.jpg',
  ingredients: [],
  steps: [],
};

const lambKofte: Recipe = {
  id: 'lamb-kofte',
  course: 'main',
  name: 'Lamb Kofte',
  description: null,
  pictureUri: 'https://example.com/lamb-kofte.jpg',
  ingredients: [],
  steps: [],
};

const cauliflowerCake: Recipe = {
  id: 'cauliflower-cake',
  course: 'main',
  name: 'Cauliflower Cake',
  description: null,
  pictureUri: 'https://example.com/cauliflower-cake.jpg',
  ingredients: [],
  steps: [],
};

const filoPie: Recipe = {
  id: 'sweet-potato-filo-pie',
  course: 'main',
  name: 'Sweet Potato and Feta Filo Pie',
  description: null,
  pictureUri: 'https://example.com/filo-pie.jpg',
  ingredients: [],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

describe(SimilarRecipes.name, () => {
  it('searches recipes of the same course', async () => {
    const { fixture, search } = mountSimilarRecipes(shakshuka);
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('excludes the current recipe', async () => {
    const { fixture, search } = mountSimilarRecipes(shakshuka);
    search.mockReturnValue(of([shakshuka, harissaChicken]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(similarNames(fixture.nativeElement)).toEqual([
      'Harissa-Roasted Chicken',
    ]);
  });

  it('shows at most three similar recipes', async () => {
    const { fixture, search } = mountSimilarRecipes(shakshuka);
    search.mockReturnValue(
      of([shakshuka, harissaChicken, lambKofte, cauliflowerCake, filoPie]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(similarNames(fixture.nativeElement)).toEqual([
      'Harissa-Roasted Chicken',
      'Lamb Kofte',
      'Cauliflower Cake',
    ]);
  });

  it('links to the similar recipe', async () => {
    const { fixture, search } = mountSimilarRecipes(shakshuka);
    search.mockReturnValue(of([harissaChicken]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(similarLinks(fixture.nativeElement)[0]?.getAttribute('href')).toBe(
      '/recipes/harissa-chicken',
    );
  });

  it('renders nothing when the recipe is the only one of its course', async () => {
    const { fixture, search } = mountSimilarRecipes(cheesecake);
    search.mockReturnValue(of([cheesecake]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});

function mountSimilarRecipes(recipe: Recipe) {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(SimilarRecipes);
  fixture.componentRef.setInput('recipe', recipe);

  return { fixture, search };
}

function similarLinks(root: HTMLElement): HTMLAnchorElement[] {
  return [
    ...root.querySelectorAll<HTMLAnchorElement>(
      '[data-testid="similar-recipe"]',
    ),
  ];
}

function similarNames(root: HTMLElement): string[] {
  return similarLinks(root).map((link) => link.textContent?.trim() ?? '');
}
