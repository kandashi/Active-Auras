## 1.3.3
- added filter for pre-update token to prevent non-effect updates triggering the main workflow
- fixed CreateActiveEffect function that previously saved token ID to the aura map, rather than updating on a single applied token.

## 1.3.35
- Added debug setting to help with tracing errors
- Added more debug arguments throughout the code to assist in debugging
- Added check for auras in preDeleteToken before running the rest of the code
- Reworked unlinked token checks to more accuratly remove auras when disabling auras or hiding the token
- Reworked logic for removal of auras on active effect updates
- Added support for item macros when DAE supports this
- Cleaned up the code for removal of applied auras, this should prevent auras not applying/removing from tokens 
