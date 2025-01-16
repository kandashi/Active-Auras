import CONSTANTS from "../constants.mjs";
import Logger from "./Logger.mjs";

export class AAHelpers {

  static evaluateCustomCheck(token, check, auraEntity) {
    try {
      // console.warn("custom check", { token, check, auraEntity });
      // these are exposed here so they can by used in the custom check/eval
      // eslint-disable-next-line no-unused-vars
      const actor = token.actor;
      // eslint-disable-next-line no-unused-vars
      const system = token.actor?.system;
      // eslint-disable-next-line no-unused-vars
      const rollData = token.actor?.getRollData();
      // console.warn("custom check", { token, check, actor, system, rollData });
      const result = Boolean(eval(check));
      return result;
    } catch (e) {
      Logger.warn(`Custom check failed: ${check}`, { e, token, check, auraEntity });
    }
    return false;
  }

  static drawSquare(point) {
    const { x, y } = point;
    const g = new PIXI.Graphics();
    g.beginFill(0xff0000, 0.2).drawRect(x - 5, y - 5, 10, 10);
    const aura = canvas.layers.find((l) => l.name === "DrawingsLayer").addChild(g);
    aura.squares = true;
  }

  /**
   *
   * @param {*} token
   * @param {*} sceneID
   * @returns
   */
  static IsAuraToken(tokenID, sceneID) {
    const MapObject = CONFIG.AA.Map.get(sceneID);
    if (!MapObject?.effects) return false;
    for (const effect of MapObject.effects) {
      if (effect.entityId === tokenID) return true;
    }
    return false;
  }

  static getActorFromAAEffectData(effectData) {
    const originActor = fromUuidSync(effectData.data.origin)?.parent;
    if (originActor) return originActor;

    const parts = (effectData.origin ?? effectData.data.origin).split(".");
    // eslint-disable-next-line no-unused-vars
    const [entityName, entityId, embeddedName, embeddedId] = parts;
    const actor = game.actors.get(entityId);
    return actor;
  }

  static DispositionCheck(auraTargets, auraDis, tokenDis) {
    switch (auraTargets) {
      case "Allies": {
        if (auraDis !== tokenDis) return false;
        else return true;
      }
      case "Enemy": {
        if (auraDis === tokenDis) return false;
        else return true;
      }
      case "All":
        return true;
    }
  }

  static CheckType(canvasToken, type) {
    switch (game.system.id) {
      case "dnd5e":
      case "sw5e":
        return AAHelpers.typeCheck5e(canvasToken, type);
      case "swade":
        return AAHelpers.typeCheckSWADE(canvasToken, type);
      case "dnd4e":
        return AAHelpers.typeCheck4e(canvasToken, type);
    }
  }

  static CheckTypes(canvasToken, types) {
    if (!types || types === "") return true;
    const typesArray = Array.isArray(types)
      ? types
      : types?.toLowerCase().replaceAll(",", ";").split(";").map((t) => t.trim()) ?? [];

    let match = false;
    for (const type of typesArray) {
      if (AAHelpers.CheckType(canvasToken, type)) {
        match = true;
        break;
      }
    }
    return match;
  }

  static typeCheck5e(canvasToken, type) {
    if (type?.trim() === "any") return true;
    const systemData = canvasToken?.actor?.system;
    let tokenTypes;
    switch (canvasToken.actor.type) {
      case "npc":
        {
          try {
            tokenTypes = Array.from(new Set([
              systemData?.details.type.value,
              systemData?.details.type.subtype,
              systemData?.details.type.custom,
            ])).filter((t) => t);
          } catch (error) {
            Logger.error("ActiveAuras: the token has an unreadable type", canvasToken);
          }
        }
        break;
      case "character":
        {
          try {
            if (game.system.id === "sw5e") {
              tokenTypes = [systemData?.details.species.toLowerCase()];
            } else{
              tokenTypes = Array.from(new Set([
                (systemData?.details?.race?.name ?? systemData?.details?.race)?.toLocaleLowerCase(),
                (systemData?.details?.race?.name ?? systemData?.details?.race)?.toLocaleLowerCase().replace("-", " ").split(" "),
                systemData?.details.type?.value?.toLocaleLowerCase(),
                systemData?.details.type?.subtype?.toLocaleLowerCase(),
                systemData?.details.type?.custom?.toLocaleLowerCase(),
              ].flat())).filter((t) => t);
            }
          } catch (error) {
            Logger.error("ActiveAuras: the token has an unreadable type", canvasToken);
          }
        }
        break;
      case "group":
      case "vehicle":
        return;
    }

    if (tokenTypes.includes(type)) return true;

    // remaining humanoid checks only npcs in 5e or all in sw5e
    if (type.trim() !== "humanoid") return false;
    if (canvasToken.actor.type !== "character" && game.system.id === "dnd5e") return false;
    const humanoidRaces = game.system.id === "sw5e"
      ? CONSTANTS.SW5E_HUMANOID_RACES
      : CONSTANTS.HUMANOID_RACES;

    let match = false;
    for (const x of tokenTypes) {
      if (humanoidRaces.includes(x)) {
        match = true;
        break;
      }
    }
    return match;
  }

