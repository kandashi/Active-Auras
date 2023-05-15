
import CONSTANTS from "./constants.mjs";
import { AAHelpers } from "./lib/AAHelpers.mjs";
import { canvasReadyHook, createActiveEffectHook, createCombatantHook, createTokenHook, createWallHook, deleteActiveEffectHook, deleteCombatHook, deleteCombatantHook, deleteMeasuredTemplateHook, deleteWallHook, preDeleteTokenHook, preUpdateActorHook, updateActiveEffectHook, updateCombatHook, updateItemHook, updateMeasuredTemplateHook, updateWallHook } from "./lib/AAHooks.mjs";
import { AAMeasure } from "./lib/AAMeasure.mjs";
import { ActiveAuras } from "./lib/ActiveAuras.mjs";
import { CollateAuras } from "./lib/CollateAuras.mjs";
import Logger from "./lib/Logger.mjs";
import { settings } from "./settings.mjs";


/**
 *
 * @param {String} sceneID Scene to check upon
 * @param {Boolean} checkAuras Can apply auras
 * @param {Boolean} removeAuras Can remove auras
 * @param {String} source For console logging
 * @returns
 */
const debouncedCollate = debounce((a, b, c, d) => CollateAuras(a, b, c, d), 200);

export function initHooks() {
  settings();

  libWrapper.register("ActiveAuras", "ActiveEffect.prototype.apply", AAHelpers.applyWrapper, "MIXED");
  libWrapper.register(
    "ActiveAuras",
    "ActiveEffect.prototype._displayScrollingStatus",
    AAHelpers.scrollingText,
    "MIXED"
  );
}

function configureApi() {
  const API = {
    AAHelpers,
    AAMeasure,
  };
  game.modules.get(CONSTANTS.MODULE_NAME).api = API;
}

export async function readyHooks() {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM)
    ui.notifications.error("Module XYZ requires the 'libWrapper' module. Please install and activate it.");

  configureApi();

  if (game.settings.get("ActiveAuras", "debug")) CONFIG.debug.AA = true;
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }

  // determine if this user is the active gm/first active in current session
  if (game.user.isGM) {
    const currentGMUser = game.users.get(game.settings.get("ActiveAuras", "ActiveGM"));
    if ((currentGMUser && !currentGMUser.active) || !currentGMUser || currentGMUser.id === game.user.id) {
      await game.settings.set("ActiveAuras", "ActiveGM", game.user.id);
      CONFIG.AA.GM = true;
    } else {
      CONFIG.AA.GM = false;
    }
  } else {
    CONFIG.AA.GM = false;
  }


  CollateAuras(canvas.id, true, false, "readyHook");

  if (CONFIG.AA.GM) {
    Hooks.on("createToken", createTokenHook);
    // On token movement run MainAura
    Hooks.on("updateToken", createTokenHook);

    Hooks.on("preDeleteTokenHook", preDeleteTokenHook);

    Hooks.on("preUpdateActor", preUpdateActorHook);

    // On item Change for example equipped state change
    Hooks.on("updateItem", updateItemHook);
    Hooks.on("updateActiveEffect", updateActiveEffectHook);
    // On removal of active effect from linked actor, if aura remove from canvas.tokens
    Hooks.on("deleteActiveEffect", deleteActiveEffectHook);
    // On creation of active effect on linked actor, run MainAura
    Hooks.on("createActiveEffect", createActiveEffectHook)

    Hooks.on("canvasReady", canvasReadyHook);

    Hooks.on("updateCombat", updateCombatHook);
    Hooks.on("deleteCombat", deleteCombatHook);

    Hooks.on("deleteCombatant", deleteCombatantHook);
    Hooks.on("createCombatant", createCombatantHook);

  }

  Hooks.on("createWall", createWallHook);
  Hooks.on("updateWall", updateWallHook);
  Hooks.on("deleteWall", deleteWallHook);

  Hooks.on("updateMeasuredTemplate", updateMeasuredTemplateHook);
  Hooks.on("deleteMeasuredTemplate", deleteMeasuredTemplateHook);
}

export function socketLibReadyHooks() {
  setProperty(CONFIG, "AA.Socket", null);
  CONFIG.AA.Socket = socketlib.registerModule("ActiveAuras");
  CONFIG.AA.Socket.register("userCollate", CollateAuras);
}
