import PawnComponent from "./Pawn";
import BoardManager from "./Managers/BoardManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Pocket extends cc.Component {

    @property(BoardManager)
    mBoardManager: BoardManager = null;

    onCollisionEnter(other, self) {
        let pawn: PawnComponent = other.node.getComponent(PawnComponent);
        if (pawn) {

            let pawnNode: cc.Node = other.node;
            let rigidbody = pawnNode.getComponent(cc.RigidBody);
            let circleCollider = pawnNode.getComponent(cc.PhysicsCircleCollider);
            rigidbody.linearVelocity = cc.Vec2.ZERO;
            rigidbody.angularVelocity = 0;
            rigidbody.active = false;
            circleCollider.enabled = false;

            let moveTo = cc.moveTo(0.5, pawnNode.parent.convertToNodeSpaceAR(this.node.parent.convertToWorldSpaceAR(this.node.position)));
            let fadeTo = cc.fadeOut(0.3);
            pawnNode.runAction(cc.sequence(moveTo, fadeTo));
            pawn.DeactiveAfter(0.8);

            this.mBoardManager.RegisterPot(pawn);

            //pawnNode.position = pawnNode.parent.convertToNodeSpaceAR(this.node.parent.convertToWorldSpaceAR(this.node.position));
            //pawnNode.position = this.node.position;//no need to convert positions, because both pocket and pawn's parent is at 0,0;

        }
    }
}
