import { AAHelpers } from "./AAHelpers.mjs";
import { ActiveAuras } from "./ActiveAuras.mjs";
import Logger from "./Logger.mjs";

/**
 *
 * @param {String} sceneID Scene to check upon
 * @param {Boolean} checkAuras Can apply auras
 * @param {Boolean} removeAuras Can remove auras
 * @param {String} source For console logging
 * @returns
 */
export async function CollateAuras(sceneID, checkAuras, removeAuras, source) {
  if (!CONFIG.AA.GM) return;
  if (sceneID !== canvas.id) {
    ui.notifications.warn(
      "Collate Auras called on a non viewed scene, auras will be updated when you return to that scene"
    );
    return;
  }
  Logger.debug(source);
  const MapKey = sceneID;
  const MapObject = CONFIG.AA.Map.get(MapKey);
  const effectArray = [];

  for (const t of canvas.tokens.placeables) {
    const testToken = t.document;
    //Skips over null actor tokens
    if (testToken.actor === null || testToken.actor === undefined) continue;
    //Skips over MLT coppied tokens
    if (testToken.flags["multilevel-tokens"]) continue;
    // applying auras on dead?
    if (game.settings.get("ActiveAuras", "dead-aura") && AAHelpers.EntityHPCheck(testToken)) {
      Logger.debug(`Skipping ${testToken.name}, "DEAD/0hp"`);
      continue;
    }
    // applying auras on hidden?
    if (testToken.hidden && game.settings.get("ActiveAuras", "remove-hidden-auras")) {
      Logger.debug(`Skipping ${testToken.name}, hidden`);
      continue;
    }
    // loop over effects
    for (const testEffect of (testToken?.actor?.effects.contents ?? [])) {
      if (testEffect.flags?.ActiveAuras?.isAura) {
        if (testEffect.disabled) continue;
        if (testEffect.isSuppressed) continue; // effect is supressed for example because it is unequipped
        const newEffect = {
          data: duplicate(testEffect),
          parentActorLink: testEffect.parent.prototypeToken.actorLink,
          parentActorId: testEffect.parent.id,
          entityType: "token",
          entityId: testToken.id,
        };
        const re = /@[\w.]+/g;
        const rollData = testToken.actor.getRollData();

        for (const change of newEffect.data.changes) {
          if (typeof change.value !== "string") continue;
          let s = change.value;
          for (let match of s.match(re) || []) {
            if (s.includes("@@")) {
              s = s.replace(match, match.slice(1));
            } else {
              s = s.replace(match, getProperty(rollData, match.slice(1)));
            }
          }
          change.value = s;
          if (change.key === "macro.execute" || change.key === "macro.itemMacro")
            newEffect.data.flags.ActiveAuras.isMacro = true;
        }
        newEffect.data.disabled = false;
        const macro = newEffect.data.flags.ActiveAuras.isMacro !== undefined
          ? newEffect.data.flags.ActiveAuras.isMacro
          : false;
        newEffect.data.flags.ActiveAuras.isAura = false;
        newEffect.data.flags.ActiveAuras.applied = true;
        newEffect.data.flags.ActiveAuras.isMacro = macro;
        newEffect.data.flags.ActiveAuras.ignoreSelf = false;
        if (testEffect.flags.ActiveAuras?.hidden && testToken.hidden) newEffect.data.flags.ActiveAuras.Paused = true;
        else newEffect.data.flags.ActiveAuras.Paused = false;
        effectArray.push(newEffect);
      }
    }
  }
  await RetrieveDrawingAuras(effectArray);
  await RetrieveTemplateAuras(effectArray);
  if (MapObject) {
    MapObject.effects = effectArray;
  } else {
    CONFIG.AA.Map.set(MapKey, { effects: effectArray });
  }

  Logger.debug("CONFIG.AA.Map", CONFIG.AA.Map);

  if (checkAuras) {
    ActiveAuras.MainAura(undefined, "Collate auras", canvas.id);
  }
  if (removeAuras) {
    Logger.debug("CollateAuras delete", { map: CONFIG.AA.Map });
    AAHelpers.RemoveAppliedAuras();
  }
}

