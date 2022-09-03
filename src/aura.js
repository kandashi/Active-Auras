let existingActiveEffectsApply;
const AA_MODULE_NAME = "ActiveAuras";
let AAsocket;
let AuraMap = new Map()
let AAdebug = false
class ActiveAuras {

    /**
     * 
     * @param {Token} movedToken - optional value for further extension, currently unused
     * Locate all auras on the canvas, create map of tokens to update, update tokens 
     */
    static async MainAura(movedToken, source, sceneID) {
        let perfStart;
        let perfEnd;
        if (AAdebug) { perfStart = performance.now() }
        if (typeof movedToken?.documentName !== "string") movedToken = movedToken?.document ?? undefined
        if (AAdebug) { console.log(source) }
        if (!AAgm) return;
        const sceneCombat = game.combats.filter(c => c.scene?.id === sceneID)
        if (game.settings.get("ActiveAuras", "combatOnly") && !sceneCombat[0]?.started) {
            if (AAdebug) { console.warn("Active Auras not active when not in combat") }
            return;w
        }
        if (sceneID !== canvas.id) return ui.notifications.warn("An update was called on a non viewed scene, auras will be updated when you return to that scene")

        let map = new Map();
        let updateTokens = canvas.tokens.placeables
        let auraTokenId;

        if (movedToken !== undefined) {
            if (AAhelpers.IsAuraToken(movedToken.id, sceneID)) {
                auraTokenId = movedToken.data._id
            }
            else if (getProperty(movedToken, "flags.token-attacher")) {
                if (AAdebug) console.log("ActiveAuras: token attacher movement")
            }
            else {
                updateTokens = [canvas.tokens.get(movedToken.id)];
            }
        }
        map = ActiveAuras.UpdateAllTokens(map, updateTokens, auraTokenId)
        if (AAdebug) {
            perfEnd = performance.now()
            console.log(`Active Auras Find Auras took ${perfEnd - perfStart} ms, FPS:${Math.round(canvas.app.ticker.FPS)}`)
        }

        for (const mapEffect of map) {
            const MapKey = mapEffect[0]
            map.set(MapKey, { add: mapEffect[1].add, token: mapEffect[1].token, effect: mapEffect[1].effect.data })
        }
        if (AAdebug) console.log(map)



        map.forEach(compareMap)

        /**
         * 
         * @param {map value} value 
         * @param {map key} key 
         * @param {map object} map1 
         * Loop over the map to remove any "add.false" entries where a "add.true" is present, prevents odd ordering from removing auras when in range of 2 or more of the same aura
         * Where 2 of the same type of aura are present, choose the higher of the 2 values to update too
         */
        function compareMap(value, key, map1) {
            const iterator1 = map1[Symbol.iterator]();
            for (const m of iterator1) {
                if (m[0] === key) continue;

                if ((m[1].effect.label === value.effect.label) && (m[1].add === true && value.add === true)) {
                    for (let e = 0; e < m[1].effect.changes.length; e++) {
                        if (typeof (parseInt(m[1].effect.changes[e].value)) !== "number") continue;
                        const oldEffectValue = parseInt(value.effect.changes[e].value);
                        const newEffectValue = parseInt(m[1].effect.changes[e].value)
                        if (oldEffectValue < newEffectValue) {
                            map1.delete(key)
                        }
                    }
                }

                else if ((m[1].effect.label === value.effect.label) && (m[1].add === true || value.add === true) && (m[1].token.id === value.token.id)) {
                    if (value.add === false) map.delete(key)
                }
            }

        }

        for (const update of map) {
            if (update[1].add) {
                await ActiveAuras.CreateActiveEffect(update[1].token.id, update[1].effect)
            }
            else {
                await ActiveAuras.RemoveActiveEffects(update[1].token.id, update[1].effect.origin)
            }
        }
        if (AAdebug) {
            perfEnd = performance.now()
            console.log(`Active Auras Main Function took ${perfEnd - perfStart} ms, FPS:${Math.round(canvas.app.ticker.FPS)}`)
        }
    }

    /**
         * Loop over canvas tokens for individual tests
         * @param {Map} map - empty map to populate 
         * @param {Array} auraEffectArray - array of auras to test against
         * @param {Token} tokens - array of tokens to test against
         */
    static UpdateAllTokens(map, tokens, tokenId) {
        for (const canvasToken of tokens) {
            ActiveAuras.UpdateToken(map, canvasToken, tokenId)
        }
        return map
    }

