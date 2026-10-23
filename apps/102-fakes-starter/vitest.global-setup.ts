import { type ChildProcess, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Port of the recipe API the tests talk to (see `server.proxy` in `vitest.config.mts`).
 * It is not the dev server's port on purpose: the tests wipe its catalog.
 */
export const RECIPE_API_PORT = 3334;

const RECIPE_API_URL = `http://localhost:${RECIPE_API_PORT}`;
const RECIPE_API_MAIN = fileURLToPath(
  new URL('../server/main.mjs', import.meta.url),
);

let recipeApi: ChildProcess | undefined;

export async function setup() {
  /* Another test run already started it. */
  if (await isRecipeApiUp()) {
    return;
  }

  recipeApi = spawn(process.execPath, [RECIPE_API_MAIN], {
    env: { ...process.env, PORT: String(RECIPE_API_PORT) },
    stdio: 'ignore',
  });

  await waitUntil(isRecipeApiUp, {
    timeoutMs: 10_000,
    message: `Recipe API did not start on ${RECIPE_API_URL}`,
  });
}

export function teardown() {
  recipeApi?.kill();
}

async function isRecipeApiUp(): Promise<boolean> {
  try {
    const response = await fetch(`${RECIPE_API_URL}/api/recipes/search`, {
      method: 'POST',
      body: '{}',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitUntil(
  condition: () => Promise<boolean>,
  { timeoutMs, message }: { timeoutMs: number; message: string },
) {
  const deadline = Date.now() + timeoutMs;
  while (!(await condition())) {
    if (Date.now() > deadline) {
      throw new Error(message);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
