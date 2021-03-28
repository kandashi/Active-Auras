## 0.1.3
- added filter for pre-update token to prevent non-effect updates triggering the main workflow
- fixed CreateActiveEffect function that previously saved token ID to the aura map, rather than updating on a single applied token.

## 0.1.4
- Added option for Alignment/Type checks before application
- Added optional save before application
- More bug fixes to prevent multiple application(check for auras before running workflow on token create)
- Auras no-longer apply when a token is at 0 hp (optional toggle in the settings)

## 0.1.43
- Removed euclidean distance option, auras now only use grid measurment distance
- Added Korean Localization
- Fixed a localization issue

## 0.2.00
Lots of updates for templates and drawings
- Any template effect can now call a AA macro (included in the compendium) in the Midi QoL OnUse field to apply any active effects to the template rather than the targeted tokens. 
    - This template will then act as its own source of an aura, any tokens that move inside the template will have the arua applied to them (not radius from the placement)
    - For setting up auras like this, simply put any non-0 value inside the aura radius and call the "AA ApplyEffectsToTemplate" macro in Midi QoL OnUse
- Auras can now be added to drawings through macros and will apply via the same logic as templates
    - Any token within a drawing will have the aura applied to them
    - Freehand drawings are not supported
    - `drawing.setFlag("ActiveAuras", "IsAura", [effect.data])` where effect is the active effect to apply
    - There is a bundled macro to select an active effect from a premade actor avaliable in the compendium, which has several "zone effect" style auras setup


## 0.2.04
[BREAKING]
Added combat check, by default tokens will only gain auras if combat is active. This is to limit the performance impact of Active Auras, and hopefully reduce stuttering and lag issues. There is a setting to remove this lock, however use at your own risk.
For anyone updating AA, please use the command ActiveAuras.RemoveAllAppliedAuras() either in a macro or the console to reset your canvas after updating, this will be required on any canvas with auras currently active

## 0.2.05
Internal change of debug setting to avoid namespace collisions
Added create/delete combatant hooks to allow adding and removing aura actors from an ongoing combat
[BREAKING]Added disposition check for template spells, the macro has been updated and will require replacing
[BUGS] Currently Macro-Repeat function from TimesUp/DAE is broken with auras