import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Constants, GameEvents } from "../LoadingScene/Constants";
import BoardManager from "./BoardManager";
import { PawnType } from "../Pawn";
import { Player } from "../Player";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardManagerWithFriend extends cc.Component {

    mPersistentNode: PersistentNodeComponent = null;
    mBoardManager: BoardManager = null;

    startPawnTracking: boolean = false;

    AttachListeners() {
        if (this.mPersistentNode == null) {
            return;
        }

        this.mPersistentNode.node.on(GameEvents.TAKE_SHOT, this.OnTakeShotCallback, this);
        this.mPersistentNode.node.on(GameEvents.UPDATE_TURN, this.OnNextTurnCallback, this);
        this.mPersistentNode.node.on(GameEvents.UPDATE_SCORE, this.OnUpdateScoreCallback, this);
        this.mPersistentNode.node.on(GameEvents.SYNC_PAWNS, this.OnSyncPawnsCallback, this);
        this.mPersistentNode.node.on(GameEvents.GAME_OVER, this.OnGameOverResponseCallback, this);
        this.mPersistentNode.node.on(GameEvents.GE_RED_POT_COVER, this.OnRedCoverEventCallback, this);
    }
    DetachListeners() {
        if (this.mPersistentNode == null) {
            return;
        }
        this.mPersistentNode.node.off(GameEvents.TAKE_SHOT, this.OnTakeShotCallback, this);
        this.mPersistentNode.node.off(GameEvents.UPDATE_TURN, this.OnNextTurnCallback, this);
        this.mPersistentNode.node.off(GameEvents.UPDATE_SCORE, this.OnUpdateScoreCallback, this);
        this.mPersistentNode.node.off(GameEvents.SYNC_PAWNS, this.OnSyncPawnsCallback, this);
        this.mPersistentNode.node.off(GameEvents.GAME_OVER, this.OnGameOverResponseCallback, this);
        this.mPersistentNode.node.off(GameEvents.GE_RED_POT_COVER, this.OnRedCoverEventCallback, this);
    }
    onDestroy() {
        this.DetachListeners();
    }

    frameStep: number = 0;
    totalSec: number = 0;
    update(dt) {
        if (this.startPawnTracking) {
            this.frameStep += dt;
            this.totalSec += dt;

            if (this.frameStep > 0.05) { //update rate with the server
                this.frameStep = 0;
                this.SendPawnInfo(0);

                if (this.mBoardManager.GetAllSpeed() <= 0 || this.totalSec >= 7) {
                    this.SendPawnInfo(1);
                    this.totalSec = 0;
                    this.startPawnTracking = false;
                    this.mBoardManager.EvaluateBoardAfterShot();
                }
            }
        }
    }

    RegisterBoardManager(bm: BoardManager) {
        this.mBoardManager = bm;
        this.mPersistentNode = this.mBoardManager.mPersistentNode;
        this.AttachListeners();
    }



    GameOver(winnerID: string) {
        let redCoveredID = "";
        for (let index = 0; index < this.mBoardManager.mPlayerPool.length; index++) {
            const element = this.mBoardManager.mPlayerPool[index];
            if (element.IsRedCovered()) {
                redCoveredID = element.GetID();
                break;
            }
        }
        this.mPersistentNode.GetSocketConnection().sendGameOverReq({
            winner_id: winnerID,
            red_covered_id: redCoveredID
        });
    }

    //#region  Callbacks
    OnTakeShotCallback(body: any) {
        this.mBoardManager.mUIManager.StopTimer();
    }

    OnUpdateScoreCallback(body: any) {
        this.mBoardManager.mPlayerPool[0].SetScore(body.p1_score);
        this.mBoardManager.mPlayerPool[1].SetScore(body.p2_score);
        this.mBoardManager.mUIManager.UpdateScore();
    }

    OnNextTurnCallback(next_turn_id: string) {
        if (this.mBoardManager.mIsGameOver) {
            return;
        }

        if (this.mBoardManager.myID == this.mBoardManager.mPlayerPool[0].GetID()) {
            this.mBoardManager.mCurrentTurnIndex = (next_turn_id == this.mBoardManager.myID) ? 0 : 1;
        } else if (this.mBoardManager.myID == this.mBoardManager.mPlayerPool[1].GetID()) {
            this.mBoardManager.mCurrentTurnIndex = next_turn_id == this.mBoardManager.myID ? 1 : 0;
        }
        this.mBoardManager.mIsMyShot = (next_turn_id == this.mBoardManager.myID); //take off control from player

        if (this.mBoardManager.mIsMyShot) {
            this.mBoardManager.ReactivateAllBody();
        } else {
            this.mBoardManager.DeactivateAllBody();
        }

        this.mBoardManager.StartShotTimer();
        this.mBoardManager.striker.ResetStriker();
        this.mBoardManager.ApplyTurn();
    }

    OnRedCoverEventCallback(body) {
        this.mBoardManager.GetPlayerByID(body.shooter_id).RedCover();
        if (body.shooter_id == this.mBoardManager.myID) { //my shot
            this.mBoardManager.mUIManager.ShowToast(2, "Red Covered Successfully!");
        } else {
            this.mBoardManager.mUIManager.ShowToast(2, "Red is covered by opponent!");
        }
    }//onredpotevent

    OnGameOverResponseCallback(data: any) {
        //show game over ui
        if (data.winner_id == this.mBoardManager.myID) {
            this.mBoardManager.mUIManager.ShowMatchEndPopup(true);
        } else {
            this.mBoardManager.mUIManager.ShowMatchEndPopup(false);
        }
    }

    OnSyncPawnsCallback(body: any) {
        if (body.shooter_id == this.mBoardManager.myID) { //no need to update my pawns, physics is controlling them
            return;
        }

        let lastUpdate = body.last_update == 0 ? false : true;
        const updateRate = 0.06;

        if (lastUpdate) {
            this.mBoardManager.mAllPots.length = 0;
        }

        if (body.all_pawns) {
            for (let index = 0; index < body.all_pawns.length; index++) {
                let inNum = body.all_pawns[index].index_num;
                let x = body.all_pawns[index].position_x;
                let y = body.all_pawns[index].position_y;
                let isPot = body.all_pawns[index].is_potted;

                this.mBoardManager.mAllPawnPool[inNum].mIsPotted = isPot;
                this.mBoardManager.mAllPawnPool[inNum].node.active = !isPot;

                if (isPot && lastUpdate) {
                    this.mBoardManager.mAllPots.push(this.mBoardManager.mAllPawnPool[inNum]);
                }

                this.mBoardManager.mAllPawnPool[inNum].node.stopAllActions();
                if (lastUpdate == false) {
                    let action = cc.moveTo(updateRate, x, y);
                    this.mBoardManager.mAllPawnPool[inNum].node.runAction(action);
                } else {
                    this.mBoardManager.mAllPawnPool[inNum].node.setPosition(x, y);
                }
            }
        }

        if (lastUpdate) {
            this.mBoardManager.mLastShotPointerIndex = this.mBoardManager.mAllPots.length;
            this.mBoardManager.striker.strikerNode.setPosition(new cc.Vec2(-body.striker_pos_x, -body.striker_pos_y));
        } else {
            this.mBoardManager.striker.strikerNode.stopAllActions();
            let strikerMoveAction = cc.moveTo(updateRate, -body.striker_pos_x, -body.striker_pos_y);
            this.mBoardManager.striker.strikerNode.runAction(strikerMoveAction);
        }
    }
    //#endregion
    // ALL Requests that are sending via socket:: =>
    //#region  send_requests
    SendRedCoverRequest(coverId: string) {
        this.mPersistentNode.GetSocketConnection().sendRedPotCoverReq({ shooter_id: coverId });;
    }

    SendNewShotRequest(forceVec: cc.Vec2, magnitude: number) {
        this.mPersistentNode.GetSocketConnection().sendNewShotRequest(forceVec, magnitude);
    }

    SendTimeOutRequest() {
        if (this.mBoardManager.mIsMyShot) {
            this.mBoardManager.mUIManager.ShowToast(2, "TIME OUT!");
            this.mPersistentNode.GetSocketConnection().sendNextTurnUpdate(this.mBoardManager.GetOpponentId());
        } else {
            this.mPersistentNode.GetSocketConnection().sendNextTurnUpdate(this.mBoardManager.myID);
        }
    }

    SendNextTurnUpdate(chosenID: string) {
        this.mPersistentNode.GetSocketConnection().sendNextTurnUpdate(chosenID);
    }

    SendScoreUpdate() {
        this.mPersistentNode.GetSocketConnection().sendScoreUpdate(
            this.mBoardManager.mPlayerPool[0].GetScore(),
            this.mBoardManager.mPlayerPool[0].GetID(),
            this.mBoardManager.mPlayerPool[1].GetScore(),
            this.mBoardManager.mPlayerPool[1].GetID()
        );
        this.SendPawnInfo(1);
    }

    SendPawnInfo(isLastUpdate: number, onlyStrikerUpdate = false) {
        //TODO just send the necessary pawns
        let infoJSON: any = {};
        if (onlyStrikerUpdate == false) {
            infoJSON.all_pawns = [];
            let whitePotCount = 0;
            let blackPotCount = 0;

            for (let index = 0; index < this.mBoardManager.mAllPawnPool.length; index++) {
                const element = this.mBoardManager.mAllPawnPool[index];
                let isPot = element.mIsPotted ? 1 : 0;

                if (element.GetPawnType() == PawnType.BLACK && isPot) {
                    blackPotCount++;
                } else if (element.GetPawnType() == PawnType.WHITE && isPot) {
                    whitePotCount++;
                }

                infoJSON.all_pawns.push({
                    index_num: index,
                    position_x: element.node.position.x,
                    position_y: element.node.position.y,
                    is_potted: isPot,
                });
            }
            infoJSON.white_pot_count = whitePotCount;
            infoJSON.black_pot_count = blackPotCount;
        }

        infoJSON.shooter_id = this.mBoardManager.myID;
        infoJSON.last_update = isLastUpdate;
        infoJSON.striker_pos_x = this.mBoardManager.striker.strikerNode.position.x;
        infoJSON.striker_pos_y = this.mBoardManager.striker.strikerNode.position.y;
        this.mPersistentNode.GetSocketConnection().sendPawnInfo(infoJSON);
    }

    //#endregion
}