  static typeCheckSWADE(canvasToken, type) {
    let tokenType;
    switch (canvasToken.actor.type) {
      case "npc":
        {
          try {
            tokenType = canvasToken.actor?.system.details.species.name.toLowerCase();
          } catch (error) {
            Logger.error("ActiveAuras: the token has an unreadable type", canvasToken);
          }
        }
        break;
      case "character":
        {
          try {
            tokenType = canvasToken.actor?.system.details.species.name.toLowerCase();
          } catch (error) {
            Logger.error("ActiveAuras: the token has an unreadable type", canvasToken);
          }
        }
        break;
      case "vehicle":
        return;
    }
    return tokenType === type;
  }

  static typeCheck4e(canvasToken, type) {
    let tokenType;
    switch (canvasToken.actor.type) {
      case "NPC":
        {
          try {
            tokenType = [
              canvasToken.actor?.system.details.type,
              canvasToken.actor?.system.details.other,
              canvasToken.actor?.system.details.origin,
            ];
          } catch (error) {
            Logger.error("ActiveAuras: the token has an unreadable type", canvasToken);
          }
        }
        break;
      case "Player Character":
        {
          try {
            tokenType = ["humanoid"]; //Will update this later after adding detailed info to PCs
          } catch (error) {
            Logger.error("ActiveAuras: the token has an unreadable type", canvasToken);
          }
        }
        break;
      case "group":
      case "vehicle":
        return;
    }
    if (tokenType.includes(type)) return true;
    return false;
  }

  static Wildcard(canvasToken, wildcard, extra) {
    if (game.system.id !== "swade") return true;
    let Wild = canvasToken.actor.isWildcard;
    if (Wild && wildcard) return true;
    else if (!Wild && extra) return true;
    else return false;
  }

  static HPCheck(document) {
    switch (game.system.id) {
      case "dnd5e":
      case "sw5e": {
        if (foundry.utils.getProperty(document, "system.attributes.hp.max") === 0) return true; // dead
        if (foundry.utils.getProperty(document, "system.attributes.hp.value") > 0) return false;
        //alive!
        else return true; // dead
      }
      case "swade": {
        const { max, value, ignored } = document.system.wounds;
        if (value === 0) return false; // no wounds taken
        if ((value - ignored) >= max) return true;
        // dead
        else return false;
      }
    }
  }

  static EntityHPCheck(entity) {
    const actor = (entity.collectionName === "actors")
      ? entity
      : entity.actor;
    return AAHelpers.HPCheck(actor);
  }

  static EventHPCheck(event) {
    // if this is not a hp/wound check then assume not dead
    if (!foundry.utils.hasProperty(event, "system.wounds") && !foundry.utils.getProperty(event, "system.attributes.hp")) {
      return false;
    }
    return AAHelpers.HPCheck(event);
  }

  static GetRollData({ actor, item, deterministic = false } = {}) {
    if (!actor) return null;
    const actorRollData = actor.getRollData({ deterministic });
    const rollData = {
      ...actorRollData,
      item: item ? item.toObject().system : undefined,
    };

    // Include an ability score modifier if one exists
    const abl = item?.abilityMod;
    if (abl && "abilities" in rollData) {
      const ability = rollData.abilities[abl];
      if (!ability) {
        Logger.warn(`Item ${actor.name} in Actor ${actor.name} has an invalid item ability modifier of ${abl} defined`);
      }
      rollData.mod = ability?.mod ?? 0;
    }
    return rollData;
  }

