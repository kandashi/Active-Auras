# 0.11.4

- Template Auras would not work with newer midi versions.

# 0.11.3

- Italiano translation by GregoryWarn

# 0.11.2

- Prevent double application of effects from Templates.

# 0.11.1

- In some configuration combinations auras applied to self would double changesets.
- Improve handling of Aura creation when token is added to scene.

# 0.11.0

- Potentially Breaking Changes!
- Previously an aura applied to self would use the changes on the origin Aura Effect. Active Auras will now create a child aura on the origin if it targets self, rather than using the changes on the origin aura.
- The created Aura Effect will append "(Aura)" to the name of the effect if no name override is given in the config.
- Improved aura queuing to reduce chances of duplicate auras during movement.
- Improved duplicate aura detection to help instances where say multiple Paladins with the same auras are in play.
-  mild performance improvements.

# 0.10.0

- Foundry v12 Only
- New status conditions option that will apply status effects to targets of aura.

# 0.9.15

- Silence compendium example was not working.

# 0.9.14

- Remove errant warning
- Fix auras in v12 and D&D v3.3.1
- If using a Placeholder token in the combar tracker, AA could fail.

# 0.9.13

- Resolve levels deprecation warnings.

# 0.9.12

- v12 official support.
- Some template auras would fail to apply when cast via things like magic items.

# 0.9.11

- Added German Translation.

# 0.9.10

- Português (Brasil) Translation

# 0.9.9

- JP language updates.

# 0.9.8

- If using aura evaluation only in combat, when combat ended, in some instances auras would not be removed.
- More selective use of setting auras origins to parent ids where the effect has an origin uuid that points to an actors item, and it's not a transfer effect.

# 0.9.7

- Set Effect Origin to parent item for fun transfer effect times in D&D 3.0, in more instances.
- When an item is deleted from an actor with an aura that is effecting tokens on the scene, the aura effect will now be removed from the token on delete for systems not using legacy transferral.

# 0.9.6

- Set Effect Origin to parent item for fun transfer effect times in D&D 3.0.
- Initial Canvas parse of effects would not always trigger, so for example a Paladins Aura effect would not be applied until the Paladin moved.

# 0.9.5

- Apply Active Effect Icon will now work.
- Custom evaluation conditions now expose `auraEntity` as the entity from which the aura emanates. If the origin was a Token you can check `auraEntity.document.actor` for the originating aura actor, or `auraEntity.document` for the TokenDocument.

# 0.9.4

- Update sample items for changes in DAE to what the values for stackable do.

# 0.9.3

- If a template was moved with an aura attached, auras refresh cycle was not triggered correctly.

# 0.9.2

- More tweaks to ignore self auras for 5e.

# 0.9.1

- Effects which ignored self would not work in SWADE.

# 0.9.0

- They type checking filed can now take multiple entries, and you can split these using a `;` character. It will check the type, subtype and custom fields of an actor for a match.
- Fix for tokens moving when GM is on different screen with new animation handling.
- Move to using Non-Legacy Transferral functions for systems not using Non-Legacy Transgerral's, e.g. SWADE.

# 0.8.4/0.8.5

- Some Auras would not work in D&D 2.4 system.
- Better support for 5e character race changes.

# 0.8.3

- Improvements to code to wait for movement animation to complete.

# 0.8.2

- For Template auras the check for canvasToken.disposition returns undefined. by @thatlonelybugbear in #294

# 0.8.1

- Templates providing Aura effects would not remove effect if the token was still within the template if the effect was ended via concentration removal.

# 0.8.0

- Some small tweaks to improve template and drawing aura detection.
- Applying auras to templates is possible again, see example macro.
- Compendiums revisited and checked for issues.
- Active Auras is now v11 only.

# 0.7.8

- A tweak to template application to improve uuid detection from TPosney
- A tweak to UI rendering to prevent failure of AA tab appearing on some existing effects.

# 0.7.7

- Based on a feature by Aedif, you can now specify a custom evaluation condition for the active aura. See the readme for details.
- There is a new per aura "Walls Block" setting, that can use the module default or specify a yes/no for the aura.

# 0.7.6
- Auras now have a rename/name override field, allow the effect placed by the aura to get a new name!

# 0.7.5
- Wall check logic fixed back to sight or movement (had been changed to sight and movement).

# 0.7.4
- Changelog reveresed.
- Template auras would not apply template correctly if Wall Blocking was enabled.
- Updates to remove changes of duplicate auras been applied, or errors if moving tokens very quickly.

# 0.7.3
- If wall blocking was enabled AA would throw deprecated warning messages. Also, auras would be applied inconsistently.

# 0.7.2
- Fix some issues with entering/exiting auras on v11.

# 0.7.1
- Fix disabled scrolling text in v11

# 0.7.0
- Update packs for v11
- Version bump for v11 support

# 0.6.3
- Correct Pack/Compendium names for v11.

