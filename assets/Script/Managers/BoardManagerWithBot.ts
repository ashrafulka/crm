import BoardManager from "./BoardManager";
import { BotModel } from "./BotLoader";
import PawnComponent, { PawnType } from "../Pawn";
import Striker from "../Striker";
import BotGizmo from "../Helpers/BotGizmo";
import Helper from "../Helpers/Helper";

class BotPawnComponent {

    localPawn: PawnComponent = null;
    pocketPositions: Array<cc.Vec2> = [];
    hitPoints: Array<cc.Vec2> = [];
    hitPointDistanceFromCenter: number = 0;
    worldPos: cc.Vec2 = null;
    gizmo: BotGizmo = null;

    strikerWorldPosition: cc.Vec2 = null;
    strikerBoundaryLocal: cc.Vec2 = null;
    striker: Striker = null;

    hitPointStrikerPositions: Array<cc.Vec2> = [];

    constructor(pawn: PawnComponent, striker: Striker, potPos: Array<cc.Node>, gizmo: BotGizmo) {
        this.localPawn = pawn;
        for (let index = 0; index < potPos.length; index++) {
            const element = potPos[index].parent.convertToWorldSpaceAR(potPos[index].position);
            this.pocketPositions.push(element);
        }
        this.hitPointDistanceFromCenter = this.localPawn.mPhysicsCollider.radius + striker.mPhysicsComponent.radius;
        this.gizmo = gizmo;
        this.striker = striker;
        this.strikerWorldPosition = striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(0, striker.mStrikerDistanceFromMid));
        this.strikerBoundaryLocal = new cc.Vec2(striker.rightBoundary.position.x, Math.abs(striker.rightBoundary.position.y));

