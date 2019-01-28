import Striker from "./Striker";
import Helper from "./Helpers/Helper";
import GizmoGraphic from "./Helpers/GizmoGraphic";


const {ccclass, property} = cc._decorator;

@ccclass
export default class ControlManager extends cc.Component {

    @property(cc.Slider)
    controlSlider: cc.Slider = null;

    @property(Striker)
    striker : Striker = null;

    @property(GizmoGraphic)
    gizmosComp:GizmoGraphic = null;

    @property(cc.Node)
    dummyNode:cc.Node = null;

    strikerStartPosition:cc.Vec2 = cc.Vec2.ZERO;

    onLoad () {
        this.controlSlider.slideEvents.push(Helper.getEventHandler(this.node, "ControlManager", "OnSlide"));

        //this.striker.node.on(cc.Node.EventType.TOUCH_START, this.OnStrickerTouchStart, this);
        this.striker.node.on(cc.Node.EventType.TOUCH_MOVE, this.OnStrickerDrag, this);
    }//onLoad

    OnStrickerTouchStart(event:cc.Event.EventTouch){
        this.strikerStartPosition = event.getTouches()[0].getLocation();
    }

    OnStrickerDrag(event:cc.Event.EventTouch) {
        let delta = event.getDelta();
        let touch = event.getTouches()[0]
        this.dummyNode.setPosition(this.dummyNode.parent.convertToNodeSpaceAR(touch.getLocation()));
        let touchDistance = this.striker.strickerBody.getPosition().x - this.striker.node.convertToNodeSpaceAR(touch.getLocation()).x;
        
        this.gizmosComp.DrawControlCircle(this.striker.strickerBody.getPosition(), 100 );
        //this.gizmosComp.DrawControlCircle(this.gizmosComp.node.parent.convertToNodeSpaceAR(touch.getLocation()), 100);
    }

    OnSlide() {
        this.striker.OnSlide(this.controlSlider.progress);
    }
}
