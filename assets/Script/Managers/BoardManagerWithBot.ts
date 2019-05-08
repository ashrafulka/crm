import BoardManager from "./BoardManager";
import { BotModel } from "./BotLoader";
import PawnComponent, { PawnType } from "../Pawn";
import Striker from "../Striker";
import BotGizmo from "../Helpers/BotGizmo";
import Helper from "../Helpers/Helper";

export class StrikerHitPointCombo {
    strikerWorldPos: cc.Vec2;
    hitPointWorldPos: cc.Vec2;
    pocketPos: cc.Vec2;
    angle: number;

    constructor(sws: cc.Vec2, hpwp: cc.Vec2, pocket: cc.Vec2, angle: number) {
        this.strikerWorldPos = sws;
        this.hitPointWorldPos = hpwp;
        this.pocketPos = pocket;
        this.angle = angle;
    }
}

class BotPawn {

    localPawn: PawnComponent = null;
    pocketPositions: Array<cc.Vec2> = [];
    hitPointDistanceFromCenter: number = 0;
    worldPos: cc.Vec2 = null;
    gizmo: BotGizmo = null;

    strikerWorldPosition: cc.Vec2 = null;
    strikerBoundaryLocal: cc.Vec2 = null;
    striker: Striker = null;

    hitPointStrikerPositions: Array<StrikerHitPointCombo> = [];

    constructor(pawn: PawnComponent, striker: Striker, potPos: Array<cc.Node>, gizmo: BotGizmo) {
        this.localPawn = pawn;
        for (let index = 0; index < potPos.length; index++) {
            const element = potPos[index].parent.convertToWorldSpaceAR(potPos[index].position);
            this.pocketPositions.push(element);
        }
        this.hitPointDistanceFromCenter = this.localPawn.mPhysicsCollider.radius + (striker.mPhysicsComponent.radius);
        this.gizmo = gizmo;
        this.striker = striker;
        this.strikerWorldPosition = striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(0, striker.mStrikerDistanceFromMid));
        this.strikerBoundaryLocal = new cc.Vec2(striker.rightBoundary.position.x, Math.abs(striker.rightBoundary.position.y));