  static EvaluateRollString({ rollString, token, item, deterministic = false } = {}) {
    if (Number.isInteger(Number.parseInt(`${rollString}`.trim()))) return rollString;

    const actor = token.actor ?? token.parent;

    const rollData = AAHelpers.GetRollData({ actor, item, deterministic });
    return Roll.replaceFormulaData(rollString, rollData);
  }

  static ExtractAuraById(entityId, sceneID) {
    if (!CONFIG.AA.GM) return;
    const MapObject = CONFIG.AA.Map.get(sceneID);
    const effectArray = MapObject.effects.filter((e) => e.entityId !== entityId);
    CONFIG.AA.Map.set(sceneID, { effects: effectArray });
    Logger.debug("ExtractAuraById", { AuraMap: CONFIG.AA.Map });
    // AAHelpers.RemoveAppliedAuras();
  }

  static async RemoveAppliedAuras() {
    const MapObject = CONFIG.AA.Map.get(canvas.scene.id);
    const EffectsArray = MapObject.effects.map((i) => i.data.origin);

    Logger.debug("RemoveAppliedAuras", { MapKey: canvas.scene.id, MapObject, EffectsArray });

    for (let removeToken of canvas.tokens.placeables) {
      const tokenEffects = Array.from(removeToken?.actor?.allApplicableEffects() ?? []);
      if (tokenEffects.length > 0) {
        for (let testEffect of tokenEffects) {
          if (!EffectsArray.includes(testEffect.origin) && testEffect?.flags?.ActiveAuras?.applied) {
            try {
              Logger.debug("RemoveAppliedAuras", { removeToken, testEffect });
              await removeToken.actor.deleteEmbeddedDocuments("ActiveEffect", [testEffect._id]);
            } catch (err) {
              Logger.error("ERROR CAUGHT in RemoveAppliedAuras", err);
            } finally {
              Logger.info(
                game.i18n.format("ACTIVEAURAS.RemoveLog", {
                  effectDataName: testEffect.name,
                  tokenName: removeToken.name,
                })
              );
            }
          }
        }
      }
    }
  }

  static async RemoveAllAppliedAuras() {
    for (let removeToken of canvas.tokens.placeables) {
      const tokenEffects = Array.from(removeToken?.actor?.allApplicableEffects() ?? []);
      if (tokenEffects.length > 0) {
        let effects = tokenEffects.reduce((a, v) => {
          if (v?.flags?.ActiveAuras?.applied) return a.concat(v.id);
          else return a;
        }, []);
        try {
          Logger.debug("RemoveAllAppliedAuras", { removeToken, effects });
          await removeToken.actor.deleteEmbeddedDocuments("ActiveEffect", effects);
        } catch (err) {
          Logger.error("ERROR CAUGHT in RemoveAllAppliedAuras", err);
        } finally {
          Logger.info(
            game.i18n.format("ACTIVEAURAS.RemoveLog", {
              tokenName: removeToken.name,
            })
          );
        }
      }
    }
  }

  static async UserCollateAuras(sceneID, checkAuras, removeAuras, source) {
    CONFIG.AA.GM = game.users.find((u) => u.isGM && u.active);
    await CONFIG.AA.Socket.executeAsUser("userCollate", CONFIG.AA.GM.id, sceneID, checkAuras, removeAuras, source);
  }

  /**
   * Bind a filter to the ActiveEffect.apply() prototype chain
   */

  static applyWrapper(wrapped, ...args) {
    let actor = args[0];
    let change = args[1];
    const AAFlags = foundry.utils.getProperty(change, "effect.flags.ActiveAuras");
    if (!AAFlags) return wrapped(...args);
    if (AAFlags.isAura || AAFlags.ignoreSelf) {
      Logger.info(
        game.i18n.format("ACTIVEAURAS.IgnoreSelfLog", {
          effectDataName: change.effect.name,
          changeKey: change.key,
          actorName: actor.name,
        })
      );
      args[1].key = "";
      args[1].value = "";
    }
    return wrapped(...args);
  }

