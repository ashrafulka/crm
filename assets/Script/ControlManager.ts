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

    @property
    minDistanceRequired:number = 50;
    @property
    maxDistanceAllowed: number = 100;

    mStrikerStartPos:cc.Vec2 = cc.Vec2.ZERO;

    mIsTouchStarted:boolean = false;


    onLoad () {
        this.controlSlider.slideEvents.push(Helper.getEventHandler(this.node, "ControlManager", "OnSlide"));
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.OnKeyDown, this);

        this.striker.strickerBody.on(cc.Node.EventType.TOUCH_MOVE, this.OnStrickerDrag.bind(this));
        this.striker.strickerBody.on(cc.Node.EventType.TOUCH_END, this.OnStrikerDragEnd.bind(this));
        this.striker.strickerBody.on(cc.Node.EventType.TOUCH_CANCEL, this.OnStrikerDragEnd.bind(this));

    }//onLoad

    OnStrickerTouchStart(event:cc.Event.EventTouch){
        this.mStrikerStartPos = event.getTouches()[0].getLocation();
    }

    OnKeyDown(event) {
        switch(event.keyCode){
            case cc.macro.KEY.space:
                this.controlSlider.progress = 0.5;
                this.gizmosComp.myGraphicsNode.clear();
                this.striker.ResetStriker();
                break;
            default:
                //console.log("DEFAULT KEY: " + event.keyCode);
                break;
        }
    }

    OnStrickerDrag(event:cc.Event.EventTouch) {
        let touch = event.getTouches()[0];
        let clear = true;
        let strikerCenter = this.striker.strickerBody.parent.convertToWorldSpaceAR(this.striker.strickerBody.getPosition())
        let touchDistance = Helper.getDistance( strikerCenter, touch.getLocation() );

        if (touchDistance > this.minDistanceRequired) {
            this.mIsTouchStarted = true;
            this.gizmosComp.DrawControlCircle(
                strikerCenter,
                touchDistance>this.maxDistanceAllowed ? this.maxDistanceAllowed : touchDistance,
                clear 
            );
        } else {
            this.gizmosComp.myGraphicsNode.clear();
        }

        
        let radius = touchDistance > this.maxDistanceAllowed ? this.maxDistanceAllowed : touchDistance;
        let touchAngle = Helper.getAngle360( new cc.Vec2(1,0), touch.getStartLocation().sub(touch.getLocation()));
        let touchPointOnCircle = new cc.Vec2(strikerCenter.x + radius * Math.cos(touchAngle), strikerCenter.y + radius * Math.sin(touchAngle));

        clear = !this.mIsTouchStarted;
        this.gizmosComp.DrawControlCircle(touchPointOnCircle, 25);
        // this.gizmosComp.DrawControlCircle(
        //     this.striker.strickerBody.parent.convertToWorldSpaceAR(this.striker.strickerBody.getPosition()), 25, clear); //static
        // this.gizmosComp.DrawControlCircle(touch.getLocation(), 10, clear); //touch end
        this.gizmosComp.DrawControlLine(
            this.striker.strickerBody.parent.convertToWorldSpaceAR(this.striker.strickerBody.getPosition()),
            touch.getLocation(), clear);
        
    }

    OnStrikerDragEnd(event:cc.Event.EventTouch){
        if (this.mIsTouchStarted == false) return;

        let touch = event.getTouches()[0];
        let forceVector = touch.getStartLocation().sub(touch.getLocation());
        let magnitude = Math.sqrt(forceVector.x * forceVector.x + forceVector.y * forceVector.y);
        this.striker.ApplyForce(forceVector,  magnitude);

        this.gizmosComp.myGraphicsNode.clear();
        this.mIsTouchStarted = false;
    }

    OnSlide() {
        this.striker.OnSlide(this.controlSlider.progress);
    }
}
