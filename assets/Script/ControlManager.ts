import Striker from "./Striker";
import Helper from "./Helper";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ControlManager extends cc.Component {

    @property(cc.Slider)
    controlSlider: cc.Slider = null;

    @property(Striker)
    striker : Striker = null;
    
    onLoad () {
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = "ControlManager";
        eventHandler.handler = "OnSlide";

        this.controlSlider.slideEvents.push(eventHandler);

        //this.striker.node.on(cc.Node.EventType.TOUCH_START, this.OnStrickerDrag, this);
        this.striker.node.on(cc.Node.EventType.TOUCH_MOVE, this.OnStrickerDrag, this);
    }//onLoad

    OnStrickerDrag(){
        var touchEvent = cc.Event.EventTouch[0];
        console.log("stricker dragging " + touchEvent );
    }

    OnSlide(){
        console.log("i am sliding " + this.controlSlider.progress);
        this.striker.OnSlide(this.controlSlider.progress);
    }

    // update (dt) {}
}