    /**
     * Test individual token against aura array
     * @param {Map} map - empty map to populate 
     * @param {Array} auraEffectArray - array of auras to test against 
     * @param {Token} canvasToken - single token to test
     */
    static UpdateToken(map, canvasToken, tokenId) {
        if (canvasToken.data.flags['multilevel-tokens']) return;
        if (canvasToken.actor === null) return;
        if (canvasToken.actor.data.type == "vehicle") return
        let tokenAlignment;
        if (game.system.id === "dnd5e" || game.system.id === "sw5e") {
            try {
                tokenAlignment = canvasToken.actor?.data.data.details.alignment.toLowerCase();
            } catch (error) {
                console.error([`ActiveAuras: the token has an unreadable alignment`, canvasToken])
            }
        }
        const MapKey = canvasToken.scene.id;
        let MapObject = AuraMap.get(MapKey)
        let checkEffects = MapObject.effects;
        //Check for other types of X aura if the aura token is moved
        if (tokenId && canvasToken.id !== tokenId) {
            checkEffects = checkEffects.filter(i => i.entityId === tokenId)
            let duplicateEffect = []
            checkEffects.forEach(e => duplicateEffect = (MapObject.effects.filter(i => (i.data?.label === e.data?.label) && i.entityId !== tokenId)));
            checkEffects = checkEffects.concat(duplicateEffect)
        }

        for (const auraEffect of checkEffects) {
            const auraTargets = auraEffect.data.flags?.ActiveAuras?.aura

            const { radius, height, hostile, wildcard, extra } = auraEffect.data.flags?.ActiveAuras;
            let { type, alignment } = auraEffect.data.flags?.ActiveAuras;
            const { parentActorLink, parentActorId } = auraEffect
            type = type !== undefined ? type.toLowerCase() : "";
            alignment = alignment !== undefined ? alignment.toLowerCase() : "";
            if (alignment && !tokenAlignment.includes(alignment) && !tokenAlignment.includes("any")) continue; // cleaned up alignment check and moved here. 

            let auraEntity, distance;
            /*
            let auraType = auraEffect.data.flags?.ActiveAuras?.type !== undefined ? auraEffect.data.flags?.ActiveAuras?.type.toLowerCase() : "";
            let auraAlignment = auraEffect.data.flags?.ActiveAuras?.alignment !== undefined ? auraEffect.data.flags?.ActiveAuras?.alignment.toLowerCase() : "";
            let hostileTurn = auraEffect.data.flags?.ActiveAuras?.hostile
            */
            const auraEntityType = auraEffect.entityType

            switch (auraEntityType) {
                //{data: testEffect.data, parentActorLink :testEffect.parent.data.token.actorLink, parentActorId : testEffect.parent._id, tokenId: testToken.id, templateId: template._id, }
                case "token": {
                    if (parentActorLink) {
                        const auraTokenArray = game.actors.get(parentActorId).getActiveTokens()
                        if (auraTokenArray.length > 1) {
                            auraEntity = auraTokenArray[0]
                            console.error("AA: Duplicate Linked Tokens detected, defaulting to first token.")
                        }
                        else auraEntity = auraTokenArray[0]
                    }
                    else auraEntity = canvas.tokens.get(auraEffect.entityId)

                    if (auraEntity.id === canvasToken.id) continue;

                    if (!AAhelpers.DispositionCheck(auraTargets, auraEntity.data.disposition, canvasToken.data.disposition)) continue;
                    if (type) {
                        if (!AAhelpers.CheckType(canvasToken, type)) continue
                    }
                    if (hostile && canvasToken.data._id !== game.combats.active?.current.tokenId) continue;

                    if (game.system.id === "swade") {
                        if (!AAhelpers.Wildcard(canvasToken, wildcard, extra)) continue
                    }
                    const shape = getAuraShape(auraEntity, radius)
                    distance = AAmeasure.inAura(canvasToken, auraEntity, game.settings.get("ActiveAuras", "wall-block"), height, radius, shape)
                }
                    break;
                case "template": {
                    auraEntity = canvas.templates.get(auraEffect.entityId)

                    if (type) {
                        if (!AAhelpers.CheckType(canvasToken, type)) continue
                    }
                    if (hostile && canvasToken.data._id !== game.combats.active.current.tokenId) return;
                    if (auraEffect.casterDisposition) {
                        if (!AAhelpers.DispositionCheck(auraTargets, auraEffect.casterDisposition, canvasToken.data.disposition)) continue;
                    }
                    const shape = getTemplateShape(auraEntity)
                    let templateDetails = auraEntity
                    //templateDetails.shape = shape
                    distance = AAmeasure.isTokenInside(templateDetails, canvasToken, game.settings.get("ActiveAuras", "wall-block"));
                }
                    break;
                case "drawing": {
                    auraEntity = canvas.drawings.get(auraEffect.entityId)

                    if (type) {
                        if (!AAhelpers.CheckType(canvasToken, type)) continue
                    }
                    if (hostile && canvasToken.data._id !== game.combats.active.current.tokenId) return;
                    const shape = getDrawingShape(auraEntity.data)
                    distance = AAmeasure.inAura(canvasToken, auraEntity, game.settings.get("ActiveAuras", "wall-block"), height, radius, shape)
                }
                    break;
            }
            const MapKey = auraEffect.data.origin + "-" + canvasToken.id + "-" + auraEntity.id + "-" + auraEffect.data.label;
            MapObject = map.get(MapKey);


            if (distance && !auraEffect.data.flags?.ActiveAuras?.Paused) {
                if (MapObject) {
                    MapObject.add = true
                }
                else {
                    map.set(MapKey, { add: true, token: canvasToken, effect: auraEffect })
                }
            }
            else if (!MapObject?.add && canvasToken.document.actor?.effects.contents.some(e => e.data.origin === auraEffect.data.origin && e.data.label === auraEffect.data.label)) {
                if (MapObject) {
                    MapObject.add = false
                }
                else {
                    map.set(MapKey, { add: false, token: canvasToken, effect: auraEffect })
                }
            }
        }
        return map
    }

