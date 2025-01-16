import { AAHelpers } from "./AAHelpers.mjs";
import { AAMeasure } from "./AAMeasure.mjs";
import { AATemplates } from "./AATemplates.js";
import Logger from "./Logger.mjs";

export class ActiveAuras {
  /**
   *
   * @param {Token} movedToken - optional value for further extension, currently unused
   * Locate all auras on the canvas, create map of tokens to update, update tokens
   */
  static async MainAura(movedToken, source, sceneID) {
    Logger.debug("MainAura Params", { movedToken, source, sceneID });
    const perfStart = CONFIG.debug.AA ? performance.now() : undefined;

    if (typeof movedToken?.documentName !== "string") movedToken = movedToken?.document ?? undefined;
    if (!CONFIG.AA.GM) return;
    const sceneCombat = game.combats.filter((c) => c.scene?.id === sceneID);
    if (game.settings.get("ActiveAuras", "combatOnly") && !sceneCombat[0]?.started) {
      Logger.debug("Active Auras not active when not in combat");
      return;
    }
    if (sceneID !== canvas.id) {
      ui.notifications.warn(
        "An update was called on a non viewed scene, auras will be updated when you return to that scene"
      );
      return;
    }

    let updateTokens = canvas.tokens.placeables;
    let auraTokenId;

    if (movedToken !== undefined) {
      if (AAHelpers.IsAuraToken(movedToken.id, sceneID)) {
        auraTokenId = movedToken.id;
      }
      else if (foundry.utils.getProperty(movedToken, "flags.token-attacher")) {
        Logger.debug("ActiveAuras: token attacher movement");
      }
      else {
        updateTokens = [canvas.tokens.get(movedToken.id)];
      }
    }

    // console.warn("MainAura prep", {
    //   updateTokens,
    //   updateTokenNames: updateTokens.map((t) => t.name),
    //   auraTokenId,
    // });

    const rawMap = ActiveAuras.UpdateAllTokens(new Map(), updateTokens, auraTokenId);

    if (CONFIG.debug.AA) {
      Logger.info(`Active Auras Find Auras took ${performance.now() - perfStart} ms, FPS:${Math.round(canvas.app.ticker.FPS)}`);
    }

    const effectMap = new Map();
    for (const mapEffect of rawMap) {
      effectMap.set(mapEffect[0], {
        add: mapEffect[1].add,
        token: mapEffect[1].token,
        effect: mapEffect[1].effect.data,
        canvasTokenId: mapEffect[1].canvasTokenId,
        auraEntityId: mapEffect[1].auraEntityId,
        effectName: mapEffect[1].effectName,
      });
    }
    if (CONFIG.debug.AA) {
      Logger.debug("Active Aura Effect map", {
        rawMap: foundry.utils.deepClone(rawMap),
        effectMap: foundry.utils.deepClone(effectMap),
      });
    }

    // Loop over the map to remove any "add.false" entries where a "add.true" is present,
    // prevents odd ordering from removing auras when in range of 2 or more of the same aura
    // Where 2 of the same type of aura are present, choose the higher of the 2 values to update too
    effectMap.forEach((value, key, map1) => {
      const iterator1 = map1[Symbol.iterator]();
      for (const m of iterator1) {
        if (m[0] === key) continue;

        if (!map1.has(key)) continue;
        // token entities don't match match
        if (m[1].canvasTokenId !== value.canvasTokenId) continue;
        if (
          m[1].effect.name === value.effect.name // names match
          && m[1].add === true && value.add === true // both add
        ) {
          let deleteKey = false;
          for (let e = 0; e < m[1].effect.changes.length; e++) {
            const effectKey = m[1].effect.changes[e].key;
            const newEffectValue = parseInt(m[1].effect.changes[e].value);
            // unable to determine evaluation condition
            if (typeof newEffectValue !== "number") continue;
            if (value.effect.changes.length < e) continue;
            const oldChange = value.effect.changes.find((c) => c.key === effectKey);
            const oldEffectValue = parseInt(oldChange?.value ?? 0);
            if (typeof oldEffectValue !== "number") {
              deleteKey = true;
              break;
            }
            // if (oldEffectValue === newEffectValue && value.auraEntityId === value.canvasTokenId) continue;
            if (oldEffectValue <= newEffectValue) {
              deleteKey = true;
              break;
            }
          }
          if (deleteKey) map1.delete(key);
        } else if (
          m[1].effect.name === value.effect.name // names match
          && (m[1].add === true || value.add === true) // one of them adds
          // && m[1].token.id === value.token.id // tokens match
          && m[1].auraEntityId === value.auraEntityId // aura entities match
          && m[1].canvasTokenId === value.canvasTokenId // token entities match
        ) {
          if (value.add === false) {
            map1.delete(key);
          }
        } else if (
          m[1].effect.name === value.effect.name // names match
          && (m[1].add === true || value.add === true) // one of them adds
        ) {
          Logger.debug("There is a delete effect match that wasn't handled", {
            m,
            value,
            key,
            map1,
          });
        }
      }
    });

    // remove all effects first to prevent issues with DAE where it will attempt to remove a duplicate
    const removeResults = [];
    for (const update of effectMap) {
      if (update[1].add === false) {
        removeResults.push(ActiveAuras.RemoveActiveEffects(update[1].token.id, update[1].effect.origin));
      }
    }
    await Promise.all(removeResults);
    const createResults = [];
    for (const update of effectMap) {
      if (update[1].add) {
        createResults.push(ActiveAuras.CreateActiveEffect(update[1].token.id, update[1].effect));
      }
    }
    await Promise.all(createResults);
    if (CONFIG.debug.AA) {
      Logger.debug(
        `Active Auras Main Function took ${performance.now() - perfStart} ms, FPS:${Math.round(canvas.app.ticker.FPS)}`
      );
    }
  }

