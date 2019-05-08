import Striker from "./../Striker";
import Helper from "./../Helpers/Helper";
import GizmoGraphic from "./../Helpers/GizmoGraphic";
import { Player } from "../Player";
import BoardManager from "./BoardManager";
import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Logger } from "../LoadingScene/Logger";
import { AllGameModes } from "../LoadingScene/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ControlManager extends cc.Component {

    @property(cc.Slider) controlSlider: cc.Slider = null;
    @property(Striker) striker: Striker = null;
    @property(GizmoGraphic) gizmosComp: GizmoGraphic = null;

    @property minDistanceRequired: number = 0;
    @property maxDistanceAllowed: number = 0;
    @property fixForceAmount: number = 0;

    mStrikerStartPos: cc.Vec2 = cc.Vec2.ZERO;
    mIsTouchStarted: boolean = false;
    mStrikerCenter: cc.Vec2 = cc.Vec2.ZERO;

    mCurrentTurnIndex: number = -1;
    mPlayerPool: Player[] = null;

    mBoardManager: BoardManager = null;
    mPersistentNode: PersistentNodeComponent = null;
    mLogger: Logger = null;

    onLoad() {
        cc.director.getPhysicsManager().enabled = true;
        cc.director.getCollisionManager().enabled = true;

        this.controlSlider.slideEvents.push(Helper.getEventHandler(this.node, "ControlManager", "OnSlide"));
        this.striker.strikerNode.on(cc.Node.EventType.TOUCH_START, this.OnStrickerTouchStart.bind(this));
        this.striker.strikerNode.on(cc.Node.EventType.TOUCH_MOVE, this.OnStrickerDrag.bind(this));
        this.striker.strikerNode.on(cc.Node.EventType.TOUCH_END, this.OnStrikerDragEnd.bind(this));
        this.striker.strikerNode.on(cc.Node.EventType.TOUCH_CANCEL, this.OnStrikerDragEnd.bind(this));
    }//onLoad

    start() {
        this.mBoardManager = this.getComponent(BoardManager);
        this.mPersistentNode = this.mBoardManager.mPersistentNode;
    }

    // OnNextTurnBtnClick() {
    //     if (this.mBoardManager.mIsDebugMode) {
    //         this.mBoardManager.OnNextTurnCallback("");
    //         return;
    //     }

    //     let chosenId = "";
    //     if (this.mBoardManager.mIsValidPotPending) {
    //         chosenId = this.mPersistentNode.GetPlayerModel().getID();
    //     } else { //toggle player update
    //         chosenId = this.mBoardManager.GetOpponentId();
    //     }
    //     this.mPersistentNode.GetSocketConnection().sendNextTurnUpdate(chosenId);
    //     this.mBoardManager.OnNextTurnCallback(chosenId);
    // }//onnextturnbtnclick

    OnStrickerTouchStart(event: cc.Event.EventTouch) {
        if (this.mBoardManager.mIsMyShot == false) {
            return;
        }

        if (this.striker.IsOverlappingWithPawn() == false) {
            console.log("striker position not valid");
            return;
        }

        this.mStrikerStartPos = event.getTouches()[0].getLocation();
        this.mStrikerCenter = this.striker.strikerNode.parent.convertToWorldSpaceAR(this.striker.strikerNode.getPosition());
        this.controlSlider.enabled = false;
    }

    OnStrickerDrag(event: cc.Event.EventTouch) {
        if (this.mBoardManager.mIsMyShot == false) {
            return;
        }

        if (this.striker.IsOverlappingWithPawn() == false) {
            return;
        }

        let touch = event.getTouches()[0];
        let clear = true;
        let touchDistance = Helper.getDistance(this.mStrikerCenter, touch.getLocation());
        let touchRadius = touchDistance > this.maxDistanceAllowed ? this.maxDistanceAllowed : touchDistance;
        if (touchDistance > this.minDistanceRequired) {
            this.mIsTouchStarted = true;
            this.gizmosComp.DrawControlCircle(this.mStrikerCenter, touchRadius, clear);
        } else {
            this.mIsTouchStarted = false;
            this.gizmosComp.myGraphicsNode.clear();
            return;
        }

        let touchPointOnCircle = Helper.getTouchPointOnCirlce(this.mStrikerCenter, touchRadius, touch.getLocation());
        clear = !this.mIsTouchStarted;
        this.gizmosComp.DrawControlCircle(touchPointOnCircle, 10, clear);
        this.gizmosComp.DrawControlLine(this.mStrikerCenter, touch.getLocation(), clear);
    }

    OnStrikerDragEnd(event: cc.Event.EventTouch) {
        this.controlSlider.enabled = true;
        if (this.mIsTouchStarted == false) return;

        let touch = event.getTouches()[0];
        let radius = Helper.getDistance(this.mStrikerCenter, touch.getLocation());
        radius = radius > this.maxDistanceAllowed ? this.maxDistanceAllowed : radius;
        let forceVector = this.mStrikerCenter.sub(Helper.getTouchPointOnCirlce(this.mStrikerCenter, radius, touch.getLocation()));
        let magnitude = forceVector.mag();

        this.striker.ApplyForce(forceVector.mul(-2), magnitude * this.fixForceAmount);
        this.mBoardManager.OnStrikerHit(forceVector.mul(-2), magnitude * this.fixForceAmount);

        this.gizmosComp.myGraphicsNode.clear();
        this.mIsTouchStarted = false;
        this.HideSlider();
    }

    OnSlide() {
        this.striker.OnSlide(this.controlSlider.progress);
        if (this.mBoardManager.currentGameMode == AllGameModes.FRIEND_1v1) {
            this.mBoardManager.mBMWithFriend.SendPawnInfo(0, true);
        }
        this.striker.IsOverlappingWithPawn();
    }

    ShowSlider() {
        this.controlSlider.node.active = true;
        this.controlSlider.progress = 0.5;
        this.controlSlider.enabled = true;
    }

    HideSlider() {
        this.controlSlider.node.active = false;
    }

    onDestroy() {
        this.striker.strikerNode.off(cc.Node.EventType.TOUCH_START, this.OnStrickerTouchStart.bind(this));
        this.striker.strikerNode.off(cc.Node.EventType.TOUCH_MOVE, this.OnStrickerDrag.bind(this));
        this.striker.strikerNode.off(cc.Node.EventType.TOUCH_END, this.OnStrikerDragEnd.bind(this));
        this.striker.strikerNode.off(cc.Node.EventType.TOUCH_CANCEL, this.OnStrikerDragEnd.bind(this));
    }
}
