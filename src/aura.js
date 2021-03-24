
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
const MODULE_NAME = "ActiveAuras";
let AAgm;

Hooks.on("ready", () => {
    AAgm = game.user === game.users.find((u) => u.isGM && u.active)
    ActiveAuras.CollateAuras(canvas, true, false)


    /**
     * Bind a filter to the ActiveEffect.apply() prototype chain
     */
    existingActiveEffectsApply = CONFIG.ActiveEffect.entityClass.prototype.apply;
    CONFIG.ActiveEffect.entityClass.prototype.apply = ActiveAurasApply;

    function ActiveAurasApply(actor, change) {
        if (actor._id == change.effect.data.origin?.split('.')[1] && change.effect.data.flags?.ActiveAuras?.ignoreSelf) {
            console.log(game.i18n.format("ACTIVEAURAS.IgnoreSelfLog", { effectDataLabel: change.effect.data.label, changeKey: change.key, actorName: actor.name }));
            return null;
        }
        return existingActiveEffectsApply.bind(this)(actor, change);
    }

    if (game.settings.get("ActiveAuras", "debug")) debug = true

})
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
    const FormTimePrompt = game.i18n.format("ACTIVEAURAS.FORM_TimePrompt")
    const HostileTurn = game.i18n.format("ACTIVEAURAS.FORM_HostileTurn")
    const ActivateOnce = game.i18n.format("ACTIVEAURAS.FORM_ActivateOnce")
    if (game.modules.get("dae")?.active && game.modules.get("times-up")?.active) {
        var isAttacked = game.i18n.format("dae.isAttacked")
        var isDamaged = game.i18n.format("dae.isDamaged")
        var action = game.i18n.format("dae.1Action")
        var attack = game.i18n.format("dae.1Attack")
        var hit = game.i18n.format("dae.1Hit")
        var turnStart = game.i18n.format("dae.turnStart")
        var turnEnd = game.i18n.format("dae.turnEnd")
    }


    const tab = `<a class="item" data-tab="ActiveAuras"><i class="fas fa-broadcast-tower"></i> ${AuraTab}</a>`;
    let type = flags[MODULE_NAME]?.type ? flags[MODULE_NAME]?.type : "";
    let alignment = flags[MODULE_NAME]?.alignment ? flags[MODULE_NAME]?.alignment : "";
    let save = flags[MODULE_NAME]?.save ? flags[MODULE_NAME]?.save : "";

    let contents = `
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
            <div class="form-group">
                <label>${HostileTurn}</label>
                <input name="flags.${MODULE_NAME}.hostile" type="checkbox" ${flags[MODULE_NAME]?.hostile ? 'checked' : ''}></input>
            </div>
            <div class="form-group">
                <label>${ActivateOnce}</label>
                <input name="flags.${MODULE_NAME}.onlyOnce" type="checkbox" ${flags[MODULE_NAME]?.onlyOnce ? 'checked' : ''}></input>
            </div>`
        ;

    if (game.modules.get("times-up")?.active) {
        contents += `
            <div class="form-group">
                <label>${FormTimePrompt}</label>
                <select name="flags.${MODULE_NAME}.time" data-dtype="String" value=${flags[MODULE_NAME]?.time}>
                    <option value="None" ${flags[MODULE_NAME]?.time === 'None' ? 'selected' : ''}></option>
                    <option value="isAttacked"${flags[MODULE_NAME]?.time === 'isAttacked' ? 'selected' : ''}>${isAttacked}</option>
                    <option value="isDamaged"${flags[MODULE_NAME]?.time === 'isDamaged' ? 'selected' : ''}>${isDamaged}</option>
                    <option value="1Action"${flags[MODULE_NAME]?.time === '1Action' ? 'selected' : ''}>${action}</option>
                    <option value="1Attack"${flags[MODULE_NAME]?.time === '1Attack' ? 'selected' : ''}>${attack}</option>
                    <option value="1Hit"${flags[MODULE_NAME]?.time === '1Hit' ? 'selected' : ''}>${hit}</option>
                    <option value="turnStart"${flags[MODULE_NAME]?.time === 'turnStart' ? 'selected' : ''}>${turnStart}</option>
                    <option value="turnEnd"${flags[MODULE_NAME]?.time === 'turnEnd' ? 'selected' : ''}>${turnEnd}</option>
                </select>
            </div> 
        </div>`
    }
    else contents += `</div>`

    const appliedAuraContent = `
        <div class="tab" data-tab="ActiveAuras">
            <h3> You cannot alter an applied aura </h3>
        </div>`;

    html.find(".tabs .item").last().after(tab);
    if (!flags[MODULE_NAME]?.applied) html.find(".tab").last().after(contents);
    else html.find(".tab").last().after(appliedAuraContent);
});