  static scrollingText(wrapped, ...args) {
    // if supressing aura effect notifications and an aura; dont continue
    if (game.settings.get("ActiveAuras", "scrollingAura")) {
      if (this.flags["ActiveAuras"]?.applied) {
        return;
      }
    }
    // otherwise continue notificaiton chain
    return wrapped(...args);
  }

  static async applyTemplate(args) {
    let duration;
    const convertedDuration = globalThis.DAE.convertDuration(args[0].itemData.system.duration, true);
    if (convertedDuration?.type === "seconds") {
      duration = {
        seconds: convertedDuration.seconds,
        startTime: game.time.worldTime,
      };
    } else if (convertedDuration?.type === "turns") {
      duration = {
        rounds: convertedDuration.rounds,
        turns: convertedDuration.turns,
        startRound: game.combat?.round,
        startTurn: game.combat?.turn,
      };
    }
    let template = canvas.templates.get(args[0].templateId);
    let disposition = args[0].actor.token?.disposition ?? args[0].actor.prototypeToken?.disposition;
    let effects = args[0].item.effects;
    let templateEffectData = [];

    Logger.debug("applyTemplate", { template, effects, duration, disposition , args });

    for (let effect of effects) {
      let data = {
        data: foundry.utils.duplicate(effect),
        parentActorId: false,
        parentActorLink: false,
        entityType: "template",
        entityId: template.id,
        casterDisposition: disposition,
        castLevel: args[0].spellLevel,
      };
      if (effect.flags["ActiveAuras"].displayTemp) data.data.duration = duration;
      data.data.origin = args[0].item.uuid ?? `Actor.${args[0].actor._id}.Item.${args[0].item._id}`;
      templateEffectData.push(data);
    }
    Logger.debug("Applying template effect", templateEffectData);
    await template.document.setFlag("ActiveAuras", "IsAura", templateEffectData);
    // await AAHelpers.UserCollateAuras(canvas.scene.id, true, false, "templateApply");
    return { haltEffectsApplication: true };
  }

  static async applyDrawing(drawing, effects) {
    const templateEffectData = [];
    for (let effect of effects) {
      const newEffect = {
        data: foundry.utils.duplicate(effect),
        parentActorId: false,
        parentActorLink: false,
        entityType: "drawing",
        entityId: drawing.id,
      };
      newEffect.data.origin = (drawing.document ?? drawing).uuid;
      templateEffectData.push(newEffect);
    }

    Logger.debug("Applying drawing effects", templateEffectData);
    await (drawing.document ?? drawing).setFlag("ActiveAuras", "IsAura", templateEffectData);
    await AAHelpers.UserCollateAuras(canvas.scene.id, true, false, "documentApply");
    return { haltEffectsApplication: true };
  }

  static async removeAurasOnToken(token) {
    if (!token.actorLink) return;
    const auras = Array.from(token.actor.allApplicableEffects())
      .filter((i) => foundry.utils.hasProperty(i, "flags.ActiveAuras.applied")).map((i) => i.id);
    if (!auras) return;
    try {
      Logger.debug("removeAurasOnToken", { token, auras });
      await token.actor.deleteEmbeddedDocuments("ActiveEffect", auras);
    } catch (err) {
      Logger.error("ERROR CAUGHT in removeAurasOnToken", err);
    } finally {
      Logger.info(game.i18n.format("ACTIVEAURAS.RemoveLog", { tokenName: token.name }));
    }
  }

  static showEffectIcon(wrapped) {
    const superResult = wrapped();
    if (superResult) return superResult;

    // if not displaying temp, return default
    if (!foundry.utils.getProperty(this, "flags.ActiveAuras.displayTemp")) return superResult;

    // if it is the main aura and ignoring self, return default
    if (foundry.utils.getProperty(this, "flags.ActiveAuras.isAura")
    // && foundry.utils.getProperty(this, "flags.ActiveAuras.ignoreSelf")
    ) {
      return superResult;
    }
    return foundry.utils.getProperty(this, "flags.ActiveAuras.displayTemp");
  }
}