function RetrieveTemplateAuras(effectArray) {
  const auraTemplates = canvas.templates.placeables.filter((i) => i.document.flags?.ActiveAuras?.IsAura !== undefined);

  for (const template of auraTemplates) {
    for (const testEffect of (template.document.flags?.ActiveAuras?.IsAura ?? [])) {
      if (testEffect.disabled) continue;
      if (testEffect.isSuppressed) continue; // effect is supressed for example because it is unequipped
      const newEffect = duplicate(testEffect);
      const parts = testEffect.data.origin.split(".");
      // eslint-disable-next-line no-unused-vars
      const [entityName, entityId, embeddedName, embeddedId] = parts;
      const actor = game.actors.get(entityId);
      const rollData = actor.getRollData();
      rollData["item.level"] = getProperty(testEffect, "castLevel");
      Object.assign(rollData, { item: { level: testEffect.castLevel } });
      const re = /@[\w.]+/g;
      for (const change of newEffect.data.changes) {
        if (typeof change.value !== "string") continue;
        let s = change.value;
        for (const match of s.match(re) || []) s = s.replace(match, getProperty(rollData, match.slice(1)));
        change.value = s;
        if (change.key === "macro.execute" || change.key === "macro.itemMacro")
          newEffect.data.flags.ActiveAuras.isMacro = true;
      }
      newEffect.disabled = false;
      const macro = newEffect.data.flags.ActiveAuras.isMacro !== undefined
        ? newEffect.data.flags.ActiveAuras.isMacro
        : false;

      newEffect.data.flags.ActiveAuras.isAura = false;
      newEffect.data.flags.ActiveAuras.applied = true;
      newEffect.data.flags.ActiveAuras.isMacro = macro;
      newEffect.data.flags.ActiveAuras.ignoreSelf = false;
      effectArray.push(newEffect);
    }
  }
  return effectArray;
}

function RetrieveDrawingAuras(effectArray) {
  if (!effectArray) effectArray = CONFIG.AA.Map.get(canvas.scene._id)?.effects;
  const auraDrawings = canvas.drawings.placeables.filter((i) => i.document.flags?.ActiveAuras?.IsAura !== undefined);

  for (const drawing of auraDrawings) {
    for (const testEffect of (drawing.document.flags?.ActiveAuras?.IsAura ?? [])) {
      if (testEffect.disabled) continue;
      if (testEffect.isSuppressed) continue; // effect is supressed
      const newEffect = {
        data: duplicate(testEffect),
        parentActorId: false,
        parentActorLink: false,
        entityType: "drawing",
        entityId: drawing.id,
      };
      const parts = testEffect.origin.split(".");
      // eslint-disable-next-line no-unused-vars
      const [entityName, entityId, embeddedName, embeddedId] = parts;
      const actor = game.actors.get(entityId);
      if (actor) {
        let rollData = actor.getRollData();
        for (let change of newEffect.data.changes) {
          if (typeof change.value !== "string") continue;
          const re = /@[\w.]+/g;
          let s = change.value;
          for (const match of s.match(re) || []) s = s.replace(match, getProperty(rollData, match.slice(1)));
          change.value = s;
          if (change.key === "macro.execute" || change.key === "macro.itemMacro")
            newEffect.data.flags.ActiveAuras.isMacro = true;
        }
      }
      newEffect.disabled = false;
      let macro = newEffect.data.flags.ActiveAuras.isMacro !== undefined
        ? newEffect.data.flags.ActiveAuras.isMacro
        : false;

      newEffect.data.flags.ActiveAuras.isAura = false;
      newEffect.data.flags.ActiveAuras.applied = true;
      newEffect.data.flags.ActiveAuras.isMacro = macro;
      newEffect.data.flags.ActiveAuras.ignoreSelf = false;
      effectArray.push(newEffect);
    }
  }
  return effectArray;
}
