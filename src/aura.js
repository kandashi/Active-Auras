const MODULE_NAME = "ActiveAuras";

Hooks.on("renderActiveEffectConfig", async (sheet, html) => {
    await sheet.object.setFlag(`${MODULE_NAME}`, 'aura')
    const originHandle = html.find($('input[name="disabled"]'))
    const flags = sheet.object.data.flags;

    const aoeHTML = `
    <div class="form-group">
          <label>Aura Targets:</label>
          <label></label>
          <div class="aura">
            <select name="flags.${MODULE_NAME}.aura" data-dtype="String" value=${flags[MODULE_NAME]?.aura}>
              <option value="None" ${flags[MODULE_NAME].aura === 'None' ? 'selected' : ''}></option>
              <option value="Enemy"${flags[MODULE_NAME].aura === 'Enemy' ? 'selected' : ''}>Enemies</option>
              <option value="Allies"${flags[MODULE_NAME].aura === 'Allies' ? 'selected' : ''}>Allies</option>
               <option value="All"${flags[MODULE_NAME].aura === 'All' ? 'selected' : ''}>All</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Aura radius (from token center)</label>
          <input id="radius" name="flags.${MODULE_NAME}.radius" type="number" min="0" value="${flags[MODULE_NAME].radius}"></input>
            </select>
          </div>
        </div>
    `
    html.css("height", "auto");
    originHandle.parent().after(aoeHTML)
});

Hooks.on("createToken", (scene, token) => {
    MainAura(token)
});

Hooks.on("deleteToken", (scene, token) => {
    let oldEffects = []
    for (let testEffect of token.actorData.effects.entries) {
        let isAura = testEffect.getFlag('ActiveAuras', 'aura')
        let appliedAura = testEffect.getFlag('ActiveAuras', 'applied')
        if (isAura && isAura !== "None") {
            //if (testToken.id === movedToken.id) movedToken_has_aura = true
            oldEffects.push(testEffect)
        }
    }
    oldEffects.forEach(i => RemoveAura(i))
});

Hooks.on("updateToken", (scene, token, update, flags, id) => {
    if (!("y" in update || "x" in update)) return;
    MainAura(token,)
});

Hooks.on("deleteActiveEffect", (actor, effect) => {
    let auraStatus = effect.flags.ActiveAuras.aura;
    let applyStatus = effect.flags.ActiveAuras.applied;
    let token = null
    if (auraStatus !== "None" && !applyStatus) {
        RemoveAura(effect, token, actor)
    }
});



Hooks.on("preUpdateToken", (scene, token, update) => {
    if (!(update.actorData?.effects)) return;
    let removed = token.actorData.effects.filter(x => !update.actorData.effects.includes(x));
    let added = update.actorData.effects.filter(x => !token.actorData.effects.includes(x));
    if (removed.length > 0) {
        RemoveAura(removed[0], token)
    }
    if (added.length > 0) {
        Hooks.once("updateToken", () =>{
            MainAura()
        })
    }

})

Hooks.on("createActiveEffect", (actor, effect) => {
    if (!effect.flags.ActiveAuras.applied && effect.flags.ActiveAuras.aura !== "None") {
        Hooks.once("renderActorSheet5eCharacter", () =>{
        MainAura();
        });
    };
});