let AuraMap = new Map()
let debug = false

/*
Hooks.on("renderDrawingConfig", (sheet, html) => {
    let extraHtml = `
    <button type="button" title="Add Aura"</button>
    `
let test = html.find(".tab .item .position")after( extraHtml)
})
*/


/**
* Re-run aura detection on token creation
*/
Hooks.on("createToken", (_scene, token) => {
    if (!AAgm) return;
    let actor = game.actors.get(token.actorId)
    try {
        if (game.modules.get("multilevel-tokens")?.active) {
            let testToken = canvas.tokens.get(token._id)
            if (ActiveAuras.GetAllFlags(testToken, 'multilevel-tokens')) return;
        }
        if (actor.effects?.entries) {
            for (let effect of actor.effects?.entries) {
                if (effect.getFlag('ActiveAuras', 'isAura')) {
                    setTimeout(() => {
                        if (debug) console.log("createToken, collate auras true false")
                        ActiveAuras.CollateAuras(canvas.scene._id, true, false, "createToken")
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

Hooks.on("updateCombat", async (combat, changed, options, userId) => {
    if (!("turn" in changed)) return;
    if (!AAgm) return;
    let combatant = canvas.tokens.get(combat.combatant.tokenId);
    let previousTurn = combat.turns[changed.turn - 1 > -1 ? changed.turn - 1 : combat.turns.length - 1]
    let previousCombatant = canvas.tokens.get(previousTurn.tokenId)
    previousCombatant.update({ "flags.ActiveAuras": false })
    if (debug) console.log("updateCombat, main aura")
    await ActiveAuras.MainAura(combatant.data, "combat update", combatant.scene.id)
});

Hooks.on("preDeleteToken", async (_scene, token) => {
    if (!AAgm) return;
    if (ActiveAuras.IsAuraToken(token, canvas)) {
        setTimeout(() => {
            if (debug) console.log("preDelete, collate auras false true")
            ActiveAuras.CollateAuras(canvas.scene._id, false, true, "preDeleteToken")
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
                    ActiveAuras.CollateAuras(canvas.scene._id, true, true, "preUpdateToken, removal")
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
                    ActiveAuras.CollateAuras(canvas.scene._id, true, false, "preUpdateToken, addition")
                }, 50)
                return;
            }
        }
    }
})

/**
 * On token movement run MainAura
 */
Hooks.on("updateToken", async (scene, token, update, _flags, _id) => {
    if (!AAgm) return;
    if (("y" in update || "x" in update || "elevation" in update)) {
        let MapObject = AuraMap.get(scene.id);
        if (!MapObject || MapObject?.effects.length < 1) return;
        if (debug) console.log("movement, main aura")
        await ActiveAuras.MainAura(token, "movement update", scene.id)
    }

    if ("hidden" in update && ActiveAuras.IsAuraToken(token, canvas)) {
        setTimeout(() => {
            if (debug) console.log("hidden, collate auras true true")
            ActiveAuras.CollateAuras(canvas.scene._id, true, true, "updateToken")
        }, 20)
    }
    if (ActiveAuras.IsAuraToken(token, canvas) && update?.actorData?.data?.attributes?.hp?.value <= 0) {
        setTimeout(() => {
            if (debug) console.log("0hp, collate auras true true")
            ActiveAuras.CollateAuras(canvas.scene._id, true, true, "updateToken, dead")
        }, 50)
    }
});


/**
 */
Hooks.on("updateActiveEffect", (_actor, effect, _update) => {
    if (!AAgm) return;
    if (effect.flags?.ActiveAuras?.isAura) {
        setTimeout(() => {
            if (debug) console.log("updateAE, collate auras true true")
            ActiveAuras.CollateAuras(canvas.scene._id, true, true, "updateActiveEffect")
        }, 20)
    }
})

/**
 * On removal of active effect from linked actor, if aura remove from canvas.tokens
 */
Hooks.on("deleteActiveEffect", (_actor, effect) => {
    if (!AAgm) return;
    let applyStatus = effect.flags?.ActiveAuras?.applied;
    let auraStatus = effect.flags?.ActiveAuras?.isAura;
    if (!applyStatus && auraStatus) {
        setTimeout(() => {
            if (debug) console.log("deleteAE, collate auras true false")
            ActiveAuras.CollateAuras(canvas.scene._id, false, true, "deleteActiveEffect")
        }, 20)
    }
});

/**
 * On creation of active effect on linked actor, run MainAura
 */
Hooks.on("createActiveEffect", (_actor, effect) => {
    if (!AAgm) return;
    if (!effect.flags?.ActiveAuras?.applied && effect.flags?.ActiveAuras?.isAura) {
        setTimeout(() => {
            if (debug) console.log("deleteAE, collate auras true false")
            ActiveAuras.CollateAuras(canvas.scene._id, true, false, "createActiveEffect")
        }, 20)
    };
});

Hooks.on("canvasReady", (canvas) => {
    if (!AAgm) return;
    setTimeout(() => {
        if (debug) console.log("canvasReady, collate auras true false")
        ActiveAuras.CollateAuras(canvas.scene._id, true, false, "ready")
    }, 20)
})

Hooks.on("preUpdateActor", (actor, update) => {
    if (update.data?.attributes?.hp?.value <= 0) {
        if (ActiveAuras.IsAuraToken(actor.getActiveTokens()[0].data, canvas)) {
            if (debug) console.log("0hp, collate auras true true")
            Hooks.once("updateActor", () => {
                if (!AAgm) return;
                ActiveAuras.CollateAuras(canvas.scene._id, true, true, "updateActor, dead")
            })
        }
    }
    if (actor.data.data.attributes.hp.value === 0 && update?.data?.attributes?.hp?.value > 0) {
        Hooks.once("updateActor", () => {
            if (!AAgm) return;
            ActiveAuras.CollateAuras(canvas.scene._id, true, false, "updateActor, revived")
        })
    }
})

Hooks.on("updateMeasuredTemplate", (scene, data, update) => {
    if (!getProperty(data, "flags.ActiveAuras")) return;
    ActiveAuras.MainAura(undefined, "template movement", scene.id)
})

Hooks.on("deleteMeasuredTemplate", (scene, data) => {
    if (!getProperty(data, "flags.ActiveAuras")) return;
    ActiveAuras.CollateAuras(scene._id, false, true, "template deletion")

})

class ActiveAuras {
    static GetAllFlags(entity, scope) {
        {
            const scopes = SetupConfiguration.getPackageScopes();
            if (!scopes.includes(scope)) throw new Error(`Invalid scope`);
            return getProperty(entity.data.flags, scope);
        }
    }

    /**
     * 
     * @param {token} token 
     * @param {scene} canvas 
     * checks if provided token has an aura stored in the scene  
     */
    static IsAuraToken(token, canvas) {
        let MapKey = canvas.scene._id;
        let MapObject = AuraMap.get(MapKey);
        if (!MapObject.effects) return;
        for (let effect of MapObject.effects) {
            if (effect.entityId === token._id) return true;

        }
    }

    static CollateAuras(sceneID, checkAuras, removeAuras, source) {
        if (!AAgm) return;
        if (sceneID !== canvas.id) return ui.notifications.warn("Collate Auras called on a non viewed scene, auras will be updated when you return to that scene")
        if (debug) console.log(source)
        let MapKey = sceneID;
        let MapObject = AuraMap.get(MapKey);
        let effectArray = [];
        for (let testToken of canvas.tokens.placeables) {

            //Skips over null actor tokens
            if (testToken.actor === null || testToken.actor === undefined) continue;
            //Skips over MLT coppied tokens
            if (game.modules.get("multilevel-tokens")?.active) {
                if (ActiveAuras.GetAllFlags(testToken, 'multilevel-tokens')) continue;
            }
            if ((testToken.data.actorData?.attributes?.hp?.value <= 0 || testToken.actor?.data.data.attributes.hp.value <= 0) && game.settings.get("ActiveAuras", "dead-aura")) continue;
            for (let testEffect of testToken?.actor?.effects.entries) {
                if (testEffect.getFlag('ActiveAuras', 'isAura')) {
                    if (testEffect.data.disabled) continue;
                    let newEffect = { data: duplicate(testEffect.data), parentActorLink: testEffect.parent.data.token.actorLink, parentActorId: testEffect.parent._id, entityType: "token", entityId: testToken.id }
                    for (let change of newEffect.data.changes) {
                        if (typeof change.value === "string" && change.key !== "macro.execute" && change.key !== "macro.itemMacro") {
                            if (change.value.includes("@")) {
                                let dataPath = change.value.substring(2)
                                let newValue = getProperty(testToken.actor.getRollData(), dataPath)
                                const changeIndex = newEffect.data.changes.findIndex(i => i.value === change.value && i.key === change.key)
                                newEffect.data.changes[changeIndex].value = `+${newValue}`
                            }
                        }
                        if (change.key === "macro.execute" || change.key === "macro.itemMacro") newEffect.data.flags.ActiveAuras.isMacro = true
                    }
                    newEffect.data.disabled = false
                    let macro = newEffect.data.flags.ActiveAuras.isMacro !== undefined ? newEffect.data.flags.ActiveAuras.isMacro : false;

                    newEffect.data.flags.ActiveAuras.isAura = false;
                    newEffect.data.flags.ActiveAuras.applied = true;
                    newEffect.data.flags.ActiveAuras.isMacro = macro;
                    newEffect.data.flags.ActiveAuras.ignoreSelf = false;
                    if (testEffect.getFlag('ActiveAuras', 'hidden') && testToken.data.hidden) newEffect.data.flags.ActiveAuras.Paused = true;
                    else newEffect.data.flags.ActiveAuras.Paused = false;
                    effectArray.push(newEffect)
                }
            }
        }
        ActiveAuras.RetrieveDrawingAuras(effectArray)
        ActiveAuras.RetrieveTemplateAuras(effectArray)
        if (MapObject) {
            MapObject.effects = effectArray
        }
        else {
            AuraMap.set(MapKey, { effects: effectArray })
        }


        if (debug) console.log(AuraMap)
        if (checkAuras) {
            setTimeout(() => {
                ActiveAuras.MainAura(undefined, "Collate auras", canvas.id)
            }, 20)
        }
        if (removeAuras) {
            setTimeout(() => {
                ActiveAuras.RemoveAppliedAuras(canvas)
            }, 20)
        }
    }

    static async RetrieveTemplateAuras(effectArray) {
        let auraTemplates = canvas.templates.placeables.filter(i => i.data.flags?.ActiveAuras?.IsAura !== undefined)

        for (let template of auraTemplates) {
            for (let testEffect of template.data.flags?.ActiveAuras?.IsAura) {
                if (testEffect.disabled) continue;
                let newEffect = duplicate(testEffect)
                for (let change of newEffect.data.changes) {
                    if (change.key === "macro.execute" || change.key === "macro.itemMacro") newEffect.data.flags.ActiveAuras.isMacro = true
                }
                newEffect.disabled = false
                let macro = newEffect.data.flags.ActiveAuras.isMacro !== undefined ? newEffect.data.flags.ActiveAuras.isMacro : false;

                newEffect.data.flags.ActiveAuras.isAura = false;
                newEffect.data.flags.ActiveAuras.applied = true;
                newEffect.data.flags.ActiveAuras.isMacro = macro;
                newEffect.data.flags.ActiveAuras.ignoreSelf = false;
                effectArray.push(newEffect)
            }
        }
        return effectArray
    }

    static async RetrieveDrawingAuras(effectArray) {
        if (!effectArray) effectArray = AuraMap.get(canvas.scene._id)?.effects;
        let auraDrawings = canvas.drawings.placeables.filter(i => i.data.flags?.ActiveAuras?.IsAura !== undefined)

        for (let drawing of auraDrawings) {
            for (let testEffect of drawing.data.flags?.ActiveAuras?.IsAura) {
                if (testEffect.disabled) continue;
                let newEffect = { data: duplicate(testEffect), parentActorId: false, parentActorLink: false, entityType: "drawing", entityId: drawing.id, }
                for (let change of newEffect.data.changes) {
                    if (change.key === "macro.execute" || change.key === "macro.itemMacro") newEffect.data.flags.ActiveAuras.isMacro = true
                }
                newEffect.disabled = false
                let macro = newEffect.data.flags.ActiveAuras.isMacro !== undefined ? newEffect.data.flags.ActiveAuras.isMacro : false;

                newEffect.data.flags.ActiveAuras.isAura = false;
                newEffect.data.flags.ActiveAuras.applied = true;
                newEffect.data.flags.ActiveAuras.isMacro = macro;
                newEffect.data.flags.ActiveAuras.ignoreSelf = false;
                effectArray.push(newEffect)
            }
        }
        return effectArray
    }

    static async RemoveAppliedAuras() {
        let EffectsArray = [];
        let MapKey = canvas.scene._id
        let MapObject = AuraMap.get(MapKey)
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

    static rotate(centre, point, degrees) {
        const r = degrees * Math.PI / 180;
        return {
            x: centre.x + (point.x - centre.x) * Math.cos(r) - (point.y - centre.y) * Math.sin(r),
            y: centre.y + (point.x - centre.x) * Math.sin(r) + (point.y - centre.y) * Math.cos(r),
        };
    }

    static getDrawingCentre(drawing) {
        return {
            x: drawing.x + drawing.width / 2,
            y: drawing.y + drawing.height / 2
        };
    }

    static isPointInRegion(point, region) {

        if (region.rotation) {
            point = this.rotate(ActiveAuras.getDrawingCentre(region), point, -region.rotation);
        }
        const inBox = point.x >= region.x && point.x <= region.x + region.width &&
            point.y >= region.y && point.y <= region.y + region.height;
        if (!inBox) {
            return false;
        }
        if (region.type === CONST.DRAWING_TYPES.RECTANGLE) {
            return true;
        }
        if (region.type === CONST.DRAWING_TYPES.ELLIPSE) {
            if (!region.width || !region.height) {
                return false;
            }
            const dx = region.x + region.width / 2 - point.x;
            const dy = region.y + region.height / 2 - point.y;
            return 4 * (dx * dx) / (region.width * region.width) + 4 * (dy * dy) / (region.height * region.height) <= 1;
        }
        if (region.type === CONST.DRAWING_TYPES.POLYGON) {
            const cx = point.x - region.x;
            const cy = point.y - region.y;
            let w = 0;
            for (let i0 = 0; i0 < region.points.length; ++i0) {
                let i1 = i0 + 1 === region.points.length ? 0 : i0 + 1;
                if (region.points[i0][1] <= cy && region.points[i1][1] > cy &&
                    (region.points[i1][0] - region.points[i0][0]) * (cy - region.points[i0][1]) -
                    (region.points[i1][1] - region.points[i0][1]) * (cx - region.points[i0][0]) > 0) {
                    ++w;
                }
                if (region.points[i0][1] > cy && region.points[i1][1] <= cy &&
                    (region.points[i1][0] - region.points[i0][0]) * (cy - region.points[i0][1]) -
                    (region.points[i1][1] - region.points[i0][1]) * (cx - region.points[i0][0]) < 0) {
                    --w;
                }
            }
            return w !== 0;
        }
        return false;
    }

    static getTemplateTargets(t, data) {
        t = canvas.tokens.get(t.id)

        let templateDetails = canvas.templates.get(data._id);
        let tdx = data.x;
        let tdy = data.y;
        // Extract and prepare data
        let { direction, distance, angle, width } = data;
        distance *= canvas.scene.data.grid / canvas.scene.data.gridDistance;
        width *= canvas.scene.data.grid / canvas.scene.data.gridDistance;
        direction = toRadians(direction);
        var shape;
        // Get the Template shape
        switch (data.t) {
            case "circle":
                shape = templateDetails._getCircleShape(distance);
                break;
            case "cone":
                shape = templateDetails._getConeShape(direction, angle, distance);
                break;
            case "rect":
                shape = templateDetails._getRectShape(direction, distance);
                break;
            case "ray":
                shape = templateDetails._getRayShape(direction, distance, width);
        }
        // skip special tokens with a race of trigger
        const w = t.width >= 1 ? 0.5 : t.data.width / 2;
        const h = t.height >= 1 ? 0.5 : t.data.height / 2;
        const gridSize = canvas.scene.data.grid;
        let contained = false;
        for (let xstep = w; xstep <= t.data.width && !contained; xstep++) {
            for (let ystep = h; ystep <= t.data.height && !contained; ystep++) {
                const tx = t.data.x + xstep * gridSize;
                const ty = t.data.y + ystep * gridSize;
                if (shape.contains(tx - tdx, ty - tdy)) {
                    if (data.t === "rect") {
                        // for rectangles the origin is top left, so measure from the centre instaed.
                        let template_x = templateDetails.x + shape.width / 2;
                        let template_y = templateDetails.y + shape.height / 2;
                        const r = new Ray({ x: tx, y: ty }, { x: template_x, y: template_y });
                        contained = !canvas.walls.checkCollision(r);
                    }
                    else {
                        const r = new Ray({ x: tx, y: ty }, templateDetails.data);
                        contained = !canvas.walls.checkCollision(r);
                    }
                }
            }
        }
        if (contained) return true
    }

    static getDistance(t1, t2, wallblocking = false, auraHeight) {
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
                rdistance = segments.map(segment => canvas.grid.measureDistances([segment], { gridSpaces: true })[0]);
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
     * @param {Token} movedToken - optional value for further extension, currently unused
     * Locate all auras on the canvas, create map of tokens to update, update tokens 
     */
    static async MainAura(movedToken, source, sceneID) {
        if (debug) console.log(source)
        if (!AAgm) return;
        if (sceneID !== canvas.id) return ui.notifications.warn("An update was called on a non viewed scene, auras will be updated when you return to that scene")

        let map = new Map();
        let updateTokens = canvas.tokens.placeables
        let auraTokenId;

        if (movedToken !== undefined) {
            if (ActiveAuras.IsAuraToken(movedToken, canvas)) {
                auraTokenId = movedToken._id
            }
            else if (getProperty(movedToken, "flags.token-attacher")) {
                if (debug) console.log("ActiveAuras: token attacher movement")
            }
            else {
                updateTokens = [];
                updateTokens.push(canvas.tokens.get(movedToken._id))
            }
        }
        ActiveAuras.UpdateAllTokens(map, updateTokens, auraTokenId)

        for (let mapEffect of map) {
            let MapKey = mapEffect[0]
            map.set(MapKey, { add: mapEffect[1].add, token: mapEffect[1].token, effect: mapEffect[1].effect.data })
        }
        if (debug) console.log(map)



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
                        let oldEffectValue = parseInt(value.effect.changes[e].value);
                        let newEffectValue = parseInt(m[1].effect.changes[e].value)
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

        for (let update of map) {
            if (update[1].add) {
                await ActiveAuras.CreateActiveEffect(update[1].token.id, update[1].effect)
            }
            else {
                await ActiveAuras.RemoveActiveEffects(update[1].token.id, update[1].effect.label)
            }
        }
    }

    /**
     * Loop over canvas tokens for individual tests
     * @param {Map} map - empty map to populate 
     * @param {Array} auraEffectArray - array of auras to test against
     * @param {Token} tokens - array of tokens to test against
     */
    static async UpdateAllTokens(map, tokens, tokenId) {
        for (let canvasToken of tokens) {
            ActiveAuras.UpdateToken(map, canvasToken, tokenId)
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


    static DispositonCheck(auraTargets, auraDis, tokenDis) {
        switch (auraTargets) {
            case "Allies": {
                if (auraDis !== tokenDis) return false
                else return true
            }
            case "Enemy": {
                if (auraDis === tokenDis) return false
                else return true
            }
            case "All" : return true;
        }
    }
    /**
     * Test individual token against aura array
     * @param {Map} map - empty map to populate 
     * @param {Array} auraEffectArray - array of auras to test against 
     * @param {Token} canvasToken - single token to test
     */
    static UpdateToken(map, canvasToken, tokenId) {
        if (game.modules.get("multilevel-tokens")) {
            if (ActiveAuras.GetAllFlags(canvasToken, 'multilevel-tokens')) return;
        }
        if (canvasToken.actor === null) return;

        let tokenAlignment;
        try {
            tokenAlignment = canvasToken.actor?.data.data.details.alignment.toLowerCase();
        } catch (error) {
            console.error([`ActiveAuras: the token has an unreadable alignment`, canvasToken])
        }
        let MapKey = canvasToken.scene._id;
        let MapObject = AuraMap.get(MapKey)
        let checkEffects = MapObject.effects;
        //Check for other types of X aura if the aura token is moved
        if (tokenId && canvasToken.id !== tokenId) {
            checkEffects = checkEffects.filter(i => i.entityId === tokenId)
            let duplicateEffect = []
            checkEffects.forEach(e => duplicateEffect = (MapObject.effects.filter(i => (i.data?.label === e.data?.label) && i.entityId !== tokenId)));
            checkEffects = checkEffects.concat(duplicateEffect)
        }

        for (let auraEffect of checkEffects) {
            let auraTargets = auraEffect.data.flags?.ActiveAuras?.aura

            let { radius, height, type, alignment, hostile } = auraEffect.data.flags?.ActiveAuras;
            let { parentActorLink, parentActorId } = auraEffect
            type = type !== undefined ? type.toLowerCase() : "";
            alignment = alignment !== undefined ? alignment.toLowerCase() : "";
            let auraEntity, distance;
            /*
            let auraType = auraEffect.data.flags?.ActiveAuras?.type !== undefined ? auraEffect.data.flags?.ActiveAuras?.type.toLowerCase() : "";
            let auraAlignment = auraEffect.data.flags?.ActiveAuras?.alignment !== undefined ? auraEffect.data.flags?.ActiveAuras?.alignment.toLowerCase() : "";
            let hostileTurn = auraEffect.data.flags?.ActiveAuras?.hostile
            */
            let auraEntityType = auraEffect.entityType

            switch (auraEntityType) {
                //{data: testEffect.data, parentActorLink :testEffect.parent.data.token.actorLink, parentActorId : testEffect.parent._id, tokenId: testToken.id, templateId: template._id, }
                case "token": {
                    if (parentActorLink) {
                        let auraTokenArray = game.actors.get(parentActorId).getActiveTokens()
                        if (auraTokenArray.length > 1) {
                            auraEntity = auraTokenArray.reduce(FindClosestToken, auraTokenArray[0])
                            function FindClosestToken(tokenA, tokenB) {
                                return ActiveAuras.getDistance(tokenA, canvasToken, game.settings.get("ActiveAuras", "wall-block"), height) < ActiveAuras.getDistance(tokenB, canvasToken, game.settings.get("ActiveAuras", "wall-block"), height) ? tokenA : tokenB
                            }
                        }
                        else auraEntity = auraTokenArray[0]
                    }
                    else auraEntity = canvas.tokens.get(auraEffect.entityId)

                    if (auraEntity.id === canvasToken.id) continue;
                    if (alignment) {
                        if (alignment !== "" && !tokenAlignment.includes(alignment) && !tokenAlignment.includes("any")) continue;
                    }
                    if (!ActiveAuras.DispositonCheck(auraTargets, auraEntity.data.disposition, canvasToken.data.disposition)) continue;
                    if (type) {
                        if (!ActiveAuras.CheckType(canvasToken, type)) continue
                    }
                    if (hostile && canvasToken.data._id !== game.combats.active.current.tokenId) continue;
                    distance = ActiveAuras.getDistance(canvasToken, auraEntity, game.settings.get("ActiveAuras", "wall-block"), height)
                }
                    break;
                case "template": {
                    auraEntity = canvas.templates.get(auraEffect.entityId)
                    if (alignment) {
                        if (alignment !== "" && !tokenAlignment.includes(alignment) && !tokenAlignment.includes("any")) continue;
                    }
                    if (type) {
                        if (!ActiveAuras.CheckType(canvasToken, type)) continue
                    }
                    if (hostile && canvasToken.data._id !== game.combats.active.current.tokenId) return;
                    if (ActiveAuras.getTemplateTargets(canvasToken, auraEntity.data)) distance = 0
                    else distance = false

                }
                    break;
                case "drawing": {
                    auraEntity = canvas.drawings.get(auraEffect.entityId)
                    if (alignment) {
                        if (alignment !== "" && !tokenAlignment.includes(alignment) && !tokenAlignment.includes("any")) continue;
                    }
                    if (type) {
                        if (!ActiveAuras.CheckType(canvasToken, type)) continue
                    }
                    if (hostile && canvasToken.data._id !== game.combats.active.current.tokenId) return;
                    if (ActiveAuras.isPointInRegion(canvasToken.center, auraEntity.data)) distance = 0
                    else distance = false
                }
                    break;
            }
            let MapKey = auraEffect.data.label + "-" + canvasToken.id + "-" + auraEntity.id;
            MapObject = map.get(MapKey);


            if ((distance !== false) && (distance <= radius) && !auraEffect.data.flags?.ActiveAuras?.Paused) {
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
    * @param {Token} token - token to apply effect too
    * @param {ActiveEffect} effectData - effect data to generate effect
    */
    static async CreateActiveEffect(tokenID, oldEffectData) {
        let token = canvas.tokens.get(tokenID)

        let duplicateEffect = token.actor.effects.entries.find(e => e.data.label === oldEffectData.label)
        if (getProperty(duplicateEffect, "data.flags.ActiveAuras.isAura")) return;
        if (duplicateEffect) {
            if (duplicateEffect.data.origin === oldEffectData.origin) return;
            if (JSON.stringify(duplicateEffect.data.changes) === JSON.stringify(oldEffectData.changes)) return;
            else await ActiveAuras.RemoveActiveEffects(tokenID, oldEffectData.label)
        }
        if (oldEffectData.flags[MODULE_NAME].save) {
            const flavor = `${CONFIG.DND5E.abilities[oldEffectData.flags[MODULE_NAME].save]} DC${oldEffectData.flags[MODULE_NAME].savedc} ${oldEffectData.label || ""}`;
            let saveRoll = (await token.actor.rollAbilitySave(oldEffectData.flags[MODULE_NAME].save, { flavor }));
            if (saveRoll && (saveRoll.total >= oldEffectData.flags[MODULE_NAME].savedc)) {
                let notification = game.i18n.format("ACTIVEAURAS.saveNotify", { tokenName: token.data.name, oldEffectDataLabel: oldEffectData.label })
                ui.notifications.notify(notification)
                return;
            }
        }
        let effectData = duplicate(oldEffectData)
        if (effectData.flags.ActiveAuras.onlyOnce) {
            if (await token.getFlag("ActiveAuras", `${oldEffectData.origin}`)) return;
            else await token.setFlag("ActiveAuras", `${oldEffectData.origin}`, true)
        }
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
        ['ignoreSelf', 'hidden', 'height', 'alignment', 'type', 'aura', 'radius', 'save', 'isAura', 'savedc', 'height'].forEach(e => delete effectData.flags.ActiveAuras[e])
        if (effectData.flags.ActiveAuras.time !== "None" && effectData.flags.ActiveAuras.time !== undefined && game.modules.get("dae")?.active) {
            effectData.flags.dae?.specialDuration?.push(effectData.flags.ActiveAuras.time)
        }

        await token.actor.createEmbeddedEntity("ActiveEffect", effectData);
        console.log(game.i18n.format("ACTIVEAURAS.ApplyLog", { effectDataLabel: effectData.label, tokenName: token.name }))
    }

    /**
     * 
     * @param {Token} token - token instance to remove effect from
     * @param {String} effectLabel - label of effect to remove
     */
    static async RemoveActiveEffects(tokenID, effectLabel) {
        let token = canvas.tokens.get(tokenID)
        for (let tokenEffects of token.actor.effects) {
            if (tokenEffects.data.label === effectLabel && tokenEffects.data.flags?.ActiveAuras?.applied === true) {
                await token.actor.deleteEmbeddedEntity("ActiveEffect", tokenEffects.id)
                console.log(game.i18n.format("ACTIVEAURAS.RemoveLog", { effectDataLabel: effectLabel, tokenName: token.name }))

            }
        }
    }
}