# 0.6.2
- When applying effects via a template and targetting larger numbers of creatures, due to some timing issues, midi could decide that the effect had expired and remove the effect. Certain auras will now await more, which might increase some auras processing time.
- ActiveAuras was not exported through the legacy window mode.

# 0.6.1
- Effects which had previously been marked as active auras and had ignore self checked, but were no longer marked as active effects would cause the effect to not be applied to the actor.

# 0.6.0
- Moved to a ES Module, no longer provided as world scripts.
- Improve wound detection in SWADE.
- In some cases, an aura effect would be reapplied even after the aura was gone#271
- Transferred Effects aren't removed if the source token is deleted #269

# 0.5.7
Better support for 4e.
Spikegrowth example macro fixed.

# 0.5.6
Will now evaluate the radius as a rollterm, so you can use things like `@scale.paladin.aura-of-protection` in the radius as well as numbers.
Auras would fail with new 5e Group actors due to lack of alignment.

# 0.5.5
Going to 0 hp will now remove effects such as Paladin Auras once again.

# 0.5.4
Don't trigger effect removal when times-up expires an effect as it cleans up for us.

# 0.5.3
Correct a missing deprecated data reference.
Try and prevent the double effect deletion.
HP Check could misfire effect application due to bad HP logic.
Auras in 5e will support the `isSuppressed` flag, and triggered by attunement and equipped status if it's an item. (@DarkByteZero)

# 0.5.2
Resolves #252 Error when disabling "Auras in combat"
Resolves #251 Error when disabling an AE and "Disable scrolling text for auras" is enabled

# 0.5.1
Would not work in SWADE due to a 5e assumption in the template shape detection algorithm.

# 0.5.0
Official v10 Release

# 0.4.24
Handle cases of multiple GM's logged in.

# 0.4.23
Some template auras would fail.

# 0.4.22
Duplicate macro removed.
Walls now block on templates again.

# 0.4.21
New settings to apply/remove aura effects from hidden actors (not invisible). Defaults to true.

## 0.4.20
v10 Support
Walls will now block again
Standardize on debounceCollate to help with state oscillation

## 0.4.07
Fixed for non-circular templates
Fixes for duplicate DF CE effects as the name would not match the aura-name

## 0.3.05
Updated for DnD5e 1.3.6+ change in NPC type
Added Levels Support for wallheight/floor collision checks
Added support for ItemMacro. Active Effects will now pull from the original item when looking for a macro to execute, you will still need the Apply Effects to Template macro for any template spells
Added fancy animations to the aura tab
Limited some console logs to the debug setting to prevent spam
Fixed/updated all compendium items so they contain the macro in an Item Macro, these will need replacing to update

## 0.3.02
added SWADE support
changed lib wrapper function to MIXED instead of WRAPPED to prevent DAE conflicts
extrapolated some of the "core" functions out to helper functions to allow for easier system addition

## 0.3.01
Added LibWrapper dependency

## 0.3.0
0.8.6 release

## 0.2.11
Fix for non-viewed scene errors on combat advancement
Cleaned up the range computation to make things faster
Updated spells : Spirit Guardians, Black Tentacles, Cloudkill, Incendiary Cloud, Insect Plague, Moonbeam, Sleet Storm,
Any of these spells will still work with the old versions, but the new ones will remove the effect if the token is forcefully removed from the aura not on their turn

## 0.2.09
Fix for drawing effects not applying correctly
Fix for Spirit Guardians spell, will need replacing and the macro importing

## 0.2.08
Fix for no-combat errors
Cleanup for string effect values
Fix for Grease spell

## 0.2.07
Clean up combatant checks
Clear up parsing of @ values within effect data
Added multiple Aura effect spells into the compendium pack

## 0.2.05
Internal change of debug setting to avoid namespace collisions
Added create/delete combatant hooks to allow adding and removing aura actors from an ongoing combat
[BREAKING]Added disposition check for template spells, the macro has been updated and will require replacing
[BUGS] Currently Macro-Repeat function from TimesUp/DAE is broken with auras

## 0.2.04
[BREAKING]
Added combat check, by default tokens will only gain auras if combat is active. This is to limit the performance impact of Active Auras, and hopefully reduce stuttering and lag issues. There is a setting to remove this lock, however use at your own risk.
For anyone updating AA, please use the command ActiveAuras.RemoveAllAppliedAuras() either in a macro or the console to reset your canvas after updating, this will be required on any canvas with auras currently active

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

## 0.1.43
- Removed euclidean distance option, auras now only use grid measurment distance
- Added Korean Localization
- Fixed a localization issue

## 0.1.4
- Added option for Alignment/Type checks before application
- Added optional save before application
- More bug fixes to prevent multiple application(check for auras before running workflow on token create)
- Auras no-longer apply when a token is at 0 hp (optional toggle in the settings)

## 0.1.3
- added filter for pre-update token to prevent non-effect updates triggering the main workflow
- fixed CreateActiveEffect function that previously saved token ID to the aura map, rather than updating on a single applied token.
