Hooks.on('init', () => {
    game.settings.register("ActiveAuras", "measurement", {
        name: game.i18n.format("ACTIVEAURAS.measurmentoptions_name"),
        hint: game.i18n.format("ACTIVEAURAS.measurmentoptions_hint"),
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register("ActiveAuras", "wall-block", {
        name: game.i18n.format("ACTIVEAURAS.walltoptions_name"),
        hint: game.i18n.format("ACTIVEAURAS.walltoptions_hint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register("ActiveAuras", "vertical-euclidean", {
        name: game.i18n.format("ACTIVEAURAS.measurementHeight_name"),
        hint: game.i18n.format("ACTIVEAURAS.measurementHeight_hint"),
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register("ActiveAuras", "dead-aura", {
        name: game.i18n.format("ACTIVEAURAS.removeDead"),
        hint: game.i18n.format("ACTIVEAURAS.removeDeadHint"),
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register("ActiveAuras", "debug", {
        name: game.i18n.format("ACTIVEAURAS.debug_name"),
        hint: game.i18n.format("ACTIVEAURAS.debug_hint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
});

let existingActiveEffectsApply;

Hooks.on("ready", () => {
    const MODULE_NAME = "ActiveAuras";

    /**
     * Bind a filter to the ActiveEffect.apply() prototype chain
     */
    existingActiveEffectsApply = CONFIG.ActiveEffect.entityClass.prototype.apply;
    CONFIG.ActiveEffect.entityClass.prototype.apply = ActiveAurasApply;

    /**
     * Hooks onto effect sheet to add aura configuration
     */
    Hooks.on("renderActiveEffectConfig", async (sheet, html) => {
        const flags = sheet.object.data.flags ?? {};
        const FormIsAura = game.i18n.format("ACTIVEAURAS.FORM_IsAura");
        const FormIgnoreSelf = game.i18n.format("ACTIVEAURAS.FORM_IgnoreSelf");
        const FormHidden = game.i18n.format("ACTIVEAURAS.FORM_Hidden");
        const FormTargetsName = game.i18n.format("ACTIVEAURAS.FORM_TargetsName");
        const FormTargetsEnemy = game.i18n.format("ACTIVEAURAS.FORM_TargetsEnemy");
        const FormTargetsAllies = game.i18n.format("ACTIVEAURAS.FORM_TargetsAllies");
        const FormTargetsAll = game.i18n.format("ACTIVEAURAS.FORM_TargetsAll");
        const FormRadius = game.i18n.format("ACTIVEAURAS.FORM_Radius");
        const AuraTab = game.i18n.format("ACTIVEAURAS.tabname");
        const FormCheckHeight = game.i18n.format("ACTIVEAURAS.FORM_Height");
        const FormCheckAlignment = game.i18n.format("ACTIVEAURAS.FORM_Alignment");
        const FormCheckType = game.i18n.format("ACTIVEAURAS.FORM_Type")
        const FormGood = game.i18n.format("ACTIVEAURAS.FORM_Good")
        const FormNeutral = game.i18n.format("ACTIVEAURAS.FORM_Neutral")
        const FormEvil = game.i18n.format("ACTIVEAURAS.FORM_Evil")
        const FormSaveEnable = game.i18n.format("ACTIVEAURAS.FORM_SaveEnable")
        const FormSaveDC = game.i18n.format("ACTIVEAURAS.FORM_SaveDC")
        const FormTypePrompt = game.i18n.format("ACTIVEAURAS.FORM_TypePrompt")
        const FormRadiusPrompt = game.i18n.format("ACTIVEAURAS.FORM_RadiusPrompt")
        const FormSavePrompt = game.i18n.format("ACTIVEAURAS.FORM_SavePrompt")


        const tab = `<a class="item" data-tab="ActiveAuras"><i class="fas fa-broadcast-tower"></i> ${AuraTab}</a>`;
        let type = flags[MODULE_NAME]?.type ? flags[MODULE_NAME]?.type : "";
        let alignment = flags[MODULE_NAME]?.alignment ? flags[MODULE_NAME]?.alignment : "";
        let save = flags[MODULE_NAME]?.save ? flags[MODULE_NAME]?.save : "";

        const contents = `
        <div class="tab" data-tab="ActiveAuras">
            <div class="form-group">
                <label>${FormIsAura}?</label>
                <input name="flags.${MODULE_NAME}.isAura" type="checkbox" ${flags[MODULE_NAME]?.isAura ? 'checked' : ''}></input>
             </div>
             <div class="form-group">
                <label>${FormIgnoreSelf}?</label>
                <input name="flags.${MODULE_NAME}.ignoreSelf" type="checkbox" ${flags[MODULE_NAME]?.ignoreSelf ? 'checked' : ''}></input>
            </div>
            <div class="form-group">
                <label>${FormHidden}?</label>
                <input name="flags.${MODULE_NAME}.hidden" type="checkbox" ${flags[MODULE_NAME]?.hidden ? 'checked' : ''}></input>
            </div>
            <div class="form-group">
                <label>${FormCheckHeight}</label>
                <input name="flags.${MODULE_NAME}.height" type="checkbox" ${flags[MODULE_NAME]?.height ? 'checked' : ''}></input>
            </div>
            <div class="form-group">
                <label>${FormCheckAlignment}:</label>
                <select name="flags.${MODULE_NAME}.alignment" data-dtype="String" value=${alignment}>
                    <option value="" ${flags[MODULE_NAME]?.alignment === '' ? 'selected' : ''}></option>
                    <option value="good"${flags[MODULE_NAME]?.alignment === 'good' ? 'selected' : ''}>${FormGood}</option>
                    <option value="neutral"${flags[MODULE_NAME]?.alignment === 'neutral' ? 'selected' : ''}>${FormNeutral}</option>
                    <option value="evil"${flags[MODULE_NAME]?.alignment === 'evil' ? 'selected' : ''}>${FormEvil}</option>
                </select>
            </div>
            <div class="form-group">
                <label>${FormCheckType}</label>
                <input id="type" name="flags.${MODULE_NAME}.type" type="text" value="${type}" placeholder="${FormTypePrompt}"></input>
            </div>
            <div class="form-group">
                <label>${FormTargetsName}:</label>
                <select name="flags.${MODULE_NAME}.aura" data-dtype="String" value=${flags[MODULE_NAME]?.aura}>
                    <option value="None" ${flags[MODULE_NAME]?.aura === 'None' ? 'selected' : ''}></option>
                    <option value="Enemy"${flags[MODULE_NAME]?.aura === 'Enemy' ? 'selected' : ''}>${FormTargetsEnemy}</option>
                    <option value="Allies"${flags[MODULE_NAME]?.aura === 'Allies' ? 'selected' : ''}>${FormTargetsAllies}</option>
                    <option value="All"${flags[MODULE_NAME]?.aura === 'All' ? 'selected' : ''}>${FormTargetsAll}</option>
                </select>
            </div>
            <div class="form-group">
                <label>${FormRadius}</label>
                <input id="radius" name="flags.${MODULE_NAME}.radius" type="number" min="0" step="any" value="${flags[MODULE_NAME]?.radius}" placeholder="${FormRadiusPrompt}"></input>
            </div> 
            <div class="form-group">
            <label>${FormSaveEnable}</label>
            <input id="save" name="flags.${MODULE_NAME}.save" type="text" value="${save}" placeholder="${FormSavePrompt}"></input>
        </div>
            <div class="form-group">
                <label>${FormSaveDC}</label>
                <input id="savedc" name="flags.${MODULE_NAME}.savedc" type="number" min="0" value="${flags[MODULE_NAME]?.savedc}"></input>
            </div> 
            
        </div>`;

        html.find(".tabs .item").last().after(tab);
        if (!flags[MODULE_NAME]?.applied) html.find(".tab").last().after(contents);
    });

    let AuraMap = new Map()
    let debug = false
    if (game.settings.get("ActiveAuras", "debug")) debug = true


    /**
    * Re-run aura detection on token creation
    */
    Hooks.on("createToken", (_scene, token) => {
        let actor = game.actors.get(token.actorId)
        try {
            if (actor.effects?.entries) {
                for (let effect of actor.effects?.entries) {
                    if (effect.getFlag('ActiveAuras', 'isAura')) {
                        setTimeout(() => {
                            if (debug) console.log("createToken, collate auras true false")
                            CollateAuras(canvas, true, false, "createToken")
                        }, 20)
                        break;
                    }
                }
            }
        } catch (error) {
            if (error.message === "Cannot read property 'effects' of null")
                console.error(token, `This token has a no actor linked to it, please cleanup this token`)
        }
    });

    /**
     * @todo
     * Filter for aura effects on deleted token and remove from canvas tokens
     */
    Hooks.on("preDeleteToken", async (_scene, token) => {
        if (IsAuraToken(token, canvas)) {
            setTimeout(() => {
                if (debug) console.log("preDelete, collate auras false true")
                CollateAuras(canvas, false, true, "preDeleteToken")
            }, 20)
        }
    });

    Hooks.on("preUpdateToken", (_scene, token, update, _flags, _id) => {
        if (!update.actorData?.effects) return;
        let removed = token.actorData?.effects?.filter(x => !update.actorData?.effects?.includes(x));
        let added = update.actorData?.effects?.filter(x => !token.actorData?.effect?.includes(x))
        if (removed?.length > 0) {
            for (let effect of removed) {
                if (effect.flags?.ActiveAuras?.isAura) {
                    setTimeout(() => {
                        if (debug) console.log("preupdate, collate auras true true")
                        CollateAuras(canvas, true, true, "preUpdateToken, removal")
                    }, 50)
                    return;
                }
            }
        }
        else if (added?.length > 0) {
            for (let effect of added) {
                if (effect.flags?.ActiveAuras?.isAura) {
                    setTimeout(() => {
                        if (debug) console.log("preupdate, collate auras true false")
                        CollateAuras(canvas, true, false, "preUpdateToken, addition")
                    }, 50)
                    return;
                }
            }
        }
    })

    /**
     * On token movement run MainAura
     */
    Hooks.on("updateToken", async (_scene, token, update, _flags, _id) => {
        if (("y" in update || "x" in update || "elevation" in update)) {
            if (debug) console.log("movement, main aura")
            await MainAura(token, "movement update")
        }

        if ("hidden" in update && IsAuraToken(token, canvas)) {
            setTimeout(() => {
                if (debug) console.log("hidden, collate auras true true")
                CollateAuras(canvas, true, true, "updateToken")
            }, 20)
        }
        if (IsAuraToken(token, canvas) && update?.actorData?.data?.attributes?.hp?.value <= 0) {
            setTimeout(() => {
                if (debug) console.log("0hp, collate auras true true")
                CollateAuras(canvas, true, true, "updateToken, dead")
            }, 50)
        }
    });


    /**
     * @todo
     */
    Hooks.on("updateActiveEffect", (_actor, effect, _update) => {
        if (effect.flags?.ActiveAuras?.isAura) {
            setTimeout(() => {
                if (debug) console.log("updateAE, collate auras true true")
                CollateAuras(canvas, true, true, "updateActiveEffect")
            }, 20)
        }
    })

    /**
     * On removal of active effect from linked actor, if aura remove from canvas.tokens
     */
    Hooks.on("deleteActiveEffect", (_actor, effect) => {
        let applyStatus = effect.flags?.ActiveAuras?.applied;
        let auraStatus = effect.flags?.ActiveAuras?.isAura;
        if (!applyStatus && auraStatus) {
            setTimeout(() => {
                if (debug) console.log("deleteAE, collate auras true false")
                CollateAuras(canvas, false, true, "deleteActiveEffect")
            }, 20)
        }
    });

    /**
     * On creation of active effect on linked actor, run MainAura
     */
    Hooks.on("createActiveEffect", (_actor, effect) => {
        if (!effect.flags?.ActiveAuras?.applied && effect.flags?.ActiveAuras?.isAura) {
            setTimeout(() => {
                if (debug) console.log("deleteAE, collate auras true false")
                CollateAuras(canvas, true, false, "createActiveEffect")
            }, 20)
        };
    });

    Hooks.on("canvasReady", (canvas) => {
        setTimeout(() => {
            if (debug) console.log("canvasReady, collate auras true false")
            CollateAuras(canvas, true, false, "ready")
        }, 20)
    })

    Hooks.on("preUpdateActor", (actor, update) => {
        if (update.data?.attributes?.hp?.value <= 0) {
            if (IsAuraToken(actor.getActiveTokens()[0].data, canvas)) {
                if (debug) console.log("0hp, collate auras true true")
                Hooks.once("updateActor", () => {
                    CollateAuras(canvas, true, true, "updateActor, dead")
                })
            }
        }
        if (actor.data.data.attributes.hp.value === 0 && update?.data?.attributes?.hp?.value > 0) {
            Hooks.once("updateActor", () => {
                CollateAuras(canvas, true, false, "updateActor, revived")
            })
        }
    })

    function GetAllFlags(entity, scope) {
        {
            const scopes = SetupConfiguration.getPackageScopes();
            if (!scopes.includes(scope)) throw new Error(`Invalid scope`);
            return getProperty(entity.data.flags, scope);
        }
    }

    function IsAuraToken(token, canvas) {
        let MapKey = canvas.scene._id;
        MapObject = AuraMap.get(MapKey);
        if (!MapObject.effects) return;
        for (let effect of MapObject.effects) {
            if (effect.tokenId === token._id) return true;

        }
    }

    function CollateAuras(canvas, checkAuras, removeAuras, source) {
        if (debug) console.log(source)
        let gm = game.user === game.users.find((u) => u.isGM && u.active)
        if (!gm) return;
        let MapKey = canvas.scene._id;
        MapObject = AuraMap.get(MapKey);
        let effectArray = [];
        for (let testToken of canvas.tokens.placeables) {

            if (testToken.actor === null || testToken.actor === undefined) continue;
            if (game.modules.get("multilevel-tokens")?.active) {
                if (GetAllFlags(testToken, 'multilevel-tokens')) continue;
            }
            if ((testToken.data.actorData?.attributes?.hp?.value <= 0 || testToken.actor?.data.data.attributes.hp.value <= 0) && game.settings.get("ActiveAuras", "dead-aura")) continue;
            for (let testEffect of testToken?.actor?.effects.entries) {
                if (testEffect.getFlag('ActiveAuras', 'isAura')) {
                    if (testEffect.data.disabled) continue;
                    if (testEffect.getFlag('ActiveAuras', 'hidden') && testToken.data.hidden) continue;
                    let newEffect = { data: duplicate(testEffect.data), parentActorLink: testEffect.parent.data.token.actorLink, parentActorId: testEffect.parent._id, tokenId: testToken.id }
                    for (let change of newEffect.data.changes) {
                        if (typeof change.value === "string" && change.key !== "macro.execute" && change.key !== "macro.itemMacro") {
                            if (change.value.includes("@")) {
                                let dataPath = change.value.substring(2)
                                let newValue = getProperty(testToken.actor.getRollData(), dataPath)
                                const changeIndex = newEffect.data.changes.findIndex(i => i.value === change.value && i.key === change.key)
                                newEffect.data.changes[changeIndex].value = `+ ${newValue}`
                            }
                        }
                        if (change.key === "macro.execute" || change.key === "macro.itemMacro") newEffect.data.flags.ActiveAuras.isMacro = true
                    }
                    newEffect.data.disabled = false
                    let macro = newEffect.data.flags.ActiveAuras.isMacro !== undefined ? newEffect.data.flags.ActiveAuras.isMacro : false;

                    newEffect.data.flags.ActiveAuras.isAura = false;
                    newEffect.data.flags.ActiveAuras.applied = true;
                    newEffect.data.flags.ActiveAuras.isMacro = macro;
                    newEffect.data.flags.ActiveAuras.ignoreSelf = false
                        ;
                    effectArray.push(newEffect)
                }
            }
        }
        if (MapObject) {
            MapObject.effects = effectArray
        }
        else {
            AuraMap.set(MapKey, { effects: effectArray })
        }
        if (debug) console.log(AuraMap)
        if (checkAuras) {
            setTimeout(() => {
                MainAura(undefined, "Collate auras")
            }, 20)
        }
        if (removeAuras) {
            setTimeout(() => {
                RemoveAppliedAuras(canvas)
            }, 20)
        }
    }

    async function RemoveAppliedAuras() {
        let EffectsArray = [];
        let MapKey = canvas.scene._id
        MapObject = AuraMap.get(MapKey)
        MapObject.effects.forEach(i => EffectsArray.push(i.data.origin))

        for (let removeToken of canvas.tokens.placeables) {
            if (removeToken?.actor?.effects) {
                for (let testEffect of removeToken.actor.effects) {
                    if (!EffectsArray.includes(testEffect.data.origin) && testEffect.data?.flags?.ActiveAuras?.applied) {
                        await removeToken.actor.deleteEmbeddedEntity("ActiveEffect", testEffect.id)
                        console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { effectDataLabel: testEffect.data.label, tokenName: removeToken.name }))
                    }
                }
            }
        }
    }

    /**
     * 
     * @param {Token} movedToken - optional value for further extension, currently unused
     * Locate all auras on the canvas, create map of tokens to update, update tokens 
     */
    async function MainAura(movedToken, source) {
        if (debug) console.log(source)
        let gm = game.user === game.users.find((u) => u.isGM && u.active)
        if (!gm) return;

        let map = new Map();
        let updateTokens = canvas.tokens.placeables
        let auraTokenId;

        if (movedToken !== undefined) {
            if (!IsAuraToken(movedToken, canvas)) {
                updateTokens = [];
                updateTokens.push(canvas.tokens.get(movedToken._id))
            }
            if (IsAuraToken(movedToken, canvas)) {
                auraTokenId = movedToken._id
            }
        }
        UpdateAllTokens(map, updateTokens, auraTokenId)

        for (let mapEffect of map) {
            let MapKey = mapEffect[0]
            map.set(MapKey, { add: mapEffect[1].add, token: mapEffect[1].token, effect: mapEffect[1].effect.data })
        }
        if (debug) console.log(map)
        for (let update of map) {
            if (update[1].add) {
                await CreateActiveEffect(update[1].token.id, update[1].effect)
            }
            else {
                await RemoveActiveEffects(update[1].token.id, update[1].effect.label)
            }
        }
    }




    /**
     * Loop over canvas tokens for individual tests
     * @param {Map} map - empty map to populate 
     * @param {Array} auraEffectArray - array of auras to test against
     * @param {Token} tokens - array of tokens to test against
     */
    async function UpdateAllTokens(map, tokens, tokenId) {
        for (let canvasToken of tokens) {
            UpdateToken(map, canvasToken, tokenId)
        }
    }



    /**
     * Test individual token against aura array
     * @param {Map} map - empty map to populate 
     * @param {Array} auraEffectArray - array of auras to test against 
     * @param {Token} canvasToken - single token to test
     */
    function UpdateToken(map, canvasToken, tokenId) {
        if (game.modules.get("multilevel-tokens")) {
            if (GetAllFlags(canvasToken, 'multilevel-tokens')) return;
        }
        if (canvasToken.actor === null) return;

        let tokenType;
        switch (canvasToken.actor.data.type) {
            case "npc": {
                try {
                    tokenType = canvasToken.actor?.data.data.details.type.toLowerCase();
                } catch (error) {
                    console.error([`ActiveAuras the token has an unreadable type`, canvasToken])
                }
            }
                break;
            case "character": {
                try {
                    tokenType = canvasToken.actor?.data.data.details.race.toLowerCase()
                } catch (error) {
                    console.error([`ActiveAuras the token has an unreadable type`, canvasToken])
                }
            }
                break;
            case "vehicle": return;
        }
        tokenType = tokenType.replace("-", " ").split(" ");
        let humanoidRaces = ["human", "orc", "elf", "tiefling", "gnome", "aaracokra", "dragonborn", "dwarf", "halfling", "leonin", "satyr", "genasi", "goliath", "aasimar", "bugbear", "firbolg", "goblin", "lizardfolk", "tabxi", "triton", "yuan-ti", "tortle", "changling", "kalashtar", "shifter", "warforged", "gith", "centaur", "loxodon", "minotaur", "simic hybrid", "vedalken", "verdan", "locathah", "grung"]
        for (x of tokenType) {
            if (humanoidRaces.includes(x)) {
                tokenType = "humanoid"
                continue;
            }
        }
        let tokenAlignment;
        try {
             tokenAlignment = canvasToken.actor?.data.data.details.alignment.toLowerCase();
             } catch (error) {
                    console.error([`ActiveAuras the token has an unreadable alignment`, canvasToken])
                }
        let MapKey = canvasToken.scene._id;
        MapObject = AuraMap.get(MapKey)
        let checkEffects = MapObject.effects;
        if (tokenId) {
            checkEffects = checkEffects.filter(i => i.tokenId === tokenId)
        }


        for (let auraEffect of checkEffects) {

            let auraTargets = auraEffect.data.flags?.ActiveAuras?.aura
            let MapKey = auraEffect.data.label + "-" + canvasToken.id;
            MapObject = map.get(MapKey);
            let auraToken;
            let auraRadius = auraEffect.data.flags?.ActiveAuras?.radius;
            let auraHeight = auraEffect.data.flags?.ActiveAuras?.height;
            let auraType = auraEffect.data.flags?.ActiveAuras?.type  !== undefined ? auraEffect.data.flags?.ActiveAuras?.type.toLowerCase(): "";
            let auraAlignment = auraEffect.data.flags?.ActiveAuras?.alignment !== undefined ? auraEffect.data.flags?.ActiveAuras?.alignment.toLowerCase() : "";

            //{data: testEffect.data, parentActorLink :testEffect.parent.data.token.actorLink, parentActorId : testEffect.parent._id, tokenId: testToken.id}
            if (auraEffect.parentActorLink) {
                let auraTokenArray = game.actors.get(auraEffect.parentActorId).getActiveTokens()
                if (auraTokenArray.length > 1) {
                    auraToken = auraTokenArray.reduce(FindClosestToken, auraTokenArray[0])
                    function FindClosestToken(tokenA, tokenB) {
                        return getDistance(tokenA, canvasToken, game.settings.get("ActiveAuras", "wall-block"), auraHeight) < getDistance(tokenB, canvasToken, game.settings.get("ActiveAuras", "wall-block"), auraHeight) ? tokenA : tokenB
                    }
                }
                else auraToken = auraTokenArray[0]
            }
            else if (auraEffect.tokenId) {
                auraToken = canvas.tokens.get(auraEffect.tokenId)
            }
            if (auraToken.id === canvasToken.id) continue;
            if (auraTargets === "Allies" && (auraToken.data.disposition !== canvasToken.data.disposition)) continue;
            if (auraTargets === "Enemy" && (auraToken.data.disposition === canvasToken.data.disposition)) continue;
            if (auraAlignment !== "" && !tokenAlignment.includes(auraAlignment) && !tokenAlignment.includes("any")) continue;
            if (auraType !== "" && !tokenType.includes(auraType) && !tokenType.includes("any")) continue;

            let distance = getDistance(canvasToken, auraToken, game.settings.get("ActiveAuras", "wall-block"), auraHeight)
            if ((distance !== false) && (distance <= auraRadius)) {
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



    function getDistance(t1, t2, wallblocking = false, auraHeight) {
        //Log("get distance callsed");
        var x, x1, y, y1, d, r, segments = [], rdistance, distance;
        switch (game.settings.get("ActiveAuras", "measurement",)) {
            case (true): {
                for (x = 0; x < t1.data.width; x++) {
                    for (y = 0; y < t1.data.height; y++) {
                        const origin = new PIXI.Point(...canvas.grid.getCenter(t1.data.x + (canvas.dimensions.size * x), t1.data.y + (canvas.dimensions.size * y)));
                        for (x1 = 0; x1 < t2.data.width; x1++) {
                            for (y1 = 0; y1 < t2.data.height; y1++) {
                                const dest = new PIXI.Point(...canvas.grid.getCenter(t2.data.x + (canvas.dimensions.size * x1), t2.data.y + (canvas.dimensions.size * y1)));
                                const r = new Ray(origin, dest);
                                if (wallblocking && canvas.walls.checkCollision(r)) {
                                    //Log(`ray ${r} blocked due to walls`);
                                    continue;
                                }
                                segments.push({ ray: r });
                            }
                        }
                    }
                }
                // console.log(segments);
                if (segments.length === 0) {
                    //Log(`${t2.data.name} full blocked by walls`);
                    return false;
                }
                rdistance = canvas.grid.measureDistances(segments, { gridSpaces: true });
                distance = rdistance[0];
                rdistance.forEach(d => {
                    if (d < distance)
                        distance = d;
                });
            }
                break;
            case (false): {
                let gs = canvas.dimensions.size
                let auraTokenSize = (t2.data.height / 2) * canvas.dimensions.distance
                for (x = 0; x < t1.data.width; x++) {
                    for (y = 0; y < t1.data.height; y++) {
                        const origin = new PIXI.Point(...canvas.grid.getCenter(t1.data.x + (canvas.dimensions.size * x), t1.data.y + (canvas.dimensions.size * y)));
                        const dest = new PIXI.Point(t2.center.x, t2.center.y);
                        const r = new Ray(origin, dest);
                        if (wallblocking && canvas.walls.checkCollision(r)) {
                            //Log(`ray ${r} blocked due to walls`);
                            continue;
                        }
                        segments.push({ ray: r });
                    }
                }
                if (segments.length === 0) {
                    //Log(`${t2.data.name} full blocked by walls`);
                    return false;
                }
                rdistance = []
                segments.forEach(i => rdistance.push(i.ray.distance / gs * canvas.dimensions.distance))
                distance = rdistance[0];
                rdistance.forEach(d => {
                    if (d < distance)
                        distance = d;
                });
                distance -= auraTokenSize
            }
        }
        if (auraHeight === true) {
            if (game.settings.get("ActiveAuras", "vertical-euclidean") === true) {
                let heightChange = Math.abs(t1.data.elevation - t2.data.elevation)
                distance = distance > heightChange ? distance : heightChange
            }
            if (game.settings.get("ActiveAuras", "vertical-euclidean") === false) {
                let a = distance;
                let b = (t1.data.elevation - t2.data.elevation)
                let c = (a * a) + (b * b)
                distance = Math.sqrt(c)
            }
        }
        return distance;

    }
    /**
    * 
    * @param {Token} token - token to apply effect too
    * @param {ActiveEffect} effectData - effect data to generate effect
    */
    async function CreateActiveEffect(tokenID, oldEffectData) {
        let token = canvas.tokens.get(tokenID)
        if (token.actor.effects.entries.find(e => e.data.label === oldEffectData.label)) return;
        if (oldEffectData.flags[MODULE_NAME].save !== "") {
            const flavor = `${CONFIG.DND5E.abilities[oldEffectData.flags[MODULE_NAME].save]} DC${oldEffectData.flags[MODULE_NAME].savedc} ${oldEffectData.label || ""}`;
            let saveRoll = (await token.actor.rollAbilitySave(oldEffectData.flags[MODULE_NAME].save, { flavor }));
            if (saveRoll && (saveRoll.total >= oldEffectData.flags[MODULE_NAME].savedc)) {
                ui.notifications.notify(game.i18n.format("ACTIVEAURAS.saveNotify", { tokenName: token.data.name, oldEffectDataLabel: oldEffectData.label }))
                return;
            }
        }
        let effectData = duplicate(oldEffectData)
        if (effectData.flags.ActiveAuras?.isMacro) {
            for (let change of effectData.changes) {
                let newValue = change.value;
                if (change.key === "macro.execute" || change.key === "macro.itemMacro") {
                    if (typeof newValue === "string") {
                        newValue = [newValue]
                    }
                    newValue = newValue.map(val => {
                        if (typeof val === "string" && val.includes("@@token")) {
                            let re = /([\s]*@@token)/gms
                            return val.replaceAll(re, ` @token`)
                        }
                        else if (typeof val === "string" && val.includes("@token")) {
                            let re = /([\s]*@token)/gms
                            return val.replaceAll(re, ` ${token.data._id}`)
                        }
                        return val;
                    });
                    if (typeof change.value === "string")
                        change.value = newValue[0];
                    else
                        change.value = newValue;
                }
            }
        }

        await token.actor.createEmbeddedEntity("ActiveEffect", effectData);
        console.log(game.i18n.format("ACTIVEAURAS.ApplyLog", { effectDataLabel: effectData.label, tokenName: token.name }))
    }

    /**
     * 
     * @param {Token} token - token instance to remove effect from
     * @param {String} effectLabel - label of effect to remove
     */
    async function RemoveActiveEffects(tokenID, effectLabel) {
        let token = canvas.tokens.get(tokenID)
        for (let tokenEffects of token.actor.effects) {
            if (tokenEffects.data.label === effectLabel && tokenEffects.data.flags?.ActiveAuras.applied === true) {
                await token.actor.deleteEmbeddedEntity("ActiveEffect", tokenEffects.id)
                console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { effectDataLabel: effectLabel, tokenName: token.name }))

            }
        }
    }

    /**
     * 
     * @param {Actor} actor 
     * @param {ActiveEffect} change 
     */
    function ActiveAurasApply(actor, change) {
        if (actor._id == change.effect.data.origin?.split('.')[1] && change.effect.data.flags?.ActiveAuras?.ignoreSelf) {
            console.log(game.i18n.format("ACTIVEAURAS.IgnoreSelfLog", { effectDataLabel: change.effect.data.label, changeKey: change.key, actorName: actor.name }));
            return null;
        }
        return existingActiveEffectsApply.bind(this)(actor, change);
    }

    CollateAuras(canvas, true, false)

})