    /**
        * 
        * @param {Token} token - token to apply effect too
        * @param {ActiveEffect} effectData - effect data to generate effect
        */
    static async CreateActiveEffect(tokenID, oldEffectData) {
        const token = canvas.tokens.get(tokenID)

        const duplicateEffect = token.document.actor.effects.contents.find(e => e.data.origin === oldEffectData.origin && e.data.label === oldEffectData.label)
        if (getProperty(duplicateEffect, "data.flags.ActiveAuras.isAura")) return;
        if (duplicateEffect) {
            if (duplicateEffect.data.origin === oldEffectData.origin) return;
            if (JSON.stringify(duplicateEffect.data.changes) === JSON.stringify(oldEffectData.changes)) return;
            else await ActiveAuras.RemoveActiveEffects(tokenID, oldEffectData.origin)
        }
        let effectData = duplicate(oldEffectData)
        if (effectData.flags.ActiveAuras.onlyOnce) {
            const AAID = oldEffectData.origin.replaceAll(".", "")
            if (token.data.flags.ActiveAuras?.[AAID]) return;
            else await token.document.setFlag("ActiveAuras", AAID, true)
        }
        if (effectData.flags.ActiveAuras?.isMacro) {
            for (let [changeIndex, change] of effectData.changes.entries()) {
                let newValue = change.value;
                if (change.key === "macro.execute" || change.key === "macro.itemMacro") {

                    if (typeof newValue === "string") {
                        newValue = [newValue]

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
                        if (typeof change.value === "string") {
                            change.value = newValue[0];
                        }
                        else {
                            change.value = newValue;
                        }
                    }
                }
            }
        }
        ['ignoreSelf', 'hidden', 'height', 'alignment', 'type', 'aura', 'radius', 'isAura', 'height'].forEach(e => delete effectData.flags.ActiveAuras[e])
        if (effectData.flags.ActiveAuras.time !== "None" && effectData.flags.ActiveAuras.time !== undefined && game.modules.get("dae")?.active) {
            effectData.flags.dae?.specialDuration?.push(effectData.flags.ActiveAuras.time)
        }

        await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        console.log(game.i18n.format("ACTIVEAURAS.ApplyLog", { effectDataLabel: effectData.label, tokenName: token.name }))
    }

    /**
     * 
     * @param {Token} token - token instance to remove effect from
     * @param {String} effectOrigin - origin of effect to remove
     */
    static async RemoveActiveEffects(tokenID, effectOrigin) {
        const token = canvas.tokens.get(tokenID)
        for (const tokenEffects of token.actor.effects) {
            if (tokenEffects.data.origin === effectOrigin && tokenEffects.data.flags?.ActiveAuras?.applied === true) {
                await token.actor.deleteEmbeddedDocuments("ActiveEffect", [tokenEffects.id])
                console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { effectDataLabel: effectOrigin, tokenName: token.name }))

            }
        }
    }

}