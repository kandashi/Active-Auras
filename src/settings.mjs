import { AAHelpers } from "./lib/AAHelpers.mjs";
import { CollateAuras } from "./lib/CollateAuras.mjs";

export function settings() {

  foundry.utils.setProperty(CONFIG, "debug.AA", false);
  foundry.utils.setProperty(CONFIG, "AA.GM", false);
  foundry.utils.setProperty(CONFIG, "AA.Map", new Map());

  game.settings.register("ActiveAuras", "measurement", {
    name: game.i18n.format("ACTIVEAURAS.measurmentoptions_name"),
    hint: game.i18n.format("ACTIVEAURAS.measurmentoptions_hint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register("ActiveAuras", "wall-block", {
    name: game.i18n.format("ACTIVEAURAS.walltoptions_name"),
    hint: game.i18n.format("ACTIVEAURAS.walltoptions_hint"),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });
  game.settings.register("ActiveAuras", "vertical-euclidean", {
    name: game.i18n.format("ACTIVEAURAS.measurementHeight_name"),
    hint: game.i18n.format("ACTIVEAURAS.measurementHeight_hint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register("ActiveAuras", "dead-aura", {
    name: game.i18n.format("ACTIVEAURAS.removeDead"),
    hint: game.i18n.format("ACTIVEAURAS.removeDeadHint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register("ActiveAuras", "remove-hidden-auras", {
    name: game.i18n.format("ACTIVEAURAS.removeHiddenAuras"),
    hint: game.i18n.format("ACTIVEAURAS.removeHiddenAurasHint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register("ActiveAuras", "combatOnly", {
    name: game.i18n.format("ACTIVEAURAS.combatOnly"),
    hint: game.i18n.format("ACTIVEAURAS.combatHint"),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
    onChange: () => {
      if (game.settings.get("ActiveAuras", "combatOnly") === false) {
        CollateAuras(canvas.id, true, true, "settings change");
      }
      else {
        AAHelpers.RemoveAllAppliedAuras();
      }
    },
  });
  game.settings.register("ActiveAuras", "scrollingAura", {
    name: game.i18n.format("ACTIVEAURAS.scrollingAura"),
    hint: game.i18n.format("ACTIVEAURAS.scrollingAuraHint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register("ActiveAuras", "debug", {
    name: game.i18n.format("ACTIVEAURAS.debug_name"),
    hint: game.i18n.format("ACTIVEAURAS.debug_hint"),
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });
  game.settings.register("ActiveAuras", "ActiveGM", {
    scope: "world",
    config: false,
    default: null,
    type: String,
  });
}
