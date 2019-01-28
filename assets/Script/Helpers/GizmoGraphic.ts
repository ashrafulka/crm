const {ccclass, property} = cc._decorator;

@ccclass
export default class GizmoGraphic extends cc.Component {

    myGraphicsNode:cc.Graphics;

    onLoad () {
        this.myGraphicsNode = this.getComponent(cc.Graphics);
    }//onLoad

    DrawControlCircle(center:cc.Vec2, radius:number, clear=true) {
        if (clear) this.myGraphicsNode.clear();
        this.myGraphicsNode.circle(center.x, center.y, radius);
        this.myGraphicsNode.stroke();
    }
}
