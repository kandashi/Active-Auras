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
    MainAura(token)
});

Hooks.on("updateToken", async (scene, token, update, flags, id) => {
    if (!("y" in update || "x" in update)) return;
    MainAura(token,)
});


function MainAura(movedToken) {
    let movedToken_has_aura = false;
    let auraEffectArray = [];

    for (let testToken of canvas.tokens.placeables) {
        for (let testEffect of testToken.actor.effects.entries) {
            if (testEffect.data.flags.ActiveAuras.aura !== "None") {
                if (testToken.id === movedToken.id) movedToken_has_aura = true
                auraEffectArray.push(testEffect)
            }
        }
    }

    let map = new Map();
    UpdateAllTokens(map, auraEffectArray, canvas.tokens.placeables)

    for (let update of map) {
        if (update[1].add) {
            createActiveEffect(update[1].token, update[1].effect)
        }
        else {
            removeActiveEffects(update[1].token, update[1].effect.data.label)
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
        let auraTargets = auraEffect.data.flags.ActiveAuras.aura
        let MapKey = auraEffect.data.label + "-" + canvasToken.id;
        MapObject = map.get(MapKey);
        let auraToken;
        let auraRadius = auraEffect.data.flags.ActiveAuras.radius
        if (auraEffect.parent.token) {
            auraToken = auraEffect.parent.token
        }
        else if (auraEffect.parent.data.type === "character") {
            auraToken = game.actors.get(auraEffect.parent.data._id).getActiveTokens()[0]
        }
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
    let newEffectData = duplicate(effectData.data)
    newEffectData.flags.ActiveAuras = {
        aura: "None"
    }

    for (let change of newEffectData.changes) {
        if (typeof change.value === "string") {
            if (change.value.includes("@")) {
                let dataPath = change.value.substring(1)
                let newValue = getProperty(effectData.parent.getRollData(), dataPath)
                const changeIndex = newEffectData.changes.findIndex(i => i.value === change.value && i.key === change.key)
                newEffectData.changes[changeIndex].value = newValue
            }
        }
    }
    console.log(newEffectData)
    if (token.actor.effects.entries.find(e => e.data.label === newEffectData.label)) return
    await token.actor.createEmbeddedEntity("ActiveEffect", newEffectData);

}

function removeActiveEffects(token, effectLabel) {
    for (let tokenEffects of token.actor.effects) {
        if (tokenEffects.data.label === effectLabel) {
            tokenEffects.delete()
        }
    }
}
