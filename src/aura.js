

Hooks.on('init', () => {
    game.settings.register("ActiveAuras", "measurement", {
        name: "Use movement measurement system rather than straight line, default on",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register("ActiveAuras", "wall-block", {
        name: "Walls Block Auras",
        hint: "Interveneing walls will block aura effects",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
});

Hooks.on("ready", () => {
    const MODULE_NAME = "ActiveAuras";

    /**
     * Hooks onto effect sheet to add aura configuration
     */
    Hooks.on("renderActiveEffectConfig", async (sheet, html) => {
        await sheet.object.setFlag(`${MODULE_NAME}`, 'aura')
        const originHandle = html.find($('input[name="disabled"]'))
        const flags = sheet.object.data.flags;

        const aoeHTML = `
    <div class="form-group">
        <label>Effect is Aura</label>
        <input name="flags.${MODULE_NAME}.isAura" type="checkbox" ${flags[MODULE_NAME].isAura ? 'checked' : ''} </input>
        <label></label>
            </select>
        <label> Apply while inactive?</label>
        <input name="flags.${MODULE_NAME}.inactive" type="checkbox" ${flags[MODULE_NAME].inactive ? 'checked' : ''} </input>
            </select>
    </div>
    <div class="form-group">
            <label>Aura Targets:</label>
             <select name="flags.${MODULE_NAME}.aura" data-dtype="String" value=${flags[MODULE_NAME]?.aura}>
              <option value="None" ${flags[MODULE_NAME].aura === 'None' ? 'selected' : ''}></option>
              <option value="Enemy"${flags[MODULE_NAME].aura === 'Enemy' ? 'selected' : ''}>Enemies</option>
              <option value="Allies"${flags[MODULE_NAME].aura === 'Allies' ? 'selected' : ''}>Allies</option>
               <option value="All"${flags[MODULE_NAME].aura === 'All' ? 'selected' : ''}>All</option>
            </select>
            <label></label>
            <label>Aura radius</label>
            <input id="radius" name="flags.${MODULE_NAME}.radius" type="number" min="0" value="${flags[MODULE_NAME].radius}"></input>
            </select>
        </div>
    </div>`
        html.css("height", "auto");
        originHandle.parent().after(aoeHTML)
    });

    let newToken;
    /**
     * Re-run aura detection on token creation
     */
    Hooks.on("createToken", (scene, token) => {
        newToken = canvas.tokens.get(token._id)
        MainAura(token)
    });

    /**
     * Filter for aura effects on deleted token and remove from canvas tokens
     */
    Hooks.on("preDeleteToken", async (scene, token) => {
        let oldEffects = []
        if (token.actorLink) {
            let actor = game.actors.get(token.actorId)
            for (let testEffect of actor.effects) {
                let isAura = testEffect.getFlag('ActiveAuras', 'aura')
                let appliedAura = testEffect.getFlag('ActiveAuras', 'applied')
                if (isAura && isAura !== "None") {
                    //if (testToken.id === movedToken.id) movedToken_has_aura = true
                    oldEffects.push(testEffect)
                }
                if (appliedAura) {
                    await testEffect.delete()
                }
            }
        }
        else {
            let tokenEffects = [];
            token.actorData?.effects?.forEach(a => tokenEffects.push(a))
            game.actors.get(token.actorId)?.effects.forEach(a => tokenEffects.push(a))
            for (let testEffect of tokenEffects) {
                let isAura = testEffect.getFlag('ActiveAuras', 'aura')
                let appliedAura = testEffect.getFlag('ActiveAuras', 'applied')
                if (isAura && isAura !== "None" && !appliedAura) {
                    //if (testToken.id === movedToken.id) movedToken_has_aura = true
                    oldEffects.push(testEffect)
                }
            }
        }
        oldEffects.forEach(i => RemoveAura(i.data, token))
    });

    /**
     * On token movement run MainAura
     */
    Hooks.on("updateToken", (scene, token, update, flags, id) => {
        if (!("y" in update || "x" in update)) return;
        MainAura(token,)
    });


    /**
     * On addition/removal of active effect from unlinked actor, if aura update canvas.tokens
     */
    Hooks.on("preUpdateToken", (scene, token, update) => {
        if (!(update?.actorData?.effects)) return;

        let removed = token.actorData.effects.filter(x => !update.actorData.effects.includes(x));
        let added = update.actorData.effects.filter(x => !token.actorData.effects.includes(x));
        if (removed.length > 0) {
            let auraStatus = removed[0].flags?.ActiveAuras?.aura;
            let applyStatus = removed[0].flags?.ActiveAuras?.applied;
            if (auraStatus !== "None" && auraStatus !== undefined && !applyStatus) {
                RemoveAura(removed[0], token)
            }
        }
        if (added.length > 0) {
            let auraStatus = added[0].flags?.ActiveAuras?.aura;
            let applyStatus = added[0].flags?.ActiveAuras?.applied;
            if (auraStatus !== "None" && applyStatus) {
                Hooks.once("updateToken", () => {
                    MainAura()
                })
            }
        }

    })

    let effectDisabled;
    let disabledEffect;
    Hooks.on("updateActiveEffect", (actor, effect, update) => {
        if (effect.flags?.ActiveAuras?.aura !== "None") {
            if (update?.disabled === true) effectDisabled = true; disabledEffect = actor.effects.find(i => i.data._id === effect._id);
            if (update?.disabled === false) effectDisabled = false;
            setTimeout(() => {
                MainAura()
            }, 50)
        }
    })

    /**
     * On removal of active effect from linked actor, if aura remove from canvas.tokens
     */
    Hooks.on("deleteActiveEffect", (actor, effect) => {
        let auraStatus = effect.flags?.ActiveAuras?.aura;
        let applyStatus = effect.flags?.ActiveAuras?.applied;
        let token = null
        if (auraStatus !== "None" && !applyStatus) {
            RemoveAura(effect, token, actor)
        }
    });

    /**
     * On creation of active effect on linked actor, run MainAura
     */
    Hooks.on("CreateActiveEffect", (actor, effect) => {
        if (!effect.flags.ActiveAuras.applied && effect.flags.ActiveAuras.aura !== "None") {
            Hooks.once("renderActorSheet5eCharacter", () => {
                MainAura();
            });
        };
    });


    function GetAllFlags(entity, scope) {
        {
            const scopes = SetupConfiguration.getPackageScopes();
            if (!scopes.includes(scope)) throw new Error(`Invalid scope`);
            return getProperty(entity.data.flags, scope);
        }
    }

    /**
     * 
     * @param {Token} movedToken - optional value for further extension, currently unused
     * Locate all auras on the canvas, create map of tokens to update, update tokens 
     */
    function MainAura(movedToken) {
        let gm = game.user === game.users.find((u) => u.isGM && u.active)
        if (!gm) return;
        //let movedToken_has_aura = false;
        let auraEffectArray = [];
        if (effectDisabled) auraEffectArray.push(disabledEffect)
        for (let testToken of canvas.tokens.placeables) {
            if (testToken.actor === null || testToken.actor === undefined) continue;
            if (game.modules.get("multilevel-tokens")?.active) {
                if (GetAllFlags(testToken, 'multilevel-tokens')) continue;
            }
            for (let testEffect of testToken?.actor?.effects.entries) {
                if (!testEffect.getFlag('ActiveAuras', 'isAura')) continue;
                let inactiveApply = testEffect.getFlag('ActiveAuras', 'inactive')
                if ((!effectDisabled && !inactiveApply) || (!inactiveApply && !testEffect.data.disabled)) continue
                //if (testToken.id === movedToken.id) movedToken_has_aura = true
                auraEffectArray.push(testEffect)
            }
        }

        let map = new Map();

        UpdateAllTokens(map, auraEffectArray, canvas.tokens.placeables)

        for (let mapEffect of map) {
            let MapKey = mapEffect[0]
            let newEffectData = duplicate(mapEffect[1].effect.data)
            newEffectData.flags.ActiveAuras = {
                isAura: false,
                applied: true
            }
            newEffectData.disabled = false

            for (let change of newEffectData.changes) {

                if (typeof change.value === "string" && change.key !== "macro.execute") {
                    if (change.value.includes("@")) {
                        let dataPath = change.value.substring(2)
                        let newValue = getProperty(mapEffect[1].effect.parent.getRollData(), dataPath)
                        const changeIndex = newEffectData.changes.findIndex(i => i.value === change.value && i.key === change.key)
                        newEffectData.changes[changeIndex].value = `+ ${newValue}`
                    }
                }
            }
            map.set(MapKey, { add: mapEffect[1].add, token: mapEffect[1].token, effect: newEffectData })
        }

        for (let update of map) {
            if (update[1].add) {
                CreateActiveEffect(update[1].token, update[1].effect)
            }
            else {
                RemoveActiveEffects(update[1].token, update[1].effect.label)
            }
        }
        effectDisabled = undefined;
        disabledEffect = undefined;
    }


    /**
     * Remove applied auras from deleted aura effect
     * @param {ActiveEffect} effect - effect to remove
     * @param {Token} token - token instance that provided the aura
     * @param {Actor5e} actor - actor instance that provided the aura
     * 
     */
    async function RemoveAura(effect, token, actor) {
        let auraToken;
        if (token) {
            auraToken = canvas.tokens.get(token._id)
        }
        else if (actor) {
            auraToken = actor.getActiveTokens()[0]
        }
        let auraRadius = effect.flags.ActiveAuras.radius;
        for (let canvasToken of canvas.tokens.placeables) {
            let oldEffect = canvasToken.actor.effects.find(i => i.data.label === effect.label)
            if (!oldEffect) continue;
            let distance = RayDistance(canvasToken, auraToken)
            if (distance <= auraRadius) {
                if (oldEffect.getFlag('ActiveAuras', 'applied')) {
                    oldEffect.delete()
                }
            }
        }
    }

    /**
     * Loop over canvas tokens for individual tests
     * @param {Map} map - empty map to populate 
     * @param {Array} auraEffectArray - array of auras to test against
     * @param {Token} tokens - array of tokens to test against
     */
    function UpdateAllTokens(map, auraEffectArray, tokens) {
        for (let canvasToken of tokens) {
            UpdateToken(map, auraEffectArray, canvasToken)
        }
    }



    /**
     * Test individual token against aura array
    * @param {Map} map - empty map to populate 
     * @param {Array} auraEffectArray - array of auras to test against 
     * @param {Token} canvasToken - single token to test
     */
    function UpdateToken(map, auraEffectArray, canvasToken) {
        if (game.modules.get("multilevel-tokens")) {
            if (GetAllFlags(canvasToken, 'multilevel-tokens')) return;
        }
        for (let auraEffect of auraEffectArray) {
            let auraTargets = auraEffect.getFlag('ActiveAuras', 'aura')
            let MapKey = auraEffect.data.label + "-" + canvasToken.id;
            MapObject = map.get(MapKey);
            let auraToken;
            let auraRadius = auraEffect.getFlag('ActiveAuras', 'radius')
            if (auraEffect.parent.token) {
                auraToken = auraEffect.parent.token
            }
            else if (auraEffect.parent.data.token.actorLink) {
                let auraTokenArray = game.actors.get(auraEffect.parent.data._id).getActiveTokens()
                auraToken = auraTokenArray.reduce(FindClosestToken, auraTokenArray[0])
                function FindClosestToken(tokenA, tokenB) {
                    return RayDistance(tokenA, canvasToken) < RayDistance(tokenB, canvasToken) ? tokenA : tokenB
                }

            }
            else if (newToken) auraToken = newToken;
            if (auraToken.id === canvasToken.id) continue;
            if (auraTargets === "Allies" && (auraToken.data.disposition !== canvasToken.data.disposition)) continue;
            if (auraTargets === "Enemy" && (auraToken.data.disposition === canvasToken.data.disposition)) continue;

            let distance = RayDistance(canvasToken, auraToken)
            if ((distance !== false) && (distance <= auraRadius) && !effectDisabled) {
                if (MapObject) {
                    MapObject.add = true
                }
                else {
                    map.set(MapKey, { add: true, token: canvasToken, effect: auraEffect })
                }
            }
            else if (!MapObject?.add && canvasToken?.actor?.effects.entries.some(e => e.data.label === auraEffect.data.label)) {
                if (MapObject) {
                    MapObject.add = false
                }
                else {
                    map.set(MapKey, { add: false, token: canvasToken, effect: auraEffect })
                }
            }
        }
    }

    /**
     * 
     * @param {Token} token1 - test token
     * @param {Token} token2 - aura token
     */
    function RayDistance(token1, token2) {
        const ray = new Ray(token1.center, token2.center)
        const segments = [{ ray }]
        let distance;
        if (game.settings.get('ActiveAuras', 'measurement') === false) {
            distance = (ray.distance / canvas.grid.grid.options.dimensions.size) * canvas.grid.grid.options.dimensions.distance
        }
        else if (game.settings.get('ActiveAuras', 'measurement') === true) {
            distance = canvas.grid.measureDistances(segments, { gridSpaces: true })[0]
        }
        let collision = canvas.walls.checkCollision(ray)
        if (collision && game.settings.get("ActiveAuras", "wall-block") === true) return false
        return distance
    }

    /**
     * 
     * @param {Token} token - token to apply effect too
     * @param {ActiveEffect} effectData - effect data to generate effect
     */
    async function CreateActiveEffect(token, effectData) {
        if (token.actor.effects.entries.find(e => e.data.label === effectData.label)) return
        await token.actor.createEmbeddedEntity("ActiveEffect", effectData);
        console.log(`Active Auras: applied ${effectData.label} to ${token.name}`)

    }

    /**
     * 
     * @param {Token} token - token instance to remove effect from
     * @param {String} effectLabel - label of effect to remove
     */
    function RemoveActiveEffects(token, effectLabel) {
        for (let tokenEffects of token.actor.effects) {
            if (tokenEffects.data.label === effectLabel && tokenEffects.data.flags?.ActiveAuras.applied === true) {
                tokenEffects.delete()
                console.log(`Active Auras: removed ${effectLabel} to ${token.name}`)

            }
        }
    }
})