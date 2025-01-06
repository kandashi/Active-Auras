![](https://img.shields.io/badge/Foundry-v0.8.6-informational)![Latest Release Download Count](https://img.shields.io/github/downloads/kandashi/Active-Auras/latest/module.zip)![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2FActiveAuras&colorB=4aa94a)
# Active-Auras
## Important
- Auras will only work in combat unless the setting is turned off in the module settings
- Auras will only work on the Active Scene

Active Auras will propagate Active Effects that are labeled as auras onto nearby tokens.
The distance and targeting of the aura are both configurable.
Any ```@``` fields from DAE will be correctly parsed before being applied to the effected token.
Macros from DAE will fire once when applied and once when removed (work is being done for damage over time effects)

The "Apply while inactive" option allows for effects to propagate to other tokens while not applying to the Aura Token. This is useful for debuff style effects that should not effect the owner of the effect

## Demo setup for Aura of Protection
- We setup the aura status as Allies, as we only want the aura to effect allied tokens
- We set the radius as 10 (measure in ft)
![Active Auras setup](https://github.com/kandashi/Active-Auras/blob/main/Images/Aura%20of%20protection.PNG)

- We then move to Effect tab and add the relevant field. Make sure to use `+` in the field.
![Active Auras setup 2](https://github.com/kandashi/Active-Auras/blob/main/Images/Aura%20of%20protection%202.PNG)

-Finally we can see the effect has been transfered over to a nearly allied PC, and the `@` field has been converted to the correct value
![Active Auras setup 3](https://github.com/kandashi/Active-Auras/blob/main/Images/Aura%20of%20protection%203.PNG)

## Active Auras in concert with Token Magic FX and DAE
-Adding TMFX effects to tokens can be done with DAE
-We can use `macro.tokenMagic` as the Attribute Key and select the effect from the avaliable dropdown

![Active Aura TMFX](https://github.com/kandashi/Active-Auras/blob/main/Images/Active%20Auras%20TMFX.PNG)

![Active Aura Test](https://github.com/kandashi/Active-Auras/blob/main/Images/ActiveAuras%20test2.gif)

## DAE Macro Executes
- Using `@token` as a macro argument will now refer to the token the aura is applied to, you can use this in any DAE auras as normal


## Compatability
- Works with DAE
- Multi Level Token should work fine, clones actors are ignored for purposes of calculating auras

## Templates and drawings
- Any template effect can now call a AA macro (included in the compendium) in the Midi QoL OnUse field to apply any active effects to the template rather than the targeted tokens.
    - This template will then act as its own source of an aura, any tokens that move inside the template will have the aura applied to them (not radius from the placement)
    - For setting up auras like this, simply call the "AA ApplyEffectsToTemplate" macro in Midi QoL OnUse, any effects in the item will be applied to the aura
- Auras can now be added to drawings through macros and will apply via the same logic as templates
    - Any token within a drawing will have the aura applied to them
    - Freehand drawings are not supported
    - `drawing.setFlag("ActiveAuras", "IsAura", [effect.data])` where effect is the active effect to apply
    - There is a bundled macro to select an active effect from a pre-made actor available in the compendium, which has several "zone effect" style auras setup

## Custom evaluation conditions

You can provide a custom javascript check to evaluate if the aura should be transfered.
You can access `token`, `actor`, `system`, `rollData`, and `auraEntity` from within this evaluation, which will refer to the token data, and the actor the aura is evaluating on.

To apply to only goblinoids:

```
['goblinoid','goblin'].includes(system.details?.type?.subtype ?? system.details?.race.toLowerCase())
```

If the origin was a Token you can check `auraEntity.document.actor` for the originating aura actor, or `auraEntity.document` for the TokenDocument.

## Status Conditions

Status conditions on an effect are added to the source actor as usual. These will apply even if the ignore self option is checked.
To apply status conditions to the target of the aura (but not the source actor, even is ignore self is not checked) add the condition on the Active Aura tab of the effect window.

## Notes
- Only works when a GM player is connected
- Only works while a GM views the scene where an update takes place (a notification is given when this occurs)
