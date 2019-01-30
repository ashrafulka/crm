const {ccclass, property} = cc._decorator;

@ccclass
export default class GizmoGraphic extends cc.Component {

    myGraphicsNode:cc.Graphics;

    onLoad () {
        this.myGraphicsNode = this.getComponent(cc.Graphics);
    }//onLoad

    DrawControlCircle(center:cc.Vec2, radius:number, clear=true) {
        if (clear) this.myGraphicsNode.clear();

        this.myGraphicsNode.strokeColor = cc.Color.BLACK;
        this.myGraphicsNode.circle(center.x, center.y, radius);
        this.myGraphicsNode.stroke();
    }

    DrawControlLine(start:cc.Vec2, end:cc.Vec2, clear = true){
        if (clear) this.myGraphicsNode.clear();

        this.myGraphicsNode.lineWidth = 1;
        this.myGraphicsNode.strokeColor = cc.Color.BLACK;

        this.myGraphicsNode.moveTo(start.x, start.y);
        this.myGraphicsNode.lineTo(start.x, start.y);
        this.myGraphicsNode.lineTo(end.x, end.y);
        this.myGraphicsNode.stroke();

        this.myGraphicsNode.strokeColor = cc.Color.YELLOW;
        this.myGraphicsNode.moveTo(start.x, start.y);
        
        this.myGraphicsNode.lineTo(start.x, start.y);
        this.myGraphicsNode.lineTo(start.x + (start.x - end.x), start.y + (start.y-end.y));

        this.myGraphicsNode.stroke();
    }

    // DrawControlLineByDistance(){

    // }

}

