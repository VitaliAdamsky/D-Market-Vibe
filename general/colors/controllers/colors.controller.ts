import { Hono } from "hono";
import { ColorsRepository } from "#colors/colors-repo.ts";
import { Colors } from "#colors/models/colors.ts"; // Предполагается, что ваш репозиторий находится здесь

// Создаем новый экземпляр роутера Hono
const colorsRouter = new Hono();

/**
 * ИСПРАВЛЕНО: Маршрут для получения пользовательских (кэшированных) цветов.
 * GET /get
 */
colorsRouter.get("/get", (c) => {
  try {
    const colors = ColorsRepository.getCachedColors();

    if (!colors) {
      return c.json({ error: "User colors not found in cache." }, 404);
    }

    return c.json(colors, 200);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [GET /colors/get] Error:", errorMessage);
    return c.json({ error: "Failed to get user colors" }, 500);
  }
});

/**
 * ДОБАВЛЕНО: Отдельный маршрут для получения цветов по умолчанию.
 * GET /get-default
 */
colorsRouter.get("/get-default", async (c) => {
  try {
    const colors = await ColorsRepository.getColors(true);

    if (!colors) {
      return c.json({ error: "Default colors not found." }, 404);
    }

    return c.json(colors, 200);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [GET /colors/get-default] Error:", errorMessage);
    return c.json({ error: "Failed to get default colors" }, 500);
  }
});

/**
 * ИСПРАВЛЕНО: Маршрут для сохранения пользовательских цветов.
 * POST /set
 */
colorsRouter.post("/set", async (c) => {
  try {
    const colorsToSave = await c.req.json<Colors>();
    const success = await ColorsRepository.saveColors(colorsToSave, false);

    if (!success) {
      throw new Error("Failed to save user colors in repository.");
    }

    const updatedColors = ColorsRepository.getCachedColors();
    return c.json({ success: true, colors: updatedColors }, 200);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [POST /colors/set] Error:", errorMessage);
    return c.json({ error: "Failed to save user colors" }, 500);
  }
});

/**
 * ДОБАВЛЕНО: Отдельный маршрут для сохранения цветов по умолчанию.
 * POST /set-default
 */
colorsRouter.post("/set-default", async (c) => {
  try {
    const colorsToSave = await c.req.json<Colors>();
    const success = await ColorsRepository.saveColors(colorsToSave, true);

    if (!success) {
      throw new Error("Failed to save default colors in repository.");
    }

    return c.json({ success: true }, 200);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [POST /colors/set-default] Error:", errorMessage);
    return c.json({ error: "Failed to save default colors" }, 500);
  }
});

/**
 * Маршрут для принудительного обновления кэша цветов с сервера.
 * POST /update-cache
 */
colorsRouter.post("/update-cache", async (c) => {
  try {
    await ColorsRepository.initialize(); // Перезагружает и кэширует цвета
    const colors = ColorsRepository.getCachedColors();

    if (!colors) {
      throw new Error("Failed to update cache from repository.");
    }

    return c.json({ success: true, colors }, 200);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ [POST /colors/update-cache] Error:", errorMessage);
    return c.json({ error: "Failed to update colors in cache" }, 500);
  }
});

export default colorsRouter;
