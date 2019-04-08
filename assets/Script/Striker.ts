import BoardManager from "./Managers/BoardManager";
import PawnComponent from "./Pawn";
import Helper from "./Helpers/Helper";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Striker extends cc.Component {

    @property(cc.Node)
    rightBoundary: cc.Node = null;

    @property(cc.Node)
    midPos: cc.Node = null;

    @property(cc.Node)
    strikerNode: cc.Node = null;

    @property(cc.Node)
    errorPositioningNode: cc.Node = null;

    mStrikerRigidBody: cc.RigidBody = null;
    mPhysicsComponent: cc.PhysicsCircleCollider = null;

    mStrikerDistanceFromMid: number = 0;

    mBoardManager: BoardManager = null;

    private mFullSpanX: number = 0;

    onLoad() {
        this.mStrikerRigidBody = this.strikerNode.getComponent(cc.RigidBody);
        this.mPhysicsComponent = this.strikerNode.getComponent(cc.PhysicsCircleCollider);
    }

    start() {
        //console.log("striker onstart");
        this.mPhysicsComponent.enabled = false;
        this.mStrikerRigidBody.active = false;

        this.mFullSpanX = Math.abs(this.midPos.position.x - this.rightBoundary.position.x) * 2;
    }

    RegisterBoardManager(bm: BoardManager) {
        this.mBoardManager = bm;
        this.mStrikerDistanceFromMid = this.mBoardManager.mStrikerDistanceFromMid;
    }

    ApplyForce(forceVector: cc.Vec2, forceAmount: number) {
        this.mStrikerRigidBody.active = true;
        this.mPhysicsComponent.enabled = true;

        this.mStrikerRigidBody.applyForceToCenter(new cc.Vec2(forceVector.x * forceAmount, forceVector.y * forceAmount), true);
    }

    ActivatePhysics() {
        this.mStrikerRigidBody.active = true;
        this.mPhysicsComponent.enabled = true;
        this.mStrikerRigidBody.allowSleep = false;
    }

    DisablePhysics() {
        this.mPhysicsComponent.enabled = false;
        this.mStrikerRigidBody.active = false;
    }

    ResetStriker() {
        this.strikerNode.position = this.midPos.position;
        this.mStrikerRigidBody.angularVelocity = 0;
        this.mStrikerRigidBody.linearVelocity = cc.Vec2.ZERO;

        this.mPhysicsComponent.enabled = false;
        this.mStrikerRigidBody.active = false;
    }

    OnSlide(progress: number) {
        this.strikerNode.x = this.mFullSpanX * progress - Math.abs(this.rightBoundary.x);
    }

    ShowPositionError() {
        this.errorPositioningNode.active = true;
    }

    HidePositionError() {
        this.errorPositioningNode.active = false;
    }

    closePawnIndexList: Array<number> = [];
    GetClosePawnList(isMyShot: boolean, allPawnPool: Array<PawnComponent>) {
        this.closePawnIndexList.length = 0;

        const startPosY = isMyShot ? -this.mStrikerDistanceFromMid : this.mStrikerDistanceFromMid;
        const dangerDistance = this.mPhysicsComponent.radius + allPawnPool[0].mPhysicsCollider.radius;

        const dangerThresholdMinY = startPosY - dangerDistance;
        const dangerThresholdMaxY = startPosY + dangerDistance;

        const worldPosMin = this.mBoardManager.node.convertToWorldSpaceAR(new cc.Vec2(0, dangerThresholdMinY));
        const worldPosMax = this.mBoardManager.node.convertToWorldSpaceAR(new cc.Vec2(0, dangerThresholdMaxY));

        //search for potential pawns that can conflict with striker position
        for (let index = 0; index < allPawnPool.length; index++) {
            const element = allPawnPool[index];
            const worldPos = element.node.parent.convertToWorldSpaceAR(element.node.position);
            if (worldPos.y >= worldPosMin.y && worldPos.y <= worldPosMax.y) {
                //console.log("adding threats::");
                this.closePawnIndexList.push(index);
            }
        }
    }

    IsStrikerPosValid(allPawnPool: Array<PawnComponent>): boolean {
        //console.log("current total threats :: ", this.closePawnIndexList.length);
        let worldPosStriker = this.mBoardManager.node.convertToWorldSpaceAR(this.strikerNode.position);
        const dangerDistance = this.mPhysicsComponent.radius + allPawnPool[0].mPhysicsCollider.radius;

        for (let index = 0; index < this.closePawnIndexList.length; index++) {
            const element = allPawnPool[this.closePawnIndexList[index]];
            let worldPosPawn = element.node.parent.convertToWorldSpaceAR(element.node.position);
            const dist = Helper.getDistance(worldPosPawn, worldPosStriker);
            if (dist <= dangerDistance) {
                this.ShowPositionError();
                return false;
            }
        }
        this.HidePositionError();
        return true;
    }

    UpdateStrikerPos(isMyShot, allPawnPool: Array<PawnComponent>) {
        const startPosY = isMyShot ? -this.mStrikerDistanceFromMid : this.mStrikerDistanceFromMid;
        this.strikerNode.setPosition(0, startPosY);

        let startPosX = this.mPhysicsComponent.radius;
        let counter = 0;
        while (!this.IsStrikerPosValid(allPawnPool)) { //TODO check both ways
            counter++;
            if (counter % 2 == 0) { //check right
                startPosX = (counter / 2) * this.mPhysicsComponent.radius;
            } else { //check right
                startPosX = -((counter + 1) / 2) * this.mPhysicsComponent.radius;
            }
            this.strikerNode.setPosition(startPosX, startPosY);
        }
    }
}
