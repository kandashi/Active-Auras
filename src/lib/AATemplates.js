export class AATemplates {
  static getTemplateShape(template) {
    let d = canvas.dimensions;

    // Extract and prepare data
    let { direction, distance, angle, width } = template.document;
    distance *= d.size / d.distance;
    width *= d.size / d.distance;
    direction = Math.toRadians(direction);
    let shape;
    switch (template.document.t) {
      case "circle":
        shape = template._getCircleShape(distance);
        break;
      case "cone":
        shape = template._getConeShape(direction, angle, distance);
        break;
      case "rect":
        shape = template._getRectShape(direction, distance);
        break;
      case "ray":
        shape = template._getRayShape(direction, distance, width);
        break;
    }
    shape.x = template.x;
    shape.y = template.y;
    return shape;
  }

  static getAuraShape(source, radius) {
    let shape = "circle";
    if (["dnd5e", "dnd4e"].includes(game.system.id)) {
      if (foundry.utils.isNewerVersion(game.version, "12.0") && foundry.utils.isNewerVersion(game.system.version, "3.3.0")) {
        if (game.settings.get("core", "gridDiagonals") === 0) shape = "rectangle";
      } else {
        if (game.settings.get(game.system.id, "diagonalMovement") === "555") shape = "rectangle";
      }
    }

    const gs = canvas.dimensions.size;
    const gd = gs / canvas.dimensions.distance;

    switch (shape) {
      case "rectangle": {
        return new PIXI.Rectangle(
          source.x - radius * gd,
          source.y - radius * gd,
          radius * gd * 2 + source.document.width * gs,
          radius * gd * 2 + source.document.height * gs
        );
      }
      case "circle":
      default: {
        return new PIXI.Circle(source.center.x, source.center.y, radius * gd + (source.document.width / 2) * gs);
      }
    }
  }

  static PixiFromPolygon(data) {
    const shapeData = data.shape.data;
    const pixiPoints = [];
    for (let i = 0; i < shapeData.shape.points.length; i += 2) {
      pixiPoints.push(new PIXI.Point(shapeData.shape.points[i] + shapeData.x, shapeData.shape.points[i+1] + shapeData.y));
    }
    return new PIXI.Polygon(pixiPoints);
  }

  static PixiFromEllipse(data) {
    const { x, y, width, height } = data.shape.data;
    return new PIXI.Ellipse(x + width / 2, y + height / 2, width / 2, height / 2);
  }

  static PixiFromRect(data) {
    const { x, y, width, height } = data.shape.data;
    return new PIXI.Rectangle(x, y, width, height);
  }

  static getDrawingShape(data) {
    let shape;
    switch (data.type) {
      case CONST.DRAWING_TYPES.RECTANGLE:
        shape = AATemplates.PixiFromRect(data);
        break;
      case CONST.DRAWING_TYPES.ELLIPSE:
        shape = AATemplates.PixiFromEllipse(data);
        break;
      case CONST.DRAWING_TYPES.POLYGON:
        shape = AATemplates.PixiFromPolygon(data);
        break;
    }
    return shape;
  }
}