  /**
   * Test individual token against aura array
   * @param {Map} map - empty map to populate
   * @param {Array} auraEffectArray - array of auras to test against
   * @param {Token} canvasToken - single token to test
   */
  static UpdateToken(map, canvasToken, tokenId) {
    if (canvasToken.document.flags["multilevel-tokens"]) return;
    if (canvasToken.actor === null) return;
    if (canvasToken.actor.type == "vehicle" || canvasToken.actor.type == "group") return;
    let tokenAlignment;
    if (game.system.id === "dnd5e" || game.system.id === "sw5e") {
      try {
        tokenAlignment = canvasToken.actor?.system?.details?.alignment?.toLowerCase();
      } catch (error) {
        Logger.error(["ActiveAuras: the token has an unreadable alignment", canvasToken]);
      }
    }
    const MapKey = canvasToken.scene.id;
    let MapObject = CONFIG.AA.Map.get(MapKey);
    let checkEffects = MapObject.effects;
    //Check for other types of X aura if the aura token is moved
    // console.warn(`ActiveAuras UpdateToken ${tokenId}`, {
    //   tokenMatch: tokenId && canvasToken.id !== tokenId,
    //   tokenId,
    //   checkEffects,
    //   canvasToken,
    // });
    if (tokenId && canvasToken.id !== tokenId) {
      checkEffects = checkEffects.filter((i) => i.entityId === tokenId);
      let duplicateEffect = [];
      checkEffects.forEach((e) =>
        (duplicateEffect = MapObject.effects.filter((i) => i.data?.name === e.data?.name && i.entityId !== tokenId))
      );
      checkEffects = checkEffects.concat(duplicateEffect);
    }

    // console.warn("ActiveAura UpdateToken Map details", {
    //   MapKey,
    //   MapObject,
    //   checkEffects,
    //   tokenAlignment,
    // });

    for (const auraEffect of checkEffects) {
      const auraTargets = auraEffect.data.flags?.ActiveAuras?.aura;

      const { radius, height, hostile, wildcard, extra } = (auraEffect.data.flags?.ActiveAuras ?? {});
      let { type, alignment, customCheck, wallsBlock } = (auraEffect.data.flags?.ActiveAuras ?? {});
      alignment = alignment?.toLowerCase() ?? "";
      customCheck = customCheck?.trim() ?? "";
      type = type?.toLowerCase() ?? "";
      wallsBlock = wallsBlock?.toLowerCase() ?? "system";

      // console.warn(`Checking aura ${auraEffect.data.name}`, {
      //   auraEffect,
      //   auraTargets,
      //   alignment,
      //   wallsBlock,
      // });

      if (alignment && !tokenAlignment.includes(alignment) && !tokenAlignment.includes("any")) continue;
      if (wallsBlock !== "system") {
        wallsBlock = wallsBlock === "true";
      } else {
        wallsBlock = game.settings.get("ActiveAuras", "wall-block");
      }

      let auraEntity, distance;

      switch (auraEffect.entityType) {
        //{data: testEffect.data, parentActorLink :testEffect.parent.data.token.actorLink, parentActorId : testEffect.parent._id, tokenId: testToken.id, templateId: template._id, }
        case "token":
          {
            if (auraEffect.parentActorLink) {
              const auraTokenArray = game.actors.get(auraEffect.parentActorId).getActiveTokens();
              if (auraTokenArray.length > 1) {
                auraEntity = auraTokenArray[0];
                Logger.error("AA: Duplicate Linked Tokens detected, defaulting to first token.");
              } else auraEntity = auraTokenArray[0];
            } else auraEntity = canvas.tokens.get(auraEffect.entityId);

            const ignoreSelf = foundry.utils.getProperty(auraEffect.data, "flags.ActiveAuras.ignoreSelf");
            if (auraEntity.id === canvasToken.id && ignoreSelf) {
              Logger.debug(`Ignoring effect "${auraEffect.data.name}" for self`, { ignoreSelf, auraEffect, canvasToken: canvasToken.name });
              continue;
            }

            if (
              !AAHelpers.DispositionCheck(
                auraTargets,
                auraEntity.document.disposition,
                canvasToken.document.disposition
              )
            )
              continue;
            if (type && !AAHelpers.CheckTypes(canvasToken, type)) continue;
            if (hostile && canvasToken.id !== game.combats.active?.current.tokenId) continue;
            if (game.system.id === "swade" && !AAHelpers.Wildcard(canvasToken, wildcard, extra)) continue;

            if (auraEntity.id === canvasToken.id) {
              distance = true;
            } else {
              const tokenRadius = AAHelpers.EvaluateRollString({ rollString: radius, token: auraEntity });
              const shape = AATemplates.getAuraShape(auraEntity, tokenRadius);

              // console.warn(`Shape Check`, {
              //   shape,
              //   auraEntity,
              //   tokenRadius,
              //   inAura: AAMeasure.inAura(canvasToken, auraEntity, wallsBlock, height, tokenRadius, shape),
              // });
              distance = AAMeasure.inAura(
                canvasToken,
                auraEntity,
                wallsBlock,
                height,
                tokenRadius,
                shape,
              );
            }
          }
          break;
        case "template":
          {
            auraEntity = canvas.templates.get(auraEffect.entityId);

            if (type && !AAHelpers.CheckTypes(canvasToken, type)) continue;
            if (hostile && canvasToken.id !== game.combats.active.current.tokenId) return;
            if (auraEffect.casterDisposition) {
              if (!AAHelpers.DispositionCheck(auraTargets, auraEffect.casterDisposition, canvasToken.document.disposition))
                continue;
            }
            // const shape = AATemplates.getTemplateShape(auraEntity);
            let templateDetails = auraEntity;
            //templateDetails.shape = shape
            distance = AAMeasure.isTokenInside(
              templateDetails,
              canvasToken,
              wallsBlock
            );
          }
          break;
        case "drawing":
          {
            auraEntity = canvas.drawings.get(auraEffect.entityId);
            if (type && !AAHelpers.CheckTypes(canvasToken, type)) continue;
            if (hostile && canvasToken.id !== game.combats.active.current.tokenId) return;

            const shape = AATemplates.getDrawingShape(auraEntity);
            distance = AAMeasure.inAura(
              canvasToken,
              auraEntity,
              wallsBlock,
              height,
              radius,
              shape
            );

          }
          break;
      }
      const rename = foundry.utils.getProperty(auraEffect.data, "flags.ActiveAuras.nameOverride");
      const effectName = (rename && rename.trim() !=="") ? rename : `${auraEffect.data.name} (In Aura)`;

      const MapKey = auraEffect.data.origin + "-" + canvasToken.id + "-" + auraEntity.id + "-" + effectName;
      MapObject = map.get(MapKey);

      if (CONFIG.debug.AA) {
        Logger.debug(`Evaluating aura ${effectName} from ${auraEntity.id}`, {
          MapObject, auraEffect, canvasToken, auraEntity, MapKey, distance
        });
      }

      if (distance && !auraEffect.data.flags?.ActiveAuras?.Paused) {
        if (customCheck && !AAHelpers.evaluateCustomCheck(canvasToken, customCheck, auraEntity)) continue;
        if (MapObject) {
          MapObject.add = true;
        } else {
          map.set(MapKey, { add: true, token: canvasToken, effect: auraEffect, canvasTokenId: canvasToken.id, auraEntityId: auraEntity.id, effectName });
        }
      } else if (
        !MapObject?.add
        && Array.from(canvasToken.document.actor?.allApplicableEffects() ?? []).some(
          (e) => e.origin === auraEffect.data.origin && e.name === effectName
        )
      ) {
        if (MapObject) {
          MapObject.add = false;
        } else {
          map.set(MapKey, { add: false, token: canvasToken, effect: auraEffect, canvasTokenId: canvasToken.id, auraEntityId: auraEntity.id, effectName });
        }
      }
    }
    return map;
  }

