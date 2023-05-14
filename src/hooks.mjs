/* eslint-disable no-unused-vars */
import { AAHelpers } from "./lib/AAHelpers.mjs";
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

export async function readyHooks() {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM)
    ui.notifications.error("Module XYZ requires the 'libWrapper' module. Please install and activate it.");

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

  await finalHooks();
}

export function socketLibReadyHooks() {
  CONFIG.AA.Socket = socketlib.registerModule("ActiveAuras");
  CONFIG.AA.Socket.register("userCollate", CollateAuras);
}


export function finalHooks() {
  Hooks.on("createToken", (token) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (!CONFIG.AA.GM) return;
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
  });


  Hooks.on("updateCombat", async (combat, changed, options, userId) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (changed.round === 1) {
      ActiveAuras.MainAura(undefined, "combat start", canvas.id);
      return;
    }
    if (!("turn" in changed)) return;
    if (!CONFIG.AA.GM) return;
    let combatant = canvas.tokens.get(combat.current.tokenId);
    let previousCombatant = canvas.tokens.get(combat.previous.tokenId);
    await previousCombatant.document.update({ "flags.ActiveAuras": false });
    Logger.debug("updateCombat, main aura");
    await ActiveAuras.MainAura(combatant.document, "combat update", combatant.scene.id);
  });

  Hooks.on("preDeleteToken", async (token) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (!CONFIG.AA.GM) return;
    if (AAHelpers.IsAuraToken(token.id, token.parent.id)) {
      Logger.debug("preDelete, collate auras false true");
      AAHelpers.ExtractAuraById(token.id, token.parent.id);
    }
    AAHelpers.removeAurasOnToken(token);
  });

  /**
   * On token movement run MainAura
   */
  Hooks.on("updateToken", async (token, update, _flags, _id) => {
    Logger.debug("updateTokenHookArgs", { token: duplicate(token), update, _flags, _id });
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }

    if (!CONFIG.AA.GM) return;
    if ("y" in update || "x" in update || "elevation" in update) {
      // we need to wait for the movement to finish due to the animation in v10, listen to refresh hook
      Logger.debug("creatingAAUpdateTokenHook", { token: duplicate(token), update, _flags, _id });

      if (_flags.animate === false) {
        await ActiveAuras.movementUpdate(token);
      } else {
        const moveHookId = Hooks.on("refreshToken", async (rToken) => {
          if (
            rToken.id !== token.id
            || ("x" in update && rToken.x !== update.x)
            || ("y" in update && rToken.y !== update.y)
            || ("elevation" in update && rToken.document.elevation !== update.elevation)
          )
            return;
          Hooks.off("refreshToken", moveHookId);
          await ActiveAuras.movementUpdate(token);
        });
        // await movementUpdate();
      }
    } else if (hasProperty(update, "hidden") && (!update.hidden || AAHelpers.IsAuraToken(token.id, token.parent.id))) {
      // in v10 invisible is now a thing, so hidden is considered "not on scene"
      Logger.debug(`hidden, collate auras ${!update.hidden} ${update.hidden}`);
      debouncedCollate(canvas.scene.id, !update.hidden, update.hidden, "updateToken, hidden");
    } else if (AAHelpers.IsAuraToken(token.id, token.parent.id) && AAHelpers.EntityHPCheck(token)) {
      Logger.debug("0hp, collate auras true true");
      debouncedCollate(canvas.scene.id, false, true, "updateToken, dead");
    }
  });

  /**
   * On item Change for example equipped state change
   */
  Hooks.on("updateItem", (item, update, _flags, _id) => {
    Logger.debug("updateItemHookArgs", { item, update, _flags, _id });
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (!CONFIG.AA.GM) return;
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
  });

  /**
   */

  Hooks.on("updateActiveEffect", (effect, _update) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (!CONFIG.AA.GM) return;
    if (effect.flags?.ActiveAuras?.isAura) {
      Logger.debug("updateAE, collate auras true true");
      debouncedCollate(canvas.scene.id, true, true, "updateActiveEffect");
    }
  });

  /**
   * On removal of active effect from linked actor, if aura remove from canvas.tokens
   */
  Hooks.on("deleteActiveEffect", (effect, options) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (!CONFIG.AA.GM) return;
    const applyStatus = effect.flags?.ActiveAuras?.applied;
    const auraStatus = effect.flags?.ActiveAuras?.isAura;
    const timeUpExpiry = options["expiry-reason"]?.startsWith("times-up:");

    if (!applyStatus && auraStatus && !timeUpExpiry) {
      Logger.debug("deleteActiveEffect, collate auras true false", { effect, options });
      debouncedCollate(canvas.scene.id, false, true, "deleteActiveEffect");
    }
  });

  /**
   * On creation of active effect on linked actor, run MainAura
   */
  Hooks.on("createActiveEffect", (effect) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (!CONFIG.AA.GM) return;
    if (!effect.flags?.ActiveAuras?.applied && effect.flags?.ActiveAuras?.isAura) {
      Logger.debug("createActiveEffect, collate auras true false", { effect });
      debouncedCollate(canvas.scene.id, true, false, "createActiveEffect");
    }
  });

  Hooks.on("canvasReady", (canvas) => {
    if (!CONFIG.AA.GM) return;
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    Logger.debug("canvasReady, collate auras true false");
    debouncedCollate(canvas.scene.id, true, false, "ready");
  });

  Hooks.on("preUpdateActor", (actor, update) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (AAHelpers.EntityHPCheck(actor) || AAHelpers.EventHPCheck(update)) {
      Logger.debug("Actor dead, checking for tokens and auras", { actor, update });
      const activeTokens = actor.getActiveTokens();
      if (activeTokens.length > 0 && AAHelpers.IsAuraToken(activeTokens[0].id, canvas.id)) {
        Logger.debug("preUpdate0hp, collate auras true true");
        Hooks.once("updateActor", (a, b) => {
          if (!CONFIG.AA.GM) return;
          debouncedCollate(canvas.scene.id, true, true, "updateActor, dead");
        });
      }
    }
    if ((hasProperty(update, "system.attributes.hp.value")
      && actor.system?.attributes?.hp?.value === 0 && update.system.attributes.hp.value > 0)
     || ((hasProperty(update, "system.wounds.value")
       && (update.system.wounds.value - (actor.system?.wounds?.ignored ?? 0)) < (actor.system?.wounds?.max ?? 0)))
    ) {
      Hooks.once("updateActor", () => {
        if (!CONFIG.AA.GM) return;
        debouncedCollate(canvas.scene.id, true, false, "updateActor, revived");
      });
    }
  });

  Hooks.on("updateMeasuredTemplate", (data, update) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (!getProperty(data, "flags.ActiveAuras")) return;
    ActiveAuras.MainAura(undefined, "template movement", data.parent.id);
  });

  Hooks.on("deleteMeasuredTemplate", (doc) => {
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    //if (!getProperty(data, "flags.ActiveAuras")) return;
    AAHelpers.ExtractAuraById(doc.id, doc.parent.id);
    //CollateAuras(scene._id, false, true, "template deletion")
  });

  Hooks.on("deleteCombat", (combat) => {
    if (!CONFIG.AA.GM) return;
    if (canvas.scene === null) {
      Logger.debug("Active Auras disabled due to no canvas");
      return;
    }
    if (game.settings.get("ActiveAuras", "combatOnly")) {
      AAHelpers.RemoveAllAppliedAuras();
    }
  });

  Hooks.on("deleteCombatant", (combatant) => {
    if (!CONFIG.AA.GM) return;
    if (AAHelpers.IsAuraToken(combatant.tokenId, combatant.parent.scene.id)) {
      AAHelpers.ExtractAuraById(combatant.tokenId, combatant.parent.scene.id);
    }
  });

  Hooks.on("createCombatant", (combat, combatant) => {
    if (!CONFIG.AA.GM) return;
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
  });

  Hooks.on("createWall", () => {
    Logger.debug("createWall, collate auras false true");
    debouncedCollate(canvas.scene.id, false, true, "Wall Created");
  });
  Hooks.on("updateWall", () => {
    Logger.debug("updateWall, collate auras true true");
    debouncedCollate(canvas.scene.id, true, true, "Wall Updated");
  });
  Hooks.on("deleteWall", () => {
    Logger.debug("updateWall, collate auras true false");
    debouncedCollate(canvas.scene.id, true, false, "Wall Deleted");
  });

}
