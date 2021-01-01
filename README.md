# DAE-Auras

This module attempts to automate Active Effects auras. Any "aura flagged" Active Effect will be pushed to any nearby tokens that are within the defined range. This measurement 
follows the local system measurements for movement (5/5/5 and 5/10/5)

This will only take Active Effects on a token, so any items with "castable" auras will not be applied until the effect is applied to a token.

![Active Auras setup](https://github.com/kandashi/Active-Auras/blob/main/Images/Active%20Auras%20AE.PNG)

## Compatability
- DAE static fields should apply fine, actor references will not work at present (they will refer to the applied token not the caster)
- Macro fields have not been tested yet
