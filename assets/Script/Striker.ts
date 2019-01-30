
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

    mStrikerRigidBody:cc.RigidBody = null;

    private mFullSpanX:number = 0;

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getCollisionManager().enabled = true;

        this.mStrikerRigidBody = this.strickerBody.getComponent(cc.RigidBody);
    }

    start () {
        this.mFullSpanX = Math.abs(this.midPos.position.x - this.rightBoundary.position.x) * 2;
    }

    ApplyForce(forceVector:cc.Vec2, forceAmount:number){
        this.strickerBody.getComponent(cc.RigidBody).applyForceToCenter( new cc.Vec2(forceVector.x * forceAmount, forceVector.y * forceAmount),true);
    }

    ResetStriker(){
        this.strickerBody.position = this.midPos.position;
        //this.strickerBody.getComponent(cc.RigidBody).applyLinearImpulse(new cc.Vec2(0,3000), cc.Vec2.ZERO, true);
        this.mStrikerRigidBody.angularVelocity = 0;
        this.mStrikerRigidBody.linearVelocity = cc.Vec2.ZERO;
    }

    onDisable(){
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.OnKeyDown, this);
    }

    OnSlide(progress:number){
        this.strickerBody.x = this.mFullSpanX * progress - Math.abs(this.rightBoundary.x);
    }
}
