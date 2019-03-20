
const { ccclass, property } = cc._decorator;

@ccclass
export default class Striker extends cc.Component {

    @property(cc.Node)
    rightBoundary: cc.Node = null;

    @property(cc.Node)
    midPos: cc.Node = null;

    @property(cc.Node)
    strikerNode: cc.Node = null;

    mStrikerRigidBody: cc.RigidBody = null;
    mPhysicsComponent: cc.PhysicsCircleCollider = null;

    private mFullSpanX: number = 0;

    onLoad() {
        this.mStrikerRigidBody = this.strikerNode.getComponent(cc.RigidBody);
        this.mPhysicsComponent = this.strikerNode.getComponent(cc.PhysicsCircleCollider);
        //console.log("physics component :: " + this.mPhysicsComponent.density);
    }

    start() {
        this.mFullSpanX = Math.abs(this.midPos.position.x - this.rightBoundary.position.x) * 2;
    }

    ApplyForce(forceVector: cc.Vec2, forceAmount: number) {
        this.strikerNode.getComponent(cc.RigidBody).applyForceToCenter(new cc.Vec2(forceVector.x * forceAmount, forceVector.y * forceAmount), true);
    }

    ResetStriker() {
        this.strikerNode.position = this.midPos.position;
        //this.strickerBody.getComponent(cc.RigidBody).applyLinearImpulse(new cc.Vec2(0,3000), cc.Vec2.ZERO, true);
        this.mStrikerRigidBody.angularVelocity = 0;
        this.mStrikerRigidBody.linearVelocity = cc.Vec2.ZERO;
    }

    OnSlide(progress: number) {
        this.strikerNode.x = this.mFullSpanX * progress - Math.abs(this.rightBoundary.x);
    }
}
