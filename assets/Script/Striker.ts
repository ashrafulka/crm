
const {ccclass, property} = cc._decorator;

@ccclass
export default class Striker extends cc.Component {

    @property(cc.Node)
    leftBoundary:cc.Node = null;

    @property(cc.Node)
    rightBoundary:cc.Node = null;

    @property(cc.Node)
    midPos:cc.Node = null;

    @property(cc.Node)
    strickerBody: cc.Node = null;

    private mFullSpanX:number = 0;


    onLoad(){
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getCollisionManager().enabled = true;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    start () {
        this.mFullSpanX = Math.abs(this.midPos.position.x - this.rightBoundary.position.x) * 2;
    }

    onKeyDown(event){
        switch(event.keyCode){
            case cc.KEY.space:
                this.strickerBody.setPositionX(this.midPos.position.x);
                this.strickerBody.getComponent(cc.RigidBody).applyLinearImpulse(new cc.Vec2(0,3000), cc.Vec2.ZERO, true);
                break;
            default:
                //console.log("DEFAULT KEY: " + event.keyCode);
                break;
        }
    }

    onDisable(){
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    OnSlide(progress:number){
        console.log("getting position x " + this.strickerBody.getPositionX());
        this.strickerBody.setPositionX(this.mFullSpanX * progress - Math.abs(this.rightBoundary.getPositionX()));
    }
}
