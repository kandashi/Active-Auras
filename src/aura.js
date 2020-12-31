

Hooks.on("renderActiveEffectConfig", (sheet, html) => {
    console.log(sheet)
    const originHandle = html.find($('input[name="disabled"]'))
    const flags = sheet.object.data.flags;

    const aoeHTML = `
    <div class="form-group">
          <label>Effect is Aura?</label>
          <label></label>
          <div class="active-aura">
            <select name="flags.active-auras.aura" data-dtype="String" value=${flags.active - auras.aura}>
              <option value="None" ${flags.active - auras.aura === 'None' ? 'selected' : ''}></option>
              <option value="Enemy"${flags.active - auras.aura === 'Enemy' ? 'selected' : ''}>Enemies</option>
              <option value="Allies"${flags.active - auras.aura === 'Allies' ? 'selected' : ''}>Allies</option>
               <option value="All"${flags.active - auras.aura === 'All' ? 'selected' : ''}>All</option>
            </select>
          </div>
        </div>
    `
    html.css("height", "auto");
    originHandle.parent().after(aoeHTML)
});

Hooks.on("updateToken", async (scene, token, update, flags, id) => {
    // console.log(token);
    // console.log(updateData);
    if (!("y" in update || "x" in update)) return;

});



// on movement check current token for auras, check scene for other auras 
// update moved token
//update tokens around aura

function FindAuras(tokens) {
    let auraTokenArray;
    for (let auraToken of tokens) {
        if (auraToken.actor.items.find(e => e.effects.flags.active - auras.aura)) {
            auraTokenArray.push(auraToken)
        }
    }
}

function checkOwner(token) {
    if (token.actor.items.find(element => element.effects.flags.active - auras.aura)) {
        return true;
    }
    return false;
}

function getPlayerCharacters() {
    let playerCharacters = canvas.tokens.placeables.filter(token => token.data.disposition == 1);
    console.log(playerCharacters);
    return playerCharacters;
}

function getProtectors(playerCharacters) {
    let protectors = [];
    //loop through PCs, find only "protectors"
    playerCharacters.forEach((item, i) => {
        let aura = item.actor.items.find(element => element.data?.name == "Aura of Protection");

        //create an array entry into "protectors" containing the token and the cha mod
        let protectorCount = 0;
        if (aura) {
            protectors.push([]);
            protectors[protectorCount].push(item);
            protectors[protectorCount].push(item.actor.data.data.abilities.cha.mod);
            protectorCount++;
        }
    });
    //sort from highest to lowest charisma mod and return protectors
    protectors.sort((a, b) => (a[1] - b[1]));
    return protectors;

}

function createActiveEffect(actor, newSave) {
    console.log(newSave)
    let aura = actor.effects.find(i => i.data.label === "Aura of Protection");
    if (aura !== null) {
        let changes = aura.data.changes;
        changes[0].value = newSave
        aura.update({ changes });
    } else {
        let effectData = {
            label: "Aura of Protection",
            icon: "",
            changes: [{
                "key": "data.bonuses.abilities.save",
                "mode": 2,
                "value": newSave,
                "priority": "20"
            }]
        }
        actor.createEmbeddedEntity("ActiveEffect", effectData);
    }
}

function applyAura(updateData) {

    let auraTokens = canvas.tokens.placeables.filter(t => t.actor.items.find(i => i.effects.data.changes?.aura))


    let playerCharacters = getPlayerCharacters();
    let protectors = getProtectors(playerCharacters);
    let token = canvas.tokens.placeables.find(element => element.id == updateData._id);
    let gs = canvas.grid.size;

    protectors.forEach((protector, i) => {
        let x = updateData.x ? updateData.x : token.x;
        let y = updateData.y ? updateData.y : token.y;

        let d1 = Math.abs((protector[0].x - x) / gs);
        let d2 = Math.abs((protector[0].y - y) / gs);
        let maxDim = Math.max(d1, d2);
        let minDim = Math.min(d1, d2);
        let dist = (maxDim + Math.floor(minDim / 2)) * canvas.scene.data.gridDistance;

        let newSave = dist <= 10 ? protector[1] : 0;
        let actor = game.actors.get(token.actor._id);
        createActiveEffect(actor, newSave);
        // //Previous application method
        // let newSave = dist <= 10 ? protector[1] : 0;
        // game.actors.get(token.actor._id).update({ "data.bonuses.abilities.save": newSave });

    });
}

//Split this up -->
//getRecipients --> create an array of recipients, their token + the mod.
//Overwrite array entry if existing token in multiple paladin auraSource

//applyAuras(recipients) --> single database update
//use updateEmbeddedEntity() or updateMany()


function applyAllAuras(updateData) {
    // console.log("Paladin Movement");
    let playerCharacters = getPlayerCharacters();
    let protectors = getProtectors(playerCharacters);
    let gs = canvas.grid.size;
    let updates = [];

    protectors.forEach((protector, i) => {
        playerCharacters.forEach((pc, j) => {

            //do not apply to self
            if (protector[0].id != pc.id) {


                //get correct x + y data for updated token
                let x = updateData._id == protector[0].id && "x" in updateData ? updateData.x : protector[0].x;
                let y = updateData._id == protector[0].id && "y" in updateData ? updateData.y : protector[0].y;
                // console.log("x: ", x, "y: ", y);

                //distance calculation between tokens
                let d1 = Math.abs((x - pc.x) / gs);
                let d2 = Math.abs((y - pc.y) / gs);
                let maxDim = Math.max(d1, d2);
                let minDim = Math.min(d1, d2);
                let dist = (maxDim + Math.floor(minDim / 2)) * canvas.scene.data.gridDistance;

                //check distnace and apply aura
                let newSave = dist <= 10 ? protector[1] : 0;
                let actor = game.actors.get(pc.actor._id);
                createActiveEffect(actor, newSave);

                // updates.push({
                //   _id: pc.actor._id,
                //   "data.bonuses.abilities.save": newSave
                // });

                //game.actors.get(pc.actor._id).update({"data.bonuses.abilities.save": newSave });

            }
        });
        // console.log(updates);
        // game.actors.updateMany(updates);
    });
}
