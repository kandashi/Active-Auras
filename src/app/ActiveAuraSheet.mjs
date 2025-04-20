import CONSTANTS from "../constants.mjs";

function getExtendedParts(origParts) {
  return Object.fromEntries(Object.entries(origParts)
    .toSpliced(-1, 0, ["activeauras", { template: "modules/ActiveAuras/templates/config.hbs" }]));
}

function getExtendedTabs(origTabs) {
  return {
    sheet: {
      ...origTabs.sheet,
      tabs: [
        ...origTabs.sheet.tabs,
        { id: "activeauras", icon: "fa-thin fa-person-rays" }
      ]
    }
  };
}

function getSchema(document) {

  const { BooleanField, StringField, SetField } = foundry.data.fields;

  const schema = {
    isAura: {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_IsAura"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.isAura`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "isAura") ?? false,
    },
    aura: {
      field: new StringField({
        label: game.i18n.format("ACTIVEAURAS.FORM_TargetsName"),
        initial: "All",
        required: true,
        blank: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.aura`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "aura") ?? "All",
      options: [
        { value: "Enemy", label: game.i18n.localize("ACTIVEAURAS.FORM_TargetsEnemy") },
        { value: "Allies", label: game.i18n.localize("ACTIVEAURAS.FORM_TargetsAllies") },
        { value: "All", label: game.i18n.localize("ACTIVEAURAS.FORM_TargetsAll") },
      ],
    },
    nameOverride: {
      field: new StringField({
        label: game.i18n.format("ACTIVEAURAS.FORM_NameOverride"),
        initial: "",
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.nameOverride`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "nameOverride") ?? "",
    },
    radius: {
      field: new StringField({
        label: game.i18n.format("ACTIVEAURAS.FORM_Radius"),
        initial: "",
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.radius`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "radius") ?? "",
      placeholder: game.i18n.format("ACTIVEAURAS.FORM_RadiusPrompt"),
    },
    alignment: {
      field: new StringField({
        label: game.i18n.format("ACTIVEAURAS.FORM_Alignment"),
        initial: "",
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.alignment`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "alignment") ?? "",
      options: [
        { value: "", label: "" },
        { value: "good", label: game.i18n.format("ACTIVEAURAS.FORM_Good") },
        { value: "neutral", label: game.i18n.localize("ACTIVEAURAS.FORM_Neutral") },
        { value: "evil", label: game.i18n.localize("ACTIVEAURAS.FORM_Evil") },
      ]
    },
    type: {
      field: new StringField({
        label: game.i18n.format("ACTIVEAURAS.FORM_Type"),
        initial: "",
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.type`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "type") ?? "",
      placeholder: game.i18n.format("ACTIVEAURAS.FORM_TypePrompt"),
    },
    customCheck: {
      field: new StringField({
        label: game.i18n.format("ACTIVEAURAS.FORM_CustomCondition"),
        initial: "",
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.customCheck`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "customCheck") ?? "",
      placeholder: game.i18n.format("ACTIVEAURAS.FORM_CustomConditionPrompt"),
    },
    ignoreSelf: {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_IgnoreSelf"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.ignoreSelf`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "ignoreSelf") ?? false,
    },
    height: {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_Height"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.height`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "height") ?? false,
    },
    hidden: {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_Hidden"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.hidden`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "hidden") ?? false,
    },
    displayTemp: {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_Temporary"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.displayTemp`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "displayTemp") ?? false,
    },
    hostile: {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_HostileTurn"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.hostile`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "hostile") ?? false,
    },
    onlyOnce: {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_ActivateOnce"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.onlyOnce`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "onlyOnce") ?? false,
    },
    wallsBlock: {
      field: new StringField({
        label: game.i18n.format("ACTIVEAURAS.FORM_WallsBlock"),
        initial: "system",
        required: true,
        blank: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.wallsBlock`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "wallsBlock") ?? "system",
      options: [
        { value: "system", label: game.i18n.localize("ACTIVEAURAS.FORM_SystemWallsBlock") },
        { value: "true", label: game.i18n.localize("ACTIVEAURAS.FORM_WallsDoBlock") },
        { value: "false", label: game.i18n.localize("ACTIVEAURAS.FORM_WallsDontBlock") },
      ],
    },
    statuses: {
      field: new SetField(new StringField({
        blank: false,
      }), {
        label: game.i18n.format("ACTIVEAURAS.FORM_StatusConditions"),
        initial: [],
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.statuses`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "statuses") ?? [],
      options: CONFIG.statusEffects.map((s) => {
        return {
          value: s.id,
          label: game.i18n.localize(s.name),
        };
      }),
    },
  };

  if (game.system.id === "swade") {
    schema["wildcard"] = {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_Wildcard"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.wildcard`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "wildcard") ?? false,
    };
    schema["extra"] = {
      field: new BooleanField({
        label: game.i18n.format("ACTIVEAURAS.FORM_Extra"),
        initial: false,
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.extra`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "extra") ?? false,
    };
  }

  return schema;
}

async function _preparePartContext(wrapped, ...args) {
  let context = await wrapped(...args);

  if (args[0] === "activeauras") {
    context.activeAuras = getSchema(this.document);
    context.activeAuras.applied = this.document.getFlag(CONSTANTS.MODULE_NAME, "applied") ?? false;
    context.activeAuras.swade = game.system.id === "swade";
  }
  return context;
};


function _onRender(wrapped, ...args) {
  this.element.querySelectorAll("fieldset#activeauras-isaura :is(input)").forEach((checkbox) => {
    checkbox.addEventListener("change", async (event) => {
      const checked = event.target.checked;
      const detailsFieldset = this.element.querySelector("fieldset#activeauras-details");
      detailsFieldset.style.display = checked ? "" : "none";
    });
  });

  return wrapped(...args);
}


export function extendAESheet() {
  if (!foundry.utils.isNewerVersion(game.version ?? "", "13")) return;

  foundry.applications.sheets.ActiveEffectConfig.PARTS = getExtendedParts(foundry.applications.sheets.ActiveEffectConfig.PARTS);
  foundry.applications.sheets.ActiveEffectConfig.TABS = getExtendedTabs(foundry.applications.sheets.ActiveEffectConfig.TABS);

  libWrapper.register(
    "ActiveAuras",
    "foundry.applications.sheets.ActiveEffectConfig.prototype._preparePartContext",
    _preparePartContext,
    "WRAPPER"
  );

  libWrapper.register(
    "ActiveAuras",
    "foundry.applications.sheets.ActiveEffectConfig.prototype._onRender",
    _onRender,
    "WRAPPER"
  );

  // add post setup for DAE
  Hooks.on("ready", () => {
    if (CONFIG.ActiveEffect.sheetClasses.base["core.DAEActiveEffectConfig"]){
      CONFIG.ActiveEffect.sheetClasses.base["core.DAEActiveEffectConfig"].cls.PARTS = getExtendedParts(CONFIG.ActiveEffect.sheetClasses.base["core.DAEActiveEffectConfig"].cls.PARTS);

      libWrapper.register(
        "ActiveAuras",
        "CONFIG.ActiveEffect.sheetClasses.base['core.DAEActiveEffectConfig'].cls.prototype._onRender",
        _onRender,
        "WRAPPER"
      );
    }
  });

}
