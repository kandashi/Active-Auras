class AAhelpers {
    /**
     * 
     * @param {object} entity entity to check
     * @param {string} scope scope to check
     * @returns 
     */
    static GetAllFlags(entity, scope) {
        {
            const scopes = SetupConfiguration.getPackageScopes();
            if (!scopes.includes(scope)) throw new Error(`Invalid scope`);
            return getProperty(entity.data.flags, scope);
        }
    }

    /**
     * 
     * @param {*} token 
     * @param {*} sceneID 
     * @returns 
     */
    static IsAuraToken(token, sceneID) {
        let MapKey = sceneID;
        let MapObject = AuraMap.get(MapKey);
        if (!MapObject?.effects) return false;
        for (let effect of MapObject.effects) {
            if (effect.entityId === token.id) return true;
        }
        return false
    }

    static DispositionCheck(auraTargets, auraDis, tokenDis) {
        switch (auraTargets) {
            case "Allies": {
                if (auraDis !== tokenDis) return false
                else return true
            }
            case "Enemy": {
                if (auraDis === tokenDis) return false
                else return true
            }
            case "All": return true;
        }
    }

    static CheckType(canvasToken, type) {

        let tokenType;
        switch (canvasToken.actor.data.type) {
            case "npc": {
                try {
                    tokenType = canvasToken.actor?.data.data.details.type.toLowerCase();
                } catch (error) {
                    console.error([`ActiveAuras: the token has an unreadable type`, canvasToken])
                }
            }
                break;
            case "character": {
                try {
                    if (game.system.data.name === "sw5e") {
                        tokenType = canvasToken.actor?.data.data.details.species.toLowerCase();
                    }
                    else tokenType = canvasToken.actor?.data.data.details.race.toLowerCase();
                } catch (error) {
                    console.error([`ActiveAuras: the token has an unreadable type`, canvasToken])
                }
            }
                break;
            case "vehicle": return;
        }
        tokenType = tokenType.replace("-", " ").split(" ");
        let humanoidRaces;
        if (game.system.data.name === "sw5e") {
            humanoidRaces = ["abyssin", "aingtii", "aleena", "anzellan", "aqualish", "arcona", "ardennian", "arkanian", "balosar", "barabel", "baragwin", "besalisk", "bith", "bothan", "cathar", "cerean", "chadrafan", "chagrian", "chevin", "chironian", "chiss", "clawdite", "codruji", "colicoid", "dashade", "defel", "devoronian", "draethos", "dug", "duros", "echani", "eshkha", "ewok", "falleen", "felucian", "fleshraider", "gamorrean", "gand", "geonosian", "givin", "gotal", "gran", "gungan", "halfhuman", "harch", "herglic", "ho’din", "human", "hutt", "iktotchi", "ithorian", "jawa", "kage", "kaleesh", "kaminoan", "karkarodon", "keldor", "killik", "klatooinian", "kubaz", "kushiban", "kyuzo", "lannik", "lasat", "lurmen", "miraluka", "mirialan", "moncalamari", "mustafarian", "muun", "nautolan", "neimoidian", "noghri", "ortolan", "patrolian", "pau’an", "pa’lowick", "pyke", "quarren", "rakata", "rattataki", "rishii", "rodian", "ryn", "selkath", "shistavanen", "sithpureblood", "squib", "ssiruu", "sullustan", "talz", "tarasin", "thisspiasian", "togorian", "togruta", "toydarian", "trandoshan", "tusken", "twi'lek", "ugnaught", "umbaran", "verpine", "voss", "vurk", "weequay", "wookie", "yevetha", "zabrak", "zeltron", "zygerrian"];
        }
        else humanoidRaces = ["human", "orc", "elf", "tiefling", "gnome", "aaracokra", "dragonborn", "dwarf", "halfling", "leonin", "satyr", "genasi", "goliath", "aasimar", "bugbear", "firbolg", "goblin", "lizardfolk", "tabxi", "triton", "yuan-ti", "tortle", "changling", "kalashtar", "shifter", "warforged", "gith", "centaur", "loxodon", "minotaur", "simic hybrid", "vedalken", "verdan", "locathah", "grung"];

        for (let x of tokenType) {
            if (x === type) return true
        }

        for (let x of tokenType) {
            if (humanoidRaces.includes(x)) {
                tokenType = "humanoid"
                continue;
            }
        }
        if (tokenType === type || tokenType === "any") return true;
        return false
    }

    static ExtractAuraById(entityId, sceneID) {
        if (!AAgm) return;
        let MapKey = sceneID;
        let MapObject = AuraMap.get(MapKey);
        let effectArray = MapObject.effects.filter(e => e.entityId !== entityId);
        AuraMap.set(MapKey, { effects: effectArray })
        AAhelpers.RemoveAppliedAuras(canvas)
    }

    static async RemoveAppliedAuras() {
        let EffectsArray = [];
        let MapKey = canvas.scene.id
        let MapObject = AuraMap.get(MapKey)
        MapObject.effects.forEach(i => EffectsArray.push(i.data.origin))

        for (let removeToken of canvas.tokens.placeables) {
            if (removeToken?.actor?.effects.size > 0) {
                for (let testEffect of removeToken.actor.effects) {
                    if (!EffectsArray.includes(testEffect.data.origin) && testEffect.data?.flags?.ActiveAuras?.applied) {
                        await removeToken.actor.deleteEmbeddedDocuments("ActiveEffect", [testEffect.id])
                        console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { effectDataLabel: testEffect.data.label, tokenName: removeToken.name }))
                    }
                }
            }
        }
    }
    static async RemoveAllAppliedAuras() {
        for (let removeToken of canvas.tokens.placeables) {
            if (removeToken?.actor?.effects.size > 0) {
                let effects = removeToken.actor.effects.reduce((a, v) => { if (v.data?.flags?.ActiveAuras?.applied) return a.concat(v.id)}, [] )
                await removeToken.actor.deleteEmbeddedDocuments("ActiveEffect", effects)
                console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { tokenName: removeToken.name }))
            }
        }

    }

    static UserCollateAuras(sceneID, checkAuras, removeAuras, source) {
        AAsocket.executeForOtherGMs("userCollate", sceneID, checkAuras, removeAuras, source)
    }
}