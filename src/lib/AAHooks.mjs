/* eslint-disable no-unused-vars */
import { AAHelpers } from "./AAHelpers.mjs";
import { ActiveAuras } from "./ActiveAuras.mjs";
import { CollateAuras } from "./CollateAuras.mjs";
import Logger from "./Logger.mjs";

/**
 *
 * @param {String} sceneID Scene to check upon
 * @param {Boolean} checkAuras Can apply auras
 * @param {Boolean} removeAuras Can remove auras
 * @param {String} source For console logging
 * @returns
 */
const debouncedCollate = debounce((a, b, c, d) => CollateAuras(a, b, c, d), 200);


export function createTokenHook(token) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  try {
    if (getProperty(token, "flags.multilevel-tokens")) return;
    for (let effect of (token.actor.effects?.contents ?? [])) {
      if (effect.flags.ActiveAuras?.isAura) {
        Logger.debug("createToken, collate auras true false");
        debouncedCollate(canvas.scene.id, true, false, "createToken");
        break;
      }
    }
  } catch (error) {
    if (error.message === "Cannot read property 'effects' of null")
      Logger.error(token, "This token has a no actor linked to it, please cleanup this token");
  }
}

export async function updateCombatHook(combat, changed, options, userId) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  if (changed.round === 1) {
    ActiveAuras.MainAura(undefined, "combat start", canvas.id);
    return;
  }
  if (!("turn" in changed)) return;
  let combatant = canvas.tokens.get(combat.current.tokenId);
  let previousCombatant = canvas.tokens.get(combat.previous.tokenId);
  await previousCombatant.document.update({ "flags.ActiveAuras": false });
  Logger.debug("updateCombat, main aura");
  await ActiveAuras.MainAura(combatant.document, "combat update", combatant.scene.id);
}

export async function preDeleteTokenHook(token) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  if (AAHelpers.IsAuraToken(token.id, token.parent.id)) {
    Logger.debug("preDelete, collate auras false true");
    AAHelpers.ExtractAuraById(token.id, token.parent.id);
  }
  await AAHelpers.removeAurasOnToken(token);
  debouncedCollate(canvas.scene.id, false, true, "deleteActiveEffect");
}

/**
 * On token movement run MainAura
 */
export async function updateTokenHook(token, update, _flags, _id) {
  Logger.debug("updateTokenHookArgs", { token: duplicate(token), update, _flags, _id, liveToken: token.object._animation });
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }

  console.warn(token)

  if ("y" in update || "x" in update || "elevation" in update) {
    // await token.object._animation;
    await CanvasAnimation.getAnimation(token.object.animationName)?.promise;
    await ActiveAuras.movementUpdate(token);
  } else if (hasProperty(update, "hidden") && (!update.hidden || AAHelpers.IsAuraToken(token.id, token.parent.id))) {
    // in v10 invisible is now a thing, so hidden is considered "not on scene"
    Logger.debug(`hidden, collate auras ${!update.hidden} ${update.hidden}`);
    debouncedCollate(canvas.scene.id, !update.hidden, update.hidden, "updateToken, hidden");
  } else if (AAHelpers.IsAuraToken(token.id, token.parent.id) && AAHelpers.EntityHPCheck(token)) {
    Logger.debug("0hp, collate auras true true");
    debouncedCollate(canvas.scene.id, false, true, "updateToken, dead");
  }
}

export function updateItemHook(item, update, _flags, _id) {
  // Logger.debug("updateItemHookArgs", { item, update, _flags, _id });
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  // check if item has active Effect with ActiveAura
  if (!item.effects.map((i) => i.flags?.ActiveAuras?.isAura).includes(true)) {
    return;
  }

  // isSuppressed Checks for dnd5e
  // dnd5e makes an effect isSuppressed when equipped or attunement status changes

  if (hasProperty(update, "system.equipped")) {
    Logger.debug("equipped, collate auras true true");
    debouncedCollate(canvas.scene.id, true, true, "updateItem, equipped");
  } else if (hasProperty(update, "system.attunement")) {
    Logger.debug("attunement, collate auras true true");
    debouncedCollate(canvas.scene.id, true, true, "updateItem, attunement");
  }
}


export function updateActiveEffectHook(effect, _update) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  if (effect.flags?.ActiveAuras?.isAura) {
    Logger.debug("updateAE, collate auras true true");
    debouncedCollate(canvas.scene.id, true, true, "updateActiveEffect");
  }
}

/**
 * On removal of active effect from linked actor, if aura remove from canvas.tokens
 */
export function deleteActiveEffectHook(effect, options) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  const applyStatus = effect.flags?.ActiveAuras?.applied;
  const auraStatus = effect.flags?.ActiveAuras?.isAura;
  const timeUpExpiry = options["expiry-reason"]?.startsWith("times-up:");

  if (!applyStatus && auraStatus && !timeUpExpiry) {
    Logger.debug("deleteActiveEffect, collate auras true false", { effect, options });
    debouncedCollate(canvas.scene.id, false, true, "deleteActiveEffect");
  } else if (auraStatus) {
    const sceneEffect = CONFIG.AA.Map.get(canvas.scene._id)?.effects.find((e) => e.data._id === effect.id);
    if (sceneEffect) AAHelpers.ExtractAuraById(sceneEffect.entityId, canvas.scene._id);
  }
}

/**
 * On creation of active effect on linked actor, run MainAura
 */
export function createActiveEffectHook(effect) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  if (!effect.flags?.ActiveAuras?.applied && effect.flags?.ActiveAuras?.isAura) {
    Logger.debug("createActiveEffect, collate auras true false", { effect });
    debouncedCollate(canvas.scene.id, true, false, "createActiveEffect");
  }
}


export function canvasReadyHook(canvas) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  Logger.debug("canvasReady, collate auras true false");
  debouncedCollate(canvas.scene.id, true, false, "ready");
}


export function preUpdateActorHook(actor, update) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  if (AAHelpers.EntityHPCheck(actor) || AAHelpers.EventHPCheck(update)) {
    Logger.debug("Actor dead, checking for tokens and auras", { actor, update });
    const activeTokens = actor.getActiveTokens();
    if (activeTokens.length > 0 && AAHelpers.IsAuraToken(activeTokens[0].id, canvas.id)) {
      Logger.debug("preUpdate0hp, collate auras true true");
      Hooks.once("updateActor", () => {
        debouncedCollate(canvas.scene.id, true, true, "updateActor, dead");
      });
    }
  }
  if ((hasProperty(update, "system.attributes.hp.value") // 5e system
    && actor.system?.attributes?.hp?.value === 0 && update.system.attributes.hp.value > 0)
   || (hasProperty(update, "system.wounds.value") // swade
     && (update.system.wounds.value - (actor.system?.wounds?.ignored ?? 0)) < (actor.system?.wounds?.max ?? 0))
  ) {
    Hooks.once("updateActor", () => {
      debouncedCollate(canvas.scene.id, true, false, "updateActor, revived");
    });
  }
}

export function deleteCombatHook(combat) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  if (game.settings.get("ActiveAuras", "combatOnly")) {
    AAHelpers.RemoveAllAppliedAuras();
  }
}

export function deleteCombatantHook(combatant) {
  if (AAHelpers.IsAuraToken(combatant.tokenId, combatant.parent.scene.id)) {
    AAHelpers.ExtractAuraById(combatant.tokenId, combatant.parent.scene.id);
  }
}

export function createCombatantHook(combat, combatant) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  if (!combat.active) return;
  combatant = canvas.tokens.get(combatant.tokenId);
  if (combatant.actor.effects?.entries) {
    for (let effect of (combatant.actor.effects?.entries ?? [])) {
      if (effect.getFlag("ActiveAuras", "isAura")) {
        Logger.debug("createToken, collate auras true false");
        debouncedCollate(combat.scene.id, true, false, "add combatant");
        break;
      }
    }
  }
}

export function createWallHook() {
  Logger.debug("createWall, collate auras false true");
  debouncedCollate(canvas.scene.id, false, true, "Wall Created");
}

export function updateWallHook() {
  Logger.debug("updateWall, collate auras true true");
  debouncedCollate(canvas.scene.id, true, true, "Wall Updated");
}

export function deleteWallHook() {
  Logger.debug("updateWall, collate auras true false");
  debouncedCollate(canvas.scene.id, true, false, "Wall Deleted");
}

export function updateMeasuredTemplateHook(data, update) {
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  if (!getProperty(data, "flags.ActiveAuras")) return;
  ActiveAuras.MainAura(undefined, "template movement", data.parent.id);
}

export function deleteMeasuredTemplateHook(doc){
  if (canvas.scene === null) {
    Logger.debug("Active Auras disabled due to no canvas");
    return;
  }
  //if (!getProperty(data, "flags.ActiveAuras")) return;
  AAHelpers.ExtractAuraById(doc.id, doc.parent.id);
  //CollateAuras(scene._id, false, true, "template deletion")
  debouncedCollate(canvas.scene.id, false, true, "deleteMeasuredTemplateHook");
}

export function preCreateActiveEffectHook(effect, _update, options) {
  if (game.settings.get("ActiveAuras", "scrollingAura")) {
    if (getProperty(effect, "flags.ActiveAuras.applied") === true) {
      options.animate = false;
    }
  }
}

export function preDeleteActiveEffectHook(effect, options) {
  if (game.settings.get("ActiveAuras", "scrollingAura")) {
    if (getProperty(effect, "flags.ActiveAuras.applied") === true) {
      options.animate = false;
    }
  }
}
