const { ccclass, property } = cc._decorator;

@ccclass
export default class BotGizmo extends cc.Component {

    @property(cc.Graphics)
    gg: cc.Graphics = null;

    DrawCircle(point: cc.Vec2, radius: number = 5, clear: boolean = false, color: cc.Color = cc.Color.RED) {
        if (clear) this.gg.clear();

        this.gg.strokeColor = color;
        this.gg.circle(point.x, point.y, radius);
        this.gg.stroke();
    }

    DrawLine(p1: cc.Vec2, p2: cc.Vec2) {
        this.gg.lineWidth = 1;
        this.gg.strokeColor = cc.Color.BLACK;

        this.gg.moveTo(p1.x, p1.y);
        this.gg.lineTo(p1.x, p1.y);
        this.gg.lineTo(p2.x, p2.y);
        this.gg.stroke();
    }

    // update (dt) {}
}
