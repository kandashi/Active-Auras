import { extendEffectsForm } from "./app/aurasTab.mjs";
import { initHooks, readyHooks, socketLibReadyHooks } from "./hooks.mjs";
import { AAHelpers } from "./lib/AAHelpers.mjs";
import { AAMeasure } from "./lib/AAMeasure.mjs";
import { ActiveAuras } from "./lib/ActiveAuras.mjs";


Hooks.on("init", initHooks);
Hooks.once("socketlib.ready", socketLibReadyHooks);
Hooks.on("ready", readyHooks);
Hooks.on("renderActiveEffectConfig", extendEffectsForm);

window.AAHelpers = AAHelpers;
window.AAhelpers = AAHelpers;
window.AAMeasure = AAMeasure;
window.AAmeasure = AAMeasure;
window.ActiveAuras = ActiveAuras;
