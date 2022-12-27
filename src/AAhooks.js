// DEBUG function to disable animate on tokens
// Hooks.on("preUpdateToken", (tokenDoc, update, options) => {
//     const x = foundry.utils.hasProperty(update, "x");
//     const y = foundry.utils.hasProperty(update, "y");
//     if ( !x && !y ) return;
//     console.warn(options)
//     foundry.utils.setProperty(options, "animate", false);
// });

Hooks.once('ready', () => {
    if (!game.modules.get('lib-wrapper')?.active && game.user.isGM)
        ui.notifications.error("Module XYZ requires the 'libWrapper' module. Please install and activate it.");
});

let AAgm;

/**
 * 
 * @param {String} sceneID Scene to check upon
 * @param {Boolean} checkAuras Can apply auras
 * @param {Boolean} removeAuras Can remove auras
 * @param {String} source For console logging
 * @returns 
 */
const debouncedCollate = debounce((a, b, c, d) => CollateAuras(a, b, c, d), 200);

Hooks.once("socketlib.ready", () => {
    AAsocket = socketlib.registerModule("ActiveAuras");
    AAsocket.register("userCollate", CollateAuras);
});

Hooks.on("init", () => {
    libWrapper.register("ActiveAuras", "ActiveEffect.prototype.apply", AAhelpers.applyWrapper, "MIXED");
    libWrapper.register("ActiveAuras", "ActiveEffect.prototype._displayScrollingStatus", AAhelpers.scrollingText, "MIXED");
});

Hooks.on("ready", async () => {
    if (game.settings.get("ActiveAuras", "debug")) AAdebug = true;
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }

    // determine if this user is the active gm/first active in current session
    if (game.user.isGM) {
        const currentGMUser = game.users.get(game.settings.get("ActiveAuras", "ActiveGM"));
        if ((currentGMUser && !currentGMUser.active) || !currentGMUser || currentGMUser.id === game.user.id) {
            await game.settings.set("ActiveAuras", "ActiveGM", game.user.id);
            AAgm = true;
        } else {
            AAgm = false;
        }
    } else {
        AAgm = false;
    }

    CollateAuras(canvas.id, true, false, "readyHook");
});

Hooks.on("createToken", (token) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (!AAgm) return;
    try {
        if (getProperty(token, "flags.multilevel-tokens")) return
        for (let effect of token.actor.effects?.contents) {
            if (effect.flags.ActiveAuras?.isAura) {
                if (AAdebug) console.log("createToken, collate auras true false")
                debouncedCollate(canvas.scene.id, true, false, "createToken")
                break;
            }
        }
    } catch (error) {
        if (error.message === "Cannot read property 'effects' of null")
            console.error(token, `This token has a no actor linked to it, please cleanup this token`)
    }
});

Hooks.on("updateCombat", async (combat, changed, options, userId) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (changed.round === 1) {
        ActiveAuras.MainAura(undefined, "combat start", canvas.id);
        return;
    }
    if (!("turn" in changed)) return;
    if (!AAgm) return;
    let combatant = canvas.tokens.get(combat.current.tokenId);
    let previousCombatant = canvas.tokens.get(combat.previous.tokenId);
    await previousCombatant.document.update({ "flags.ActiveAuras": false });
    if (AAdebug) console.log("updateCombat, main aura");
    await ActiveAuras.MainAura(combatant.document, "combat update", combatant.scene.id);
});

Hooks.on("preDeleteToken", async (token) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (!AAgm) return;
    if (AAhelpers.IsAuraToken(token.id, token.parent.id)) {
        if (AAdebug) console.log("preDelete, collate auras false true");
        AAhelpers.ExtractAuraById(token.id, token.parent.id);
    }
    AAhelpers.removeAurasOnToken(token);
});


/**
 * On token movement run MainAura
 */
Hooks.on("updateToken", async (token, update, _flags, _id) => {
    if (AAdebug) console.log("updateTokenHookArgs", { token: duplicate(token), update, _flags, _id });
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (!AAgm) return;
    if (("y" in update || "x" in update || "elevation" in update)) {
        // we need to wait for the movement to finish due to the animation in v10, listen to refresh hook

        if (AAdebug) console.log("creatingAAUpdateTokenHook", { token: duplicate(token), update, _flags, _id });
        async function movementUpdate() {
            let MapObject = AuraMap.get(token.parent.id);
            if (!MapObject || MapObject?.effects.length < 1) return;
            if (AAdebug) console.log("movement, main aura");
            await ActiveAuras.MainAura(token, "movement update", token.parent.id);
        };

        if(_flags.animate === false) {
            await movementUpdate();
        } else {
            const moveHookId = Hooks.on("refreshToken", async (rToken) => {
                if (rToken.id !== token.id
                    || ("x" in update && rToken.x !== update.x)
                    || ("y" in update && rToken.y !== update.y)
                    || ("elevation" in update && rToken.document.elevation !== update.elevation)
                ) return;
                Hooks.off("refreshToken", moveHookId);
                await movementUpdate();
            })
            // await movementUpdate();
        }
    } else if (hasProperty(update, "hidden") && (!update.hidden || AAhelpers.IsAuraToken(token.id, token.parent.id))) {
        // in v10 invisible is now a thing, so hidden is considered "not on scene"
        if (AAdebug) console.log(`hidden, collate auras ${!update.hidden} ${update.hidden}`);
        debouncedCollate(canvas.scene.id, !update.hidden, update.hidden, "updateToken, hidden");
    } else if (AAhelpers.IsAuraToken(token.id, token.parent.id) && AAhelpers.HPCheck(token)) {
        if (AAdebug) console.log("0hp, collate auras true true");
        debouncedCollate(canvas.scene.id, false, true, "updateToken, dead");
    }
});