        //this.RecalculateOptimalPositions();
    }

    RecalculateOptimalPositions() {
        this.hitPointStrikerPositions.length = 0;
        this.gizmo.gg.clear();
        this.worldPos = this.localPawn.node.parent.convertToWorldSpaceAR(this.localPawn.node.position);
        const compareVec = new cc.Vec2(1, 0);
        for (let index = 0; index < this.pocketPositions.length; index++) {
            const pocket = this.pocketPositions[index];
            const vec = this.worldPos.sub(pocket);
            const angleInRads = compareVec.signAngle(vec);
            let angle2 = Helper.ConvertRadianToDegree(angleInRads);
            angle2 = angle2 < 0 ? 360 + angle2 : angle2;

            const randomizeFactor = Math.random() * (1 - 0.8) + 0.8;
            const hitPointX = this.worldPos.x + (this.hitPointDistanceFromCenter * randomizeFactor) * Math.cos(angleInRads);
            const hitPointY = this.worldPos.y + (this.hitPointDistanceFromCenter * randomizeFactor) * Math.sin(angleInRads);

            let hitPoint = new cc.Vec2(hitPointX, hitPointY);

            const strikerHitPos1 = new cc.Vec2(hitPointX, this.strikerWorldPosition.y);
            let strikerHitPos2 = cc.Vec2.ZERO;

            let color: cc.Color = null;
            let potName: string = "";

            switch (index) {
                case 0: //left top
                    color = cc.Color.BLACK;
                    potName = "left top";
                    strikerHitPos2 = this.striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(this.strikerBoundaryLocal.x, this.strikerBoundaryLocal.y));
                    break;
                case 1: //left bot
                    color = cc.Color.WHITE;
                    potName = "left bot";
                    strikerHitPos2 = this.striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(this.strikerBoundaryLocal.x, this.strikerBoundaryLocal.y));
                    break;
                case 2: // right top
                    color = cc.Color.YELLOW;
                    potName = "right top";
                    strikerHitPos2 = this.striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(-this.strikerBoundaryLocal.x, this.strikerBoundaryLocal.y));
                    break;
                case 3: // right bot
                    color = cc.Color.GREEN;
                    potName = "right bot";
                    strikerHitPos2 = this.striker.node.parent.convertToWorldSpaceAR(new cc.Vec2(-this.strikerBoundaryLocal.x, this.strikerBoundaryLocal.y));
                    break;
            }

            let finalStrikerPos = this.striker.FindValidStrikerPosBetweenTwoPoints(strikerHitPos1, strikerHitPos2, new cc.Vec2(hitPointX, this.strikerWorldPosition.y));
            if (finalStrikerPos == null) {
                continue;
            }

            let v1 = hitPoint.sub(finalStrikerPos);
            let v2 = hitPoint.sub(pocket);

            let angleWithPocket = Helper.getAngle(v1, v2, false);

            console.log("::", potName, " ::", angleWithPocket);

            if (angleWithPocket > 115) {
                this.hitPointStrikerPositions.push(new StrikerHitPointCombo(finalStrikerPos, hitPoint, pocket, angleWithPocket));
                this.gizmo.DrawCircle(hitPoint, 5, false, color);
                this.gizmo.DrawCircle(finalStrikerPos, 5, false, color);
            }
        }

        console.log("========", this.localPawn.GetId());
    }

    FindBestCombo(): StrikerHitPointCombo {
        this.RecalculateOptimalPositions();

        if (this.hitPointStrikerPositions.length == 0) {
            return null;
        }

        let bestIndex = 0;
        let bestAngle = 0;
        for (let index = 0; index < this.hitPointStrikerPositions.length; index++) {
            const element = this.hitPointStrikerPositions[index];
            if (element.angle > bestAngle) {
                bestAngle = element.angle;
                bestIndex = index;
            }
        }

        return this.hitPointStrikerPositions[bestIndex];
    }
}//BotPawnComponent

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardManagerWithBot extends cc.Component {

    static FORCE_AMOUNT: number = 850;
    mBoardManager: BoardManager = null;
    botProfile: BotModel = null;
    startPawnTracking: boolean = false;

    strikerXSpanHalf: number = 0;
    striker: Striker = null;
    botPawnType: PawnType;

    allBotPawns: Array<BotPawn> = [];
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
        this.RefreshBotPawns();
    }

    private RefreshBotPawns() {
        this.allBotPawns.length = 0;
        for (let index = 0; index < this.mBoardManager.mAllPawnPool.length; index++) {
            const element = this.mBoardManager.mAllPawnPool[index];
            if (element.mIsPotted == false && (element.pawnType == PawnType.RED || element.pawnType == this.botPawnType)) {
                this.allBotPawns.push(new BotPawn(element,
                    this.mBoardManager.striker, this.mBoardManager.pockets, this.gizmo));
            }
        }

        //level 1, choose random position
        // for (let index = 0; index < this.allBotPawns.length; index++) {
        //     const element = this.allBotPawns[index];
        //     element.RecalculateOptimalPositions();

        //     if (index == 0) {
        //         break;
        //     }
        // }
    }

    GameOver(winnerid: string) {
        this.mBoardManager.mUIManager.ShowMatchEndPopup(winnerid == this.mBoardManager.mPlayerPool[0].GetID());
    }//gameover

    TakeShot() {
        console.log(":::TAKING SHOT BOT at :::", this.mBoardManager.mPlayerPool[1].GetCurrentPawnTypeString());
        this.RefreshBotPawns();

        let time = 2;
        let self = this;
        this.scheduleOnce(function () {
            self.ExecuteShot();
        }, time);
    }//takeshot


    private ExecuteShot() {
        let bestComboPos: StrikerHitPointCombo = null;
        let traverseCount = 0;
        while (bestComboPos == null) {
            let randomPawnIndex = Math.floor(Math.random() * (this.allBotPawns.length));
            let pawnSelected: BotPawn = this.allBotPawns[randomPawnIndex];

            traverseCount++;
            if (traverseCount > 100) { //safety check
                console.warn("NO valid pawn found which can be potted:: ", this.allBotPawns.length);
                bestComboPos = new StrikerHitPointCombo(this.striker.node.convertToWorldSpaceAR(this.striker.strikerNode.getPosition()),
                    pawnSelected.localPawn.node.parent.convertToWorldSpaceAR(pawnSelected.localPawn.node.getPosition()), cc.Vec2.ZERO, 0);
                break;
            }
            bestComboPos = pawnSelected.FindBestCombo();
        }

        this.striker.strikerNode.setPosition(this.striker.node.convertToNodeSpaceAR(bestComboPos.strikerWorldPos));
        const direction = bestComboPos.hitPointWorldPos.sub(bestComboPos.strikerWorldPos).normalize();
        const strength = Helper.getDistance(bestComboPos.strikerWorldPos, bestComboPos.pocketPos);

        this.gizmo.DrawLine(bestComboPos.hitPointWorldPos, bestComboPos.strikerWorldPos);

        let self = this;
        this.scheduleOnce(function () {
            self.striker.ApplyForce(direction.mul(strength), BoardManagerWithBot.FORCE_AMOUNT);
            self.startPawnTracking = true;
        }, 1);
    }

    RedCover() {

    }//redcover

    OnNextTurnCallback(next_turn_id: string) {
        if (this.mBoardManager.mIsGameOver) {
            return;
        }
        // console.log("On next turn :: ");
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