  /**
   * Loop over canvas tokens for individual tests
   * @param {Map} map - empty map to populate
   * @param {Array} auraEffectArray - array of auras to test against
   * @param {Token} tokens - array of tokens to test against
   */
  static UpdateAllTokens(map, tokens, tokenId) {
    for (const canvasToken of tokens) {
      // if (CONFIG.debug.AA) console.log("Updating canvas token", {canvasToken, tokenId});
      ActiveAuras.UpdateToken(map, canvasToken, tokenId);
    }
    return map;
  }

  /**
   *
   * @param {string} tokenID - tokenId to apply effect too
   * @param {ActiveEffect} effectData - effect data to generate effect
   */
  static async CreateActiveEffect(tokenID, effectData) {
    const token = canvas.tokens.get(tokenID);

    const rename = foundry.utils.getProperty(effectData, "flags.ActiveAuras.nameOverride");
    const effectName = (rename && rename.trim() !== "") ? rename : `${effectData.name} (In Aura)`;

    const duplicateEffect = Array.from(token.document.actor.allApplicableEffects()).find((e) =>
      e.origin === effectData.origin && e.name === effectName
    );
    if (foundry.utils.getProperty(duplicateEffect, "flags.ActiveAuras.isAura")) return;
    if (duplicateEffect) {
      // console.warn(`${token.name} ${tokenID} Duplicate Effect found for ${effectData.name}`, {
      //   duplicateEffect,
      //   effectData,
      //   effectName,
      //   token,
      //   origin: effectData.origin,
      // })
      if (duplicateEffect.origin === effectData.origin) return;
      if (JSON.stringify(duplicateEffect.changes) === JSON.stringify(effectData.changes)) return;
      else {
        Logger.debug("Removing and recreating updated effect");
        await ActiveAuras.RemoveActiveEffects(tokenID, effectData.origin);
      }
    }
    // else {
    //   console.warn(`${token.name} ${tokenID} No duplicate Effects found for ${effectData.name}`, {
    //     token,
    //     effects: Array.from(token.document.actor.allApplicableEffects()),
    //     effectData
    //   })
    // }

    let newEffectData = foundry.utils.duplicate(effectData);
    newEffectData.name = effectName;

    if (newEffectData.flags.ActiveAuras.onlyOnce) {
      const AAID = effectData.origin.replaceAll(".", "");
      if (token.document.flags.ActiveAuras?.[AAID]) return;
      else await token.document.setFlag("ActiveAuras", AAID, true);
    }
    if (newEffectData.flags.ActiveAuras?.isMacro) {
      // eslint-disable-next-line no-unused-vars
      for (let [changeIndex, change] of newEffectData.changes.entries()) {
        let newValue = change.value;
        if (change.key.startsWith("macro.")) {
          if (typeof newValue === "string") {
            newValue = [newValue];

            newValue = newValue.map((val) => {
              if (typeof val === "string" && val.includes("@@token")) {
                let re = /([\s]*@@token)/gms;
                return val.replaceAll(re, " @token");
              } else if (typeof val === "string" && val.includes("@token")) {
                let re = /([\s]*@token)/gms;
                return val.replaceAll(re, ` ${token.id}`);
              }
              return val;
            });
            if (typeof change.value === "string") {
              change.value = newValue[0];
            } else {
              change.value = newValue;
            }
          }
        }
      }
    }
    ["ignoreSelf", "hidden", "height", "alignment", "type", "aura", "radius", "isAura", "height"].forEach(
      (e) => delete newEffectData.flags.ActiveAuras[e]
    );
    if (
      newEffectData.flags.ActiveAuras.time !== "None"
      && newEffectData.flags.ActiveAuras.time !== undefined
      && game.modules.get("dae")?.active
    ) {
      newEffectData.flags.dae?.specialDuration?.push(newEffectData.flags.ActiveAuras.time);
    }

    await token.actor.createEmbeddedDocuments("ActiveEffect", [newEffectData]);
    Logger.debug(game.i18n.format("ACTIVEAURAS.ApplyLog", {
      effectDataName: newEffectData.name,
      tokenName: token.name,
      effectData: newEffectData,
    }));
  }

