import CONSTANTS from "./constants.mjs";
import Logger from "./lib/Logger.mjs";
import { settings } from "./settings.mjs";
import { AAHelpers } from "./lib/AAHelpers.mjs";
import { AAMeasure } from "./lib/AAMeasure.mjs";
import { CollateAuras } from "./lib/CollateAuras.mjs";
import {
  canvasReadyHook,
  createActiveEffectHook,
  createCombatantHook,
  createTokenHook,
  createWallHook,
  deleteActiveEffectHook,
  deleteCombatHook,
  deleteCombatantHook,
  deleteMeasuredTemplateHook,
  deleteWallHook,
  preCreateActiveEffectHook,
  preDeleteActiveEffectHook,
  preDeleteTokenHook,
  preUpdateActorHook,
  updateActiveEffectHook,
  updateCombatHook,
  updateItemHook,
  updateMeasuredTemplateHook,
  updateTokenHook,
  updateWallHook,
} from "./lib/AAHooks.mjs";
import { ActiveAuras } from "./lib/ActiveAuras.mjs";



export function initHooks() {
  settings();

  libWrapper.ignore_conflicts(
    "ActiveAuras",
    ["dae"],
    [
      "CONFIG.ActiveEffect.documentClass.prototype.isTemporary",
      "CONFIG.ActiveEffect.documentClass.prototype.apply"
    ],
  );

  libWrapper.register("ActiveAuras", "CONFIG.ActiveEffect.documentClass.prototype.apply", AAHelpers.applyWrapper, "MIXED");

  libWrapper.register(
    "ActiveAuras",
    "ActiveEffect.prototype._displayScrollingStatus",
    AAHelpers.scrollingText,
    "MIXED"
  );
  libWrapper.register(
    "ActiveAuras",
    "CONFIG.ActiveEffect.documentClass.prototype.isTemporary",
    AAHelpers.showEffectIcon,
    "WRAPPER"
  );

}

function configureApi() {
  const API = {
    AAHelpers,
    AAMeasure,
    ActiveAuras,
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
    Hooks.on("updateToken", updateTokenHook); // On token movement run MainAura
    Hooks.on("preDeleteToken", preDeleteTokenHook);
    Hooks.on("preUpdateActor", preUpdateActorHook);
    Hooks.on("updateItem", updateItemHook); // On item Change for example equipped state change
    Hooks.on("updateActiveEffect", updateActiveEffectHook);
    Hooks.on("deleteActiveEffect", deleteActiveEffectHook); // if aura remove from canvas.tokens
    Hooks.on("createActiveEffect", createActiveEffectHook); // On creation of active effect on linked actor, run MainAura
    Hooks.on("canvasReady", canvasReadyHook);
    Hooks.on("updateCombat", updateCombatHook);
    Hooks.on("deleteCombat", deleteCombatHook);
    Hooks.on("deleteCombatant", deleteCombatantHook);
    Hooks.on("createCombatant", createCombatantHook);

    // pre update hooks for scrolling text
    if (isNewerVersion(game.version, 11)) {
      Hooks.on("preCreateActiveEffect", preCreateActiveEffectHook);
      Hooks.on("preDeleteActiveEffect", preDeleteActiveEffectHook);
    }
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
