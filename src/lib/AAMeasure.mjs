// bounding box check
// center collision check
// edges collision check
// draw pixi polygon
// edges pixi.contains

import { AAHelpers } from "./AAHelpers.mjs";
import Logger from "./Logger.mjs";

export class AAMeasure {

  // collision blocked by sight or movement
  static checkCollision(ray) {
    return CONFIG.Canvas.polygonBackends["sight"].testCollision(ray.A, ray.B, { mode: "any", type: "sight" })
      || CONFIG.Canvas.polygonBackends["move"].testCollision(ray.A, ray.B, { mode: "any", type: "move" });
  }

  static inAura(target, source, wallBlocking = false, auraHeight, radius, shape) {
    const gs = canvas.dimensions.size;
    const g2 = gs / 2;

    // console.warn(`SourceX: ${source.x}, SourceY: ${source.y}, TargetX: ${target.x}, TargetY: ${target.y}`);

    if (!AAMeasure.boundingCheck(target, source, radius)) return false;
    const auraPoly = shape;
    if (CONFIG.debug.AA && shape) {
      canvas.layers
        .find((l) => l.name === "DrawingsLayer")
        .children.find((i) => i.inAura)
        ?.destroy();
      const g = new PIXI.Graphics();
      g.beginFill(0, 0.2).drawShape(shape);
      const aura = canvas.layers.find((l) => l.name === "DrawingsLayer").addChild(g);
      aura.inAura = true;
    }

    let sourceCorners = source.document.height === 1 && source.document.width === 1
      ? [{ x: source.center.x, y: source.center.y }]
      : [
        { x: source.center.x, y: source.center.y },
        { x: source.x + g2, y: source.y + g2 },
        { x: source.x + source.document.width * gs - g2, y: source.y + g2 },
        { x: source.x + g2, y: source.y + source.document.height * gs - g2 },
        { x: source.x + source.document.width * gs - g2, y: source.y + source.document.height * gs - g2 },
      ];

    let targetCorners = target.document.height === 1 && target.document.width === 1
      ? [{ x: target.center.x, y: target.center.y, collides: false }]
      : [
        { x: target.center.x, y: target.center.y, collides: false },
        { x: target.x + g2, y: target.y + g2, collides: false },
        { x: target.x + target.document.width * gs - g2, y: target.y + g2, collides: false },
        { x: target.x + g2, y: target.y + target.document.height * gs - g2, collides: false },
        {
          x: target.x + target.document.width * gs - g2,
          y: target.y + target.document.height * gs - g2,
          collides: false,
        },
      ];

    if (CONFIG.debug.AA) {
      canvas.layers
        .find((l) => l.name === "DrawingsLayer")
        .children.filter((i) => i.squares)
        ?.forEach((i) => i.destroy());

      sourceCorners.forEach((i) => AAHelpers.drawSquare(i));
      targetCorners.forEach((i) => AAHelpers.drawSquare(i));
    }

    for (const t of targetCorners) {
      if (!auraPoly.contains(t.x, t.y)) continue; // quick exit if not in the aura

      for (const s of sourceCorners) {
        const r = new Ray(t, s);
        if (wallBlocking) {
          let collision;
          if (game.modules.get("levels")?.active) {
            collision = CONFIG.Levels.API.testCollision(
              { x: t.x, y: t.y, z: target.document.elevation },
              { x: s.x, y: s.y, z: source.document.elevation ?? source.flags?.levels?.elevation },
              "collision"
            );
          } else {
            // collision blocked by sight or movement
            collision = AAMeasure.checkCollision(r);
          }
          if (collision) continue;
        }
        if (auraHeight) {
          if (!AAMeasure.heightCheck(source, target, radius, r)) continue;
        }
        return true;
      }
    }
    return false;
  }

  static isTokenInside(templateDetails, token, wallsBlockTargeting = false) {
    const grid = canvas?.scene?.grid?.size;
    if (!grid) return false;
    const templatePos = { x: templateDetails.x, y: templateDetails.y };
    // Check for center of each square the token uses.
    // e.g. for large tokens all 4 squares
    const startX = token.document.width >= 1 ? 0.5 : token.document.width / 2;
    const startY = token.document.height >= 1 ? 0.5 : token.document.height / 2;
    for (let x = startX; x < token.document.width; x++) {
      for (let y = startY; y < token.document.height; y++) {
        const currGrid = {
          x: token.document.x + x * grid - templatePos.x,
          y: token.document.y + y * grid - templatePos.y,
        };
        let contains = templateDetails.shape?.contains(currGrid.x, currGrid.y);
        if (contains && wallsBlockTargeting) {
          let tx = templatePos.x;
          let ty = templatePos.y;
          if (templateDetails.shape.type === 1) {
            // A rectangle
            tx = tx + templateDetails.shape.width / 2;
            ty = ty + templateDetails.shape.height / 2;
          }
          const r = new Ray({ x: tx, y: ty }, { x: currGrid.x + templatePos.x, y: currGrid.y + templatePos.y });

          Logger.debug("templateCheck", { templateDetails, token, contains, tx, ty, r });

          // check to see if blocked by template
          contains = !AAMeasure.checkCollision(r);
        }
        // Check the distance from origin.
        if (contains) return true;
      }
    }
    return false;
  }
  static heightCheck(source, target, radius, r) {
    let distance;
    switch (game.settings.get("ActiveAuras", "vertical-euclidean")) {
      case true:
        {
          distance = Math.abs(source.document.elevation - target.document.elevation);
        }
        break;
      case false: {
        const g = canvas.dimensions;
        const a = (r.distance / g.size) * g.distance;
        const b = source.document.elevation - target.document.elevation;
        const c = a * a + b * b;
        distance = Math.sqrt(c);
      }
    }
    return distance <= radius;
  }

  /**
   *
   * @param {object} t1 target token
   * @param {object} t2 source token
   * @param {number} radius
   * @returns boolean
   */
  static boundingCheck(t1, t2, radius) {
    const { size, distance } = canvas.dimensions;
    const rad = (radius / distance) * size;
    const xMax = t2.x + rad + t2.w + size * t1.document.width;
    const xMin = t2.x - rad - size * t1.document.width;
    const yMax = t2.y + rad + t2.h + size * t1.document.height;
    const yMin = t2.y - rad - size * t1.document.height;
    if (CONFIG.debug.AA) {
      canvas.layers
        .find((l) => l.name === "DrawingsLayer")
        .children.find((i) => i.boundingCheck)
        ?.destroy();
      let g = new PIXI.Graphics();
      g.beginFill(0, 0.1).drawRect(xMin, yMin, xMax - xMin, yMax - yMin);
      let check = canvas.layers.find((l) => l.name === "DrawingsLayer").addChild(g);
      check.boundingCheck = true;
    }
    return !(t1.x < xMin || t1.x > xMax || t1.y > yMax || t1.y < yMin);
  }
}
