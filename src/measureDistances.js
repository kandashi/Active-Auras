//bounding box check
// center collision check
// edges collision check
// draw pixi polygon
// edges pixi.contains 

class AAmeasure {


    static async inAura(target, source, wallblocking = false, auraHeight, radius, shape) {
        const gs = canvas.dimensions.size
        const g2 = gs / 2;

        if (!AAmeasure.boundingCheck(target, source, radius)) return false;
        const auraPoly = shape
        if (AAdebug) {
            canvas.foreground.children.find(i => i.inAura)?.destroy()
            let g = new PIXI.Graphics()
            g.beginFill(0, 0.2).drawShape(shape)
            let aura = canvas.foreground.addChild(g)
            aura.inAura = true
        }

        let sourceCorners = source.data.height === 1 && source.data.width === 1 ?
            [{ x: source.center.x, y: source.center.y }] :
            [
                { x: source.center.x, y: source.center.y },
                { x: source.x + g2, y: source.y + g2 },
                { x: source.x + (source.data.width * gs) - g2, y: source.y + g2 },
                { x: source.x + g2, y: source.y + (source.data.height * gs) - g2 },
                { x: source.x + (source.data.width * gs) - g2, y: source.y + (source.data.height * gs) - g2 }
            ]

        let targetCorners = target.data.height === 1 && target.data.width === 1 ?
            [{ x: target.center.x, y: target.center.y, collides: false }] :
            [
                { x: target.center.x, y: target.center.y, collides: false },
                { x: target.x + g2, y: target.y + g2, collides: false },
                { x: target.x + (target.data.width * gs) - g2, y: target.y + g2, collides: false },
                { x: target.x + g2, y: target.y + (target.data.height * gs) - g2, collides: false },
                { x: target.x + (target.data.width * gs) - g2, y: target.y + (target.data.height * gs) - g2, collides: false }
            ]

        for (let t of targetCorners) {
            if (!auraPoly.contains(t.x, t.y)) continue; // quick exit if not in the aura

            for (let s of sourceCorners) {
                let r = new Ray(t, s)
                if (wallblocking) {
                    let collision;
                    if (game.modules.get("levels")?.active) {

                        collision = _levels.testCollision({ x: t.x, y: t.y, z: target.data.elevation }, { x: s.x, y: s.y, z: source.data.elevation ?? source.data.flags?.levels?.elevation }, "collision")
                    }
                    else {
                        collision = canvas.walls.checkCollision(r)
                    }
                    if (collision) continue
                }
                if (auraHeight) {
                    if (!await AAmeasure.heightCheck(source, target, radius, r)) continue
                }
                return true
            }
        }
        return false
    }

    static async heightCheck(source, target, radius, r) {
        let distance;
        switch (game.settings.get("ActiveAuras", "vertical-euclidean")) {
            case true: {
                distance = Math.abs(source.data.elevation - target.data.elevation)
            }
                break;
            case false: {
                let g = canvas.dimensions
                let a = r.distance / g.size * g.distance;
                let b = (source.data.elevation - target.data.elevation)
                let c = (a * a) + (b * b)
                distance = Math.sqrt(c)
            }
        }
        return distance <= radius;
    }

    /**
     * 
     * @param {object} t1 source token
     * @param {object} t2 target token
     * @param {number} radius 
     * @returns boolean
     */
    static boundingCheck(t1, t2, radius) {
        let { size, distance } = canvas.dimensions
        let rad = (radius / distance) * size
        const xMax = t2.data.x + rad + t2.w + size
        const xMin = t2.data.x - rad - size
        const yMax = t2.data.y + rad + t2.h + size
        const yMin = t2.data.y - rad - size
        if (AAdebug) {
            canvas.foreground.children.find(i => i.boundingCheck)?.destroy()
            let g = new PIXI.Graphics()
            g.beginFill(0, 0.1).drawRect(xMin, yMin, (xMax - xMin), (yMax - yMin))
            let check = canvas.foreground.addChild(g)
            check.boundingCheck = true
        }
        return !(t1.data.x < xMin || t1.data.x > xMax || t1.data.y > yMax || t1.data.y < yMin);
    }


}