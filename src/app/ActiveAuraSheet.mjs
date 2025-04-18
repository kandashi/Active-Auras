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

  const { BooleanField, StringField } = foundry.data.fields;

  return {
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
        initial: "",
      }),
      name: `flags.${CONSTANTS.MODULE_NAME}.aura`,
      value: document.getFlag(CONSTANTS.MODULE_NAME, "aura") ?? "",
      options: [
        { value: "None", label: "" },
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
  };

}


async function prepareContext(wrapped, ...args) {
  const result = await wrapped(...args);

  // const isAuraInput = foundry.applications.elements.HTMLDocumentTagsElement.create({
  //   value: this.document.getFlag(CONSTANTS.MODULE_NAME, "isAura") ?? false,
  //   name: `flags.${CONSTANTS.MODULE_NAME}.isAura`
  // });
  // const isAura = foundry.applications.fields.createFormGroup({ input: isAuraInput, label: "Is Aura" });
  // result.activeAuras = {
  //   isAura: isAura.outerHTML,
  // };
  result.activeAuras = getSchema(this.document);
  // const formGroup = foundry.applications.fields.createFormGroup({ input, label: "Scene Effects" })
  // const scenEffectsField = formGroup.outerHTML;

  console.warn(result);

  return result;
}


export function extendAESheet() {

  foundry.applications.sheets.ActiveEffectConfig.PARTS = getExtendedParts(foundry.applications.sheets.ActiveEffectConfig.PARTS);
  foundry.applications.sheets.ActiveEffectConfig.TABS = getExtendedTabs(foundry.applications.sheets.ActiveEffectConfig.TABS);

  libWrapper.register(
    "ActiveAuras",
    "foundry.applications.sheets.ActiveEffectConfig.prototype._prepareContext",
    prepareContext,
    "WRAPPER"
  );

}
