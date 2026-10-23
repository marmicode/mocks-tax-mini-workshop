import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
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
  it('shows only recipes of the same course', async () => {
    const { fixture } = mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken, cheesecake],
    });
    await fixture.whenStable();

    expect(similarNames(fixture.nativeElement)).toEqual([
      'Harissa-Roasted Chicken',
    ]);
  });

  it('excludes the current recipe', async () => {
    const { fixture } = mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken],
    });
    await fixture.whenStable();

    expect(similarNames(fixture.nativeElement)).toEqual([
      'Harissa-Roasted Chicken',
    ]);
  });

  it('shows at most three similar recipes', async () => {
    const { fixture } = mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken, lambKofte, cauliflowerCake, filoPie],
    });
    await fixture.whenStable();

    expect(similarNames(fixture.nativeElement)).toEqual([
      'Harissa-Roasted Chicken',
      'Lamb Kofte',
      'Cauliflower Cake',
    ]);
  });

  it('links to the similar recipe', async () => {
    const { fixture } = mountSimilarRecipes(shakshuka, {
      recipes: [shakshuka, harissaChicken],
    });
    await fixture.whenStable();

    expect(similarLinks(fixture.nativeElement)[0]?.getAttribute('href')).toBe(
      '/recipes/harissa-chicken',
    );
  });

  it('renders nothing when the recipe is the only one of its course', async () => {
    const { fixture } = mountSimilarRecipes(cheesecake, {
      recipes: [shakshuka, cheesecake],
    });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});

function mountSimilarRecipes(
  recipe: Recipe,
  { recipes }: { recipes: Recipe[] },
) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(SimilarRecipes);
  fixture.componentRef.setInput('recipe', recipe);

  return { fixture };
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
