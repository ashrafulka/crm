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
        //TODO simplyfy, take it to top
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

    FindValidStrikerPosBetweenTwoPoints(p1: cc.Vec2, p2: cc.Vec2, target: cc.Vec2): cc.Vec2 {
        //TODO check if we need to check world position
        let leftBorder = cc.Vec2.ZERO;
        let rightBorder = cc.Vec2.ZERO;

        if (p1.x < p2.x) {
            leftBorder = p1;
            rightBorder = p2;
        } else {
            leftBorder = p2;
            rightBorder = p1;
        }

        //console.log("left border :: ", leftBorder, "right border :: ", rightBorder);

        let midX = (leftBorder.x + rightBorder.x) / 2;
        let cursor: cc.Vec2 = new cc.Vec2(midX, leftBorder.y);
        let span = 5;
        let counter = 0;

        while (true) {
            counter++;
            if (counter % 2 == 0) {//right
                cursor.x = midX + (counter / 2) * span;
                cursor.x = cursor.x >= rightBorder.x ? rightBorder.x : cursor.x;
            } else { //left
                cursor.x = midX - (((counter + 1 / 2)) * span);
                cursor.x = cursor.x <= leftBorder.x ? leftBorder.x : cursor.x;
            }

            this.strikerNode.setPosition(this.strikerNode.parent.convertToNodeSpaceAR(cursor));
            if (this.IsStrikerPosValid()) {//TODO, check for obstacles via raycast
                break;
            }

            if (counter > 50) { //safety check
                return null;
            }
        }
        return cursor;
    }

    IsStrikerPosValid(): boolean {
        //console.log("current total threats :: ", this.closePawnIndexList.length);
        let worldPosStriker = this.node.convertToWorldSpaceAR(this.strikerNode.position);
        const dangerDistance = this.mPhysicsComponent.radius + this.mBoardManager.mAllPawnPool[0].mPhysicsCollider.radius;

        for (let index = 0; index < this.closePawnIndexList.length; index++) {
            const element = this.mBoardManager.mAllPawnPool[this.closePawnIndexList[index]];
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

    UpdateStrikerPos(isMyShot) {
        const startPosY = isMyShot ? -this.mStrikerDistanceFromMid : this.mStrikerDistanceFromMid;
        this.strikerNode.setPosition(0, startPosY);

        let startPosX = this.mPhysicsComponent.radius;
        let counter = 0;
        //TODO reduce span = radius,
        while (!this.IsStrikerPosValid()) {
            counter++;
            if (counter % 2 == 0) { //check right
                startPosX = (counter / 2) * this.mPhysicsComponent.radius;
            } else { //check left
                startPosX = -((counter + 1) / 2) * this.mPhysicsComponent.radius;
            }
            this.strikerNode.setPosition(startPosX, startPosY);

            if (counter > 100) { //safety check
                this.IsStrikerPosValid(); //to show the indicators
                break;
            }
        }
    }
}