        //this.RecalculateOptimalPositions();
    }

    RecalculateOptimalPositions() {
        this.hitPoints.length = 0;
        this.gizmo.gg.clear();
        this.worldPos = this.localPawn.node.parent.convertToWorldSpaceAR(this.localPawn.node.position);
        const compareVec = new cc.Vec2(1, 0);
        for (let index = 0; index < this.pocketPositions.length; index++) {
            const pocket = this.pocketPositions[index];
            const vec = this.worldPos.sub(pocket);
            const angleInRads = compareVec.signAngle(vec);
            let angle2 = Helper.ConvertRadianToDegree(angleInRads);
            angle2 = angle2 < 0 ? 360 + angle2 : angle2;

            const hitPointX = this.worldPos.x + this.hitPointDistanceFromCenter * Math.cos(angleInRads);
            const hitPointY = this.worldPos.y + this.hitPointDistanceFromCenter * Math.sin(angleInRads);
            const strikerHitPos1 = new cc.Vec2(hitPointX, this.strikerWorldPosition.y);
            let strikerHitPos2 = cc.Vec2.ZERO;

            switch (index) {
                case 0: //left top
                    strikerHitPos2 = this.striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(this.strikerBoundaryLocal.x, this.strikerBoundaryLocal.y));
                    break;
                case 1: //left bot
                    strikerHitPos2 = this.striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(this.strikerBoundaryLocal.x, this.strikerBoundaryLocal.y));
                    break;
                case 2: // right top
                    strikerHitPos2 = this.striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(-this.strikerBoundaryLocal.x, this.strikerBoundaryLocal.y));
                    break;
                case 3: // right bot
                    strikerHitPos2 = this.striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(-this.strikerBoundaryLocal.x, this.strikerBoundaryLocal.y));
                    break;
            }



            if (index == 0) {
                let finalStrikerPos = this.striker.FindValidStrikerPosBetweenTwoPoints(strikerHitPos1, strikerHitPos2, new cc.Vec2(hitPointX, this.strikerWorldPosition.y));
                this.hitPointStrikerPositions.push(finalStrikerPos);
                console.log("final striker position :: ", finalStrikerPos, this.striker.strikerNode.convertToNodeSpaceAR(finalStrikerPos));
                //this.striker.strikerNode.setPosition(this.striker.strikerNode.convertToNodeSpaceAR(finalStrikerPos));
                this.gizmo.DrawCircle(finalStrikerPos, 10, false, cc.Color.BLACK);
                this.gizmo.DrawCircle(strikerHitPos1, 5, false);
                this.gizmo.DrawCircle(strikerHitPos2, 5, false);
                this.gizmo.DrawCircle(new cc.Vec2(hitPointX, hitPointY), 2, false);
                this.gizmo.DrawCircle(pocket, 10, false);
            }
        }
        //this.gizmo.DrawCircle(this.worldPos, 2, false);
    }
}//BotPawnComponent

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardManagerWithBot extends cc.Component {

    mBoardManager: BoardManager = null;
    botProfile: BotModel = null;
    startPawnTracking: boolean = false;

    strikerXSpanHalf: number = 0;
    striker: Striker = null;
    botPawnType: PawnType;

    allBotPawns: Array<BotPawnComponent> = [];
    gizmo: BotGizmo = null;

    RegisterBoardManager(bm: BoardManager, bot: BotModel) {
        this.mBoardManager = bm;
        this.botProfile = bot;
        this.striker = this.mBoardManager.striker;
        this.strikerXSpanHalf = Math.abs(this.striker.rightBoundary.position.x - this.striker.midPos.x);
        this.botPawnType = this.mBoardManager.mPlayerPool[1].GetCurrentPawnType();

        this.gizmo = cc.find("GizmosBot").getComponent(BotGizmo);
    }

    InitBoard() {
        //console.log("INIT BOARD MAN WITH BOT");
        let self = this;
        this.scheduleOnce(function () {
            self.allBotPawns.length = 0;
            for (let index = 0; index < self.mBoardManager.mAllPawnPool.length; index++) {
                const element = self.mBoardManager.mAllPawnPool[index];
                if (element.pawnType == PawnType.RED || element.pawnType == this.botPawnType) {
                    // self.allBotPawns.push(new BotPawnComponent(element,
                    //     self.mBoardManager.striker, self.mBoardManager.pockets, self.gizmo));
                }

                self.allBotPawns.push(new BotPawnComponent(element,
                    self.mBoardManager.striker, self.mBoardManager.pockets, self.gizmo));

                if (index == 0) {
                    break;
                }
            }
        }, 1);
    }

    GameOver() {

    }//gameover

    TakeShot() {
        console.log(":::TAKING SHOT BOT at :::", this.mBoardManager.mPlayerPool[1].GetCurrentPawnTypeString());

        let time = 2;
        let self = this;
        this.scheduleOnce(function () {
            self.ExecuteShot();
        }, time);

        this.scheduleOnce(function () {
            self.startPawnTracking = true;
        }, time + 10);
    }//takeshot


    private ExecuteShot() { //level 1, choose random position
        for (let index = 0; index < this.allBotPawns.length; index++) {
            const element = this.allBotPawns[index];
            console.log("Recalculating");
            element.RecalculateOptimalPositions();
        }

        let sPosX = Math.random() * this.strikerXSpanHalf;
        //choose random pawn
        let randomPawnPool = [];
        for (let index = 0; index < this.mBoardManager.mAllPawnPool.length; index++) {
            const element = this.mBoardManager.mAllPawnPool[index];
            //console.log("elemnt : ", element.node.position);
            if (element.mIsPotted == false && this.botPawnType == element.pawnType) {
                randomPawnPool.push(element);
            }
        }

        //choose random position x
        let randomPawnIndex = Math.floor(Math.random() * (randomPawnPool.length));
        let pawnSelected: PawnComponent = randomPawnPool[randomPawnIndex];
        console.log("random pawn index:: ", pawnSelected.GetId());

        let pawnPosWorld = pawnSelected.node.parent.convertToWorldSpaceAR(pawnSelected.node.position);//.sub(new cc.Vec2(this.striker.strikerNode.position.x, this.striker.strikerNode.position.y));
        let strikerPosWorld = this.striker.node.convertToWorldSpaceAR(this.striker.strikerNode.position);

        let direction = pawnPosWorld.sub(strikerPosWorld);

        console.log("direction ", direction);
        //make a shot into that direction with random force
        //this.striker.ApplyForce(direction, 500);
        //this.startPawnTracking = true;
    }

    RedCover() {

    }//redcover

    OnNextTurnCallback(next_turn_id: string) {
        if (this.mBoardManager.mIsGameOver) {
            return;
        }

        console.log("On next turn :: ");
        this.mBoardManager.mCurrentTurnIndex = (next_turn_id == this.mBoardManager.myID) ? 0 : 1;
        this.mBoardManager.mIsMyShot = (next_turn_id == this.mBoardManager.myID); //take off control from player

        this.mBoardManager.StartShotTimer();
        this.mBoardManager.striker.ResetStriker();
        this.mBoardManager.ApplyTurn();
    }

    frameStep: number = 0;
    totalSec: number = 0;
    update(dt) {
        if (this.startPawnTracking) {
            this.frameStep += dt;
            this.totalSec += dt;

            if (this.frameStep > 0.5) { //500 ms update rate
                this.frameStep = 0;
                if (this.mBoardManager.GetAllSpeed() <= 0 || this.totalSec >= 7) {
                    this.totalSec = 0;
                    this.startPawnTracking = false;
                    this.mBoardManager.EvaluateBoardAfterShot();
                }
            }
        }
    }
}