function MainAura(movedToken) {
    //let movedToken_has_aura = false;
    let auraEffectArray = [];
    for (let testToken of canvas.tokens.placeables) {
        for (let testEffect of testToken.actor.effects.entries) {
            let isAura = testEffect.getFlag('ActiveAuras', 'aura')
            let appliedAura = testEffect.getFlag('ActiveAuras', 'applied')
            if (isAura && !appliedAura) {
                //if (testToken.id === movedToken.id) movedToken_has_aura = true
                auraEffectArray.push(testEffect)
            }
        }
    }

    let map = new Map();
    UpdateAllTokens(map, auraEffectArray, canvas.tokens.placeables)

    for (let mapEffect of map) {
        let MapKey = mapEffect[0]
        let newEffectData = duplicate(mapEffect[1].effect.data)
        newEffectData.flags.ActiveAuras = {
            aura: "None",
            applied: true
        }

        for (let change of newEffectData.changes) {

            if (typeof change.value === "string") {
                if (change.value.includes("@")) {
                    let dataPath = change.value.substring(1)
                    let newValue = getProperty(mapEffect[1].effect.parent.getRollData(), dataPath)
                    const changeIndex = newEffectData.changes.findIndex(i => i.value === change.value && i.key === change.key)
                    newEffectData.changes[changeIndex].value = newValue
                }
            }
        }
        map.set(MapKey, { add: mapEffect[1].add, token: mapEffect[1].token, effect: newEffectData })
    }

    for (let update of map) {
        if (update[1].add) {
            createActiveEffect(update[1].token, update[1].effect)
        }
        else {
            removeActiveEffects(update[1].token, update[1].effect.label)
        }
    }
}

async function RemoveAura(effect, token, actor) {
    let auraToken;
    if (token) {
        auraToken = canvas.tokens.get(token._id)
    }
    else if (actor){
        auraToken = actor.getActiveTokens()[0]
    }
    let auraRadius = effect.flags.ActiveAuras.radius;
    for (let canvasToken of canvas.tokens.placeables) {
        let oldEffect = canvasToken.actor.effects.find(i => i.data.label === effect.label)
        if(!oldEffect) continue;
        let distance = RayDistance(canvasToken, auraToken)
        if (distance <= auraRadius) {
            if (oldEffect.getFlag('ActiveAuras', 'applied')) {
                oldEffect.delete()
            }
        }
    }
}

function UpdateAllTokens(map, auraEffectArray, tokens) {
    for (let canvasToken of tokens) {
        UpdateToken(map, auraEffectArray, canvasToken)
    }
}

function UpdateToken(map, auraEffectArray, canvasToken) {
    for (let auraEffect of auraEffectArray) {
        let auraTargets = auraEffect.getFlag('ActiveAuras', 'aura')
        let MapKey = auraEffect.data.label + "-" + canvasToken.id;
        MapObject = map.get(MapKey);
        let auraToken;
        let auraRadius = auraEffect.getFlag('ActiveAuras', 'radius')
        if (auraEffect.parent.token) {
            auraToken = auraEffect.parent.token
        }
        else if (auraEffect.parent.data.type === "character") {
            auraToken = game.actors.get(auraEffect.parent.data._id).getActiveTokens()[0]
        }
        if (auraToken.id === canvasToken.id) continue;
        if (auraTargets === "Allies" && (auraToken.data.disposition !== canvasToken.data.disposition)) continue;
        if (auraTargets === "Enemy" && (auraToken.data.disposition === canvasToken.data.disposition)) continue;

        let distance = RayDistance(canvasToken, auraToken)
        if (distance <= auraRadius) {
            if (MapObject) {
                MapObject.add = true
            }
            else {
                map.set(MapKey, { add: true, token: canvasToken, effect: auraEffect })
            }
        }
        else if (!MapObject?.add && canvasToken.actor.effects.entries.some(e => e.data.label === auraEffect.data.label)) {
            if (MapObject) {
                MapObject.add = false
            }
            else {
                map.set(MapKey, { add: false, token: canvasToken, effect: auraEffect })
            }
        }
    }
}

function RayDistance(token1, token2) {
    const ray = new Ray(token1.center, token2.center)
    const segments = [{ ray }]
    let distance = canvas.grid.measureDistances(segments, { gridSpaces: true })[0]
    return distance
}

async function createActiveEffect(token, effectData) {
    if (token.actor.effects.entries.find(e => e.data.label === effectData.label)) return
    await token.actor.createEmbeddedEntity("ActiveEffect", effectData);
    console.log(`Active Auras: applied ${effectData.label} to ${token.name}`)

}

function removeActiveEffects(token, effectLabel) {
    for (let tokenEffects of token.actor.effects) {
        if (tokenEffects.data.label === effectLabel) {
            tokenEffects.delete()
            console.log(`Active Auras: removed ${effectLabel} to ${token.name}`)

        }
    }
}
