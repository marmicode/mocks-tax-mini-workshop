import {
  type Course,
  createRecipe,
  type Ingredient,
  type Recipe,
} from '@whiskmate/shared-recipe/model';

/**
 * Builds test recipes from a name.
 * The id and picture derive from the name so tests only state what matters.
 */
class RecipeMother {
  withBasicInfo(info: string | RecipeBasicInfo): NestedRecipeMother {
    const {
      name,
      course = 'main',
      description = null,
    } = typeof info === 'string' ? { name: info } : info;
    const slug = slugify(name);
    return new NestedRecipeMother(
      createRecipe({
        id: slug,
        course,
        name,
        description,
        pictureUri: `https://example.com/${slug}.jpg`,
        ingredients: [],
        steps: [],
      }),
    );
  }
}

interface RecipeBasicInfo {
  name: string;
  course?: Course;
  description?: string | null;
}

class NestedRecipeMother {
  constructor(private _recipe: Readonly<Recipe>) {}

  build(): Recipe {
    return this._recipe;
  }

  withId(id: string): NestedRecipeMother {
    return this._extendWith({ id });
  }

  withPictureUri(pictureUri: string): NestedRecipeMother {
    return this._extendWith({ pictureUri });
  }

  withIngredients(ingredients: Ingredient[]): NestedRecipeMother {
    return this._extendWith({ ingredients });
  }

  withSomeIngredients(): NestedRecipeMother {
    return this.withIngredients(
      PANTRY.slice(0, SOME).map((name) => ({ name })),
    );
  }

  withManyIngredients(): NestedRecipeMother {
    return this.withIngredients(
      PANTRY.slice(0, MANY).map((name) => ({ name })),
    );
  }

  withSteps(steps: string[]): NestedRecipeMother {
    return this._extendWith({ steps });
  }

  withSomeSteps(): NestedRecipeMother {
    return this.withSteps(numberedSteps(SOME));
  }

  withManySteps(): NestedRecipeMother {
    return this.withSteps(numberedSteps(MANY));
  }

  private _extendWith(recipe: Partial<Recipe>): NestedRecipeMother {
    return new NestedRecipeMother({ ...this._recipe, ...recipe });
  }
}

/* Few enough to pass every "quick" or "simple" filter of the app. */
const SOME = 3;
/* Too many for any of them. */
const MANY = 8;

const PANTRY = [
  'salt',
  'pepper',
  'olive oil',
  'garlic',
  'lemon',
  'cumin',
  'parsley',
  'tahini',
];

function numberedSteps(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `Step ${index + 1}.`);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const recipeMother = new RecipeMother();
