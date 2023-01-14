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
            return getProperty(entity.flags, scope);
        }
    }

    /**
     * 
     * @param {*} token 
     * @param {*} sceneID 
     * @returns 
     */
    static IsAuraToken(tokenID, sceneID) {
        let MapKey = sceneID;
        let MapObject = AuraMap.get(MapKey);
        if (!MapObject?.effects) return false;
        for (let effect of MapObject.effects) {
            if (effect.entityId === tokenID) return true;
        }
        return false;
    }

    static DispositionCheck(auraTargets, auraDis, tokenDis) {
        switch (auraTargets) {
            case "Allies": {
                if (auraDis !== tokenDis) return false;
                else return true;
            }
            case "Enemy": {
                if (auraDis === tokenDis) return false;
                else return true;
            }
            case "All": return true;
        }
    }

    static CheckType(canvasToken, type) {
        switch (game.system.id) {
            case ("dnd5e"):
            case ("sw5e"):
                return AAhelpers.typeCheck5e(canvasToken, type);
            case ("swade"):
                return AAhelpers.typeCheckSWADE(canvasToken, type);
        }
    }
    static typeCheck5e(canvasToken, type) {
        let tokenType;
        switch (canvasToken.actor.type) {
            case "npc": {
                try {
                    tokenType = [canvasToken.actor?.system.details.type.value, canvasToken.actor?.system.details.type.custom];
                } catch (error) {
                    console.error([`ActiveAuras: the token has an unreadable type`, canvasToken]);
                }
            }
                break;
            case "character": {
                try {
                    if (game.system.id === "sw5e") {
                        tokenType = canvasToken.actor?.system.details.species.toLowerCase();
                    }
                    else tokenType = [canvasToken.actor?.system.details.race.toLowerCase().replace("-", " ").split(" ")];
                } catch (error) {
                    console.error([`ActiveAuras: the token has an unreadable type`, canvasToken]);
                }
            }
                break;
            case "vehicle": return;
        };
        let humanoidRaces;
        if (game.system.id === "sw5e") {
            humanoidRaces = ["abyssin", "aingtii", "aleena", "anzellan", "aqualish", "arcona", "ardennian", "arkanian", "balosar", "barabel", "baragwin", "besalisk", "bith", "bothan", "cathar", "cerean", "chadrafan", "chagrian", "chevin", "chironian", "chiss", "clawdite", "codruji", "colicoid", "dashade", "defel", "devoronian", "draethos", "dug", "duros", "echani", "eshkha", "ewok", "falleen", "felucian", "fleshraider", "gamorrean", "gand", "geonosian", "givin", "gotal", "gran", "gungan", "halfhuman", "harch", "herglic", "ho’din", "human", "hutt", "iktotchi", "ithorian", "jawa", "kage", "kaleesh", "kaminoan", "karkarodon", "keldor", "killik", "klatooinian", "kubaz", "kushiban", "kyuzo", "lannik", "lasat", "lurmen", "miraluka", "mirialan", "moncalamari", "mustafarian", "muun", "nautolan", "neimoidian", "noghri", "ortolan", "patrolian", "pau’an", "pa’lowick", "pyke", "quarren", "rakata", "rattataki", "rishii", "rodian", "ryn", "selkath", "shistavanen", "sithpureblood", "squib", "ssiruu", "sullustan", "talz", "tarasin", "thisspiasian", "togorian", "togruta", "toydarian", "trandoshan", "tusken", "twi'lek", "ugnaught", "umbaran", "verpine", "voss", "vurk", "weequay", "wookie", "yevetha", "zabrak", "zeltron", "zygerrian"];
        }
        else humanoidRaces = ["human", "orc", "elf", "tiefling", "gnome", "aaracokra", "dragonborn", "dwarf", "halfling", "leonin", "satyr", "genasi", "goliath", "aasimar", "bugbear", "firbolg", "goblin", "lizardfolk", "tabxi", "triton", "yuan-ti", "tortle", "changling", "kalashtar", "shifter", "warforged", "gith", "centaur", "loxodon", "minotaur", "simic hybrid", "vedalken", "verdan", "locathah", "grung"];

        if (tokenType.includes(type)) return true;

        for (let x of tokenType) {
            if (humanoidRaces.includes(x)) {
                tokenType = "humanoid";
                continue;
            }
        }
        if (tokenType === type || tokenType === "any") return true;
        return false;
    }

    static typeCheckSWADE(canvasToken, type) {
        let tokenType;
        switch (canvasToken.actor.type) {
            case "npc": {
                try {
                    tokenType = canvasToken.actor?.system.details.species.name.toLowerCase();
                } catch (error) {
                    console.error([`ActiveAuras: the token has an unreadable type`, canvasToken]);
                }
            }
                break;
            case "character": {
                try {
                    tokenType = canvasToken.actor?.system.details.species.name.toLowerCase();
                } catch (error) {
                    console.error([`ActiveAuras: the token has an unreadable type`, canvasToken]);
                }
            }
                break;
            case "vehicle": return;
        }
        return tokenType === type;
    }

    static Wildcard(canvasToken, wildcard, extra) {
        if (game.system.id !== "swade") return true;
        let Wild = canvasToken.actor.isWildcard;
        if (Wild && wildcard) return true;
        else if (!Wild && extra) return true;
        else return false;
    }

    static HPCheck(entity) {
        let actor = entity.actor;
        if (entity.collectionName === "actors") actor = entity;
        switch (game.system.id) {
            case "dnd5e": ;
            case "sw5e": {
                if (getProperty(actor, "system.attributes.hp.max") === 0) return true; // dead
                if (getProperty(actor, "system.attributes.hp.value") > 0) return false; //alive!
                else return true; // dead
            }
            case "swade": {
                let { max, value, ignored } = actor.system.wounds;
                if (value - ignored >= max) return false;
                else return true; // dead
            }
        }
    }

    static EventHPCheck(event) {
        // if this is not a hp/wound check then assune not dead
        if (!hasProperty(event, "system.wounds") && !getProperty(event, "system.attributes.hp")) {
            return false;
        }
        switch (game.system.id) {
            case "dnd5e": ;
            case "sw5e": {
                if (getProperty(event, "system.attributes.hp.max") === 0) return true; // dead
                if (getProperty(event, "system.attributes.hp.value") > 0) return false; //alive!
                else return true; // dead
            }
            case "swade": {
                let { max, value, ignored } = event.system.wounds;
                if (value - ignored >= max) return false;
                else return true; // dead
            }
        }
    }

    static ExtractAuraById(entityId, sceneID) {
        if (!AAgm) return;
        const MapKey = sceneID;
        const MapObject = AuraMap.get(MapKey);
        const effectArray = MapObject.effects.filter(e => e.entityId !== entityId);
        AuraMap.set(MapKey, { effects: effectArray });
        if (AAdebug) console.warn("ExtractAuraById", { AuraMap });
        // AAhelpers.RemoveAppliedAuras();
    }

    static async RemoveAppliedAuras() {
        const MapKey = canvas.scene.id;
        const MapObject = AuraMap.get(MapKey);
        const EffectsArray = MapObject.effects.map(i => i.data.origin);

        if (AAdebug) console.warn("RemoveAppliedAuras", { MapKey, MapObject, EffectsArray })

        for (let removeToken of canvas.tokens.placeables) {
            if (removeToken?.actor?.effects.size > 0) {
                for (let testEffect of removeToken.actor.effects) {
                    if (!EffectsArray.includes(testEffect.origin) && testEffect?.flags?.ActiveAuras?.applied) {
                        try {
                            if (AAdebug) console.warn("RemoveAppliedAuras", { removeToken, testEffect });
                            await removeToken.actor.deleteEmbeddedDocuments("ActiveEffect", [testEffect.id]);
                        } catch (err) {
                            console.error("ERROR CAUGHT in RemoveAppliedAuras", err);
                        } finally {
                            console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { effectDataLabel: testEffect.label, tokenName: removeToken.name }));
                        }
                    }
                }
            }
        }
    }

    static async RemoveAllAppliedAuras() {
        for (let removeToken of canvas.tokens.placeables) {
            if (removeToken?.actor?.effects.size > 0) {
                let effects = removeToken.actor.effects.reduce((a, v) => { if (v?.flags?.ActiveAuras?.applied) return a.concat(v.id) }, []);
                try {
                    if (AAdebug) console.warn("RemoveAllAppliedAuras", { removeToken, effects });
                    await removeToken.actor.deleteEmbeddedDocuments("ActiveEffect", effects);
                } catch (err) {
                    console.error("ERROR CAUGHT in RemoveAllAppliedAuras", err);
                } finally {
                    console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { tokenName: removeToken.name }));
                }
            }
        }

    }

    static UserCollateAuras(sceneID, checkAuras, removeAuras, source) {
        let AAGM = game.users.find((u) => u.isGM && u.active);
        AAsocket.executeAsUser("userCollate", AAGM.id, sceneID, checkAuras, removeAuras, source);
    }

    /**
     * Bind a filter to the ActiveEffect.apply() prototype chain
     */

    static applyWrapper(wrapped, ...args) {
        let actor = args[0];
        let change = args[1];
        if (change.effect.flags?.ActiveAuras?.ignoreSelf) {
            console.log(game.i18n.format("ACTIVEAURAS.IgnoreSelfLog", { effectDataLabel: change.effect.label, changeKey: change.key, actorName: actor.name }));
            args[1] = {};
            return wrapped(...args);
        }
        return wrapped(...args)
    }

    static scrollingText(wrapped, ...args) {
        // if supressing aura effect notifications and an aura; dont continue
        if (game.settings.get("ActiveAuras", "scrollingAura")) {
          if (this.flags["ActiveAuras"]?.applied) {
            return;
          }
        }
        // otherwise continue notificaiton chain
        return wrapped(...args);
    }

    static async applyTemplate(args) {

        let duration;
        const convertedDuration = globalThis.DAE.convertDuration(args[0].itemData.system.duration, true);
        if (convertedDuration?.type === "seconds") {
            duration = { seconds: convertedDuration.seconds, startTime: game.time.worldTime };
        }
        else if (convertedDuration?.type === "turns") {
            duration = {
                rounds: convertedDuration.rounds,
                turns: convertedDuration.turns,
                startRound: game.combat?.round,
                startTurn: game.combat?.turn
            };
        }
        let template = canvas.templates.get(args[0].templateId);
        let disposition = args[0].actor.token?.disposition ?? args[0].actor.prototypeToken?.disposition;
        let effects = args[0].item.effects;
        let templateEffectData = [];
        for (let effect of effects) {
            let data = {
                data: duplicate(effect),
                parentActorId: false,
                parentActorLink: false,
                entityType: "template",
                entityId: template.id,
                casterDisposition: disposition,
                castLevel: args[0].spellLevel
            };
            if (effect.flags["ActiveAuras"].displayTemp) data.data.duration = duration;
            data.data.origin = `Actor.${args[0].actor._id}.Item.${args[0].item._id}`;
            templateEffectData.push(data);
        }
        if (AAdebug) console.log("Applying template effect", templateEffectData);
        await template.document.setFlag("ActiveAuras", "IsAura", templateEffectData);
        AAhelpers.UserCollateAuras(canvas.scene.id, true, false, "spellCast");
        return { haltEffectsApplication: true };

    }

    static async removeAurasOnToken(token){
        if(!token.actorLink) return;
        let auras = token.actor.effects.filter(i => i.flags?.["ActiveAuras"]?.applied).map(i => i.id);
        if(!auras) return;
        try {
            if (AAdebug) console.warn("removeAurasOnToken", { token, auras });
            await token.actor.deleteEmbeddedDocuments("ActiveEffect", auras);
        } catch (err) {
            console.error("ERROR CAUGHT in removeAurasOnToken", err);
        } finally {
            console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { tokenName: token.name }));
        }
    }
}
