import Striker from "./Striker";

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
    }//onLoad

    OnSlide(){
        console.log("i am sliding " + this.controlSlider.progress);
        this.striker.OnSlide(this.controlSlider.progress);
    }

    // update (dt) {}
}