  /**
   * @param {String} tokenID - token instance to remove effect from
   * @param {String} effectOrigin - origin of effect to remove
   */
  static async RemoveActiveEffects(tokenID, effectOrigin) {
    const token = canvas.tokens.get(tokenID);
    const tokenEffects = Array.from(token.actor?.allApplicableEffects() ?? []);
    for (const tokenEffect of tokenEffects) {
      if (tokenEffect.origin === effectOrigin && tokenEffect.flags?.ActiveAuras?.applied === true) {
        try {
          if (token.actor.getEmbeddedDocument("ActiveEffect", tokenEffect.id)) {
            Logger.debug("RemoveActiveEffects", { token, tokenEffects: tokenEffect });
            await token.actor.deleteEmbeddedDocuments("ActiveEffect", [tokenEffect.id]);
          }
        } catch (err) {
          Logger.error("ERROR CAUGHT in RemoveActiveEffects", err);
        } finally {
          Logger.debug(
            game.i18n.format("ACTIVEAURAS.RemoveLog", { effectDataName: effectOrigin, tokenName: token.name })
          );
        }
      }
    }
  }

  static async movementUpdate(token) {
    let MapObject = CONFIG.AA.Map.get(token.parent.id);
    if (!MapObject || MapObject?.effects.length < 1) return;
    Logger.debug("movement, main aura");
    await ActiveAuras.MainAura(token, "movement update", token.parent.id);
  }
}