/**
 */
Hooks.on("updateActiveEffect", (effect, _update) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (!AAgm) return;
    if (effect.flags?.ActiveAuras?.isAura) {
        if (AAdebug) console.log("updateAE, collate auras true true");
        debouncedCollate(canvas.scene.id, true, true, "updateActiveEffect");
    }
});

/**
 * On removal of active effect from linked actor, if aura remove from canvas.tokens
 */
Hooks.on("deleteActiveEffect", (effect, options) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (!AAgm) return;
    let applyStatus = effect.flags?.ActiveAuras?.applied;
    let auraStatus = effect.flags?.ActiveAuras?.isAura;
    if (!applyStatus && auraStatus) {
        if (AAdebug) console.log("deleteActiveEffect, collate auras true false", { effect, update: options });
        debouncedCollate(canvas.scene.id, false, true, "deleteActiveEffect");
    }
});

/**
 * On creation of active effect on linked actor, run MainAura
 */
Hooks.on("createActiveEffect", (effect) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (!AAgm) return;
    if (!effect.flags?.ActiveAuras?.applied && effect.flags?.ActiveAuras?.isAura) {
        if (AAdebug) console.log("createActiveEffect, collate auras true false", {effect});
        debouncedCollate(canvas.scene.id, true, false, "createActiveEffect");
    }
});

Hooks.on("canvasReady", (canvas) => {
    if (!AAgm) return;
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (AAdebug) console.log("canvasReady, collate auras true false");
    debouncedCollate(canvas.scene.id, true, false, "ready");
});

Hooks.on("preUpdateActor", (actor, update) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (AAhelpers.HPCheck(actor)) {
        if (AAdebug) console.log("Actor dead, checking for tokens and auras", { actor, update });
        const activeTokens = actor.getActiveTokens();
        if (activeTokens.length > 0 && AAhelpers.IsAuraToken(activeTokens[0].id, canvas.id)) {
            if (AAdebug) console.log("preUpdate0hp, collate auras true true");
            Hooks.once("updateActor", (a, b) => {
                if (!AAgm) return;
                debouncedCollate(canvas.scene.id, true, true, "updateActor, dead");
            })
        }
    }
    if (actor.system?.attributes?.hp?.value === 0 && update?.system?.attributes?.hp?.value > 0) {
        Hooks.once("updateActor", (a, b) => {
            if (!AAgm) return;
            debouncedCollate(canvas.scene.id, true, false, "updateActor, revived");
        })
    }
});

Hooks.on("updateMeasuredTemplate", (data, update) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (!getProperty(data, "flags.ActiveAuras")) return;
    ActiveAuras.MainAura(undefined, "template movement", data.parent.id);
});

Hooks.on("deleteMeasuredTemplate", (doc) => {
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    //if (!getProperty(data, "flags.ActiveAuras")) return;
    AAhelpers.ExtractAuraById(doc.id, doc.parent.id);
    //CollateAuras(scene._id, false, true, "template deletion")
});

Hooks.on("deleteCombat", (combat) => {
    if (!AAgm) return;
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (game.settings.get("ActiveAuras", "combatOnly")) {
        AAhelpers.RemoveAllAppliedAuras()
    }
});

Hooks.on("deleteCombatant", (combatant) => {
    if (!AAgm) return;
    if (AAhelpers.IsAuraToken(combatant.tokenId, combatant.parent.scene.id)) {
        AAhelpers.ExtractAuraById(combatant.tokenId, combatant.parent.scene.id)
    }
});

Hooks.on("createCombatant", (combat, combatant) => {
    if (!AAgm) return;
    if (canvas.scene === null) { if (AAdebug) { console.log("Active Auras disabled due to no canvas") } return }
    if (!combat.active) return;
    combatant = canvas.tokens.get(combatant.tokenId)
    if (combatant.actor.effects?.entries) {
        for (let effect of combatant.actor.effects?.entries) {
            if (effect.getFlag('ActiveAuras', 'isAura')) {
                if (AAdebug) console.log("createToken, collate auras true false");
                debouncedCollate(combat.scene.id, true, false, "add combatant");
                break;
            }
        }
    }
});

Hooks.on("createWall", () => {
    if (AAdebug) console.log("createWall, collate auras false true");
    debouncedCollate(canvas.scene.id, false, true, "Wall Created")
});
Hooks.on("updateWall", () => {
    if (AAdebug) console.log("updateWall, collate auras true true");
    debouncedCollate(canvas.scene.id, true, true, "Wall Updated")
});
Hooks.on("deleteWall", () => {
    if (AAdebug) console.log("updateWall, collate auras true false");
    debouncedCollate(canvas.scene.id, true, false, "Wall Deleted")
});
