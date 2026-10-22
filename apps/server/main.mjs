/**
 * Minimal Whiskmate backend used by the dev server (see `proxy.conf.json`).
 * Recipes are kept in memory: restarting the server resets the catalog.
 */
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 3333);

let recipes = JSON.parse(
  readFileSync(new URL("./recipes.json", import.meta.url), "utf8"),
);

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const [, api, resource, id] = url.pathname.split("/");

  if (api !== "api" || resource !== "recipes") {
    return send(res, 404, { error: "Not found" });
  }

  try {
    if (id == null) {
      switch (req.method) {
        case "POST":
          return createRecipe(res, await readBody(req));
      }
    } else if (id === "search") {
      switch (req.method) {
        case "POST":
          return send(res, 200, searchRecipes(await readBody(req)));
      }
    } else {
      const recipeId = decodeURIComponent(id);
      switch (req.method) {
        case "GET":
          return findRecipe(res, recipeId);
        case "PUT":
          return updateRecipe(res, recipeId, await readBody(req));
        case "DELETE":
          return removeRecipe(res, recipeId);
      }
    }
    return send(res, 405, { error: "Method not allowed" });
  } catch (error) {
    return send(res, 400, { error: String(error) });
  }
});

server.listen(PORT, () => {
  console.log(`🥘 Whiskmate API listening on http://localhost:${PORT}/api`);
});

function searchRecipes({
  keywords,
  maxIngredientCount,
  maxStepCount,
  courses,
} = {}) {
  const lowerCaseKeywords = keywords?.toLowerCase();

  return recipes.filter(
    (recipe) =>
      (!lowerCaseKeywords ||
        recipe.name.toLowerCase().includes(lowerCaseKeywords)) &&
      (maxIngredientCount == null ||
        recipe.ingredients.length <= maxIngredientCount) &&
      (maxStepCount == null || recipe.steps.length <= maxStepCount) &&
      (courses == null || courses.includes(recipe.course)),
  );
}

function findRecipe(res, id) {
  const recipe = recipes.find((item) => item.id === id);
  return recipe
    ? send(res, 200, recipe)
    : send(res, 404, { error: `Recipe ${id} not found` });
}

function createRecipe(res, recipe) {
  if (recipes.some((item) => item.id === recipe.id)) {
    return send(res, 409, { error: `Recipe ${recipe.id} already exists` });
  }
  recipes = [...recipes, recipe];
  return send(res, 201, recipe);
}

function updateRecipe(res, id, recipe) {
  if (!recipes.some((item) => item.id === id)) {
    return send(res, 404, { error: `Recipe ${id} not found` });
  }
  recipes = recipes.map((item) => (item.id === id ? { ...recipe, id } : item));
  return send(res, 200, { ...recipe, id });
}

function removeRecipe(res, id) {
  if (!recipes.some((item) => item.id === id)) {
    return send(res, 404, { error: `Recipe ${id} not found` });
  }
  recipes = recipes.filter((item) => item.id !== id);
  res.writeHead(204).end();
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
  }
  return JSON.parse(body);
}

function send(res, status, body) {
  res
    .writeHead(status, { "Content-Type": "application/json" })
    .end(JSON.stringify(body));
}
