# Active-Auras

Active Auras will propigate Active Effects that are labeled as auras onto nearby tokens. 
The distance and targeting of the aura are both configurable.
Any ```@``` fields from DAE will be correctly parsed before being applied to the effected token.
Macros from DAE will fire once when applied and once when removed (work is being done for damage over time effects)

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


## Compatability
- Works with DAE as far as I know
- Multi Level Token should work fine, clones actors are ignored for purposes of calculating auras


## Notes
- Only works with a GM account currently connected
