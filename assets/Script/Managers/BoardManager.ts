import PawnComponent, { PawnType } from "./../Pawn";
import { Player, BoardState, FoulTypes } from "../Player";
import Striker from "../Striker";
import { Constants, GameType, AllGameModes, GameEvents } from "../LoadingScene/Constants";
import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Logger } from "../LoadingScene/Logger";
import GameUIManager from "../UI/GameUIManager";
import Helper from "../Helpers/Helper";
import { GenericPopupBtnType } from "../UI/GenericPopup";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardManager extends cc.Component {

    @property(cc.Node)
    pawnHolder: cc.Node = null;

    @property(cc.Node)
    pockets: Array<cc.Node> = [];

    @property(cc.Prefab)
    pawnPrefab: cc.Prefab = null;

    @property(Striker)
    striker: Striker = null;

    @property(cc.Label)
    scoreLabels: Array<cc.Label> = [];
    @property(cc.Label)
    typeLabels: Array<cc.Label> = [];

    @property(PawnComponent)
    dummyPawnComponent: PawnComponent = null;

    mAllPawnPool: Array<PawnComponent> = [];
    mPlayerPool: Array<Player> = [];

    mPersistentNode: PersistentNodeComponent = null;
    mLogger: Logger = null;

    mCurrentTurnIndex: number = 0;
    mPersonalIndex: number = 0;
    mStrikerDistanceFromMid: number = 0;
    mTotalPawnsCount: number = 0;
    //Flags
    mIsGameOver: boolean = false;
    mIsValidPotPending: boolean = false;
    mIsRedPotCoverPending: boolean = false;
    mIsDebugMode: boolean = false;
    mIsMyShot: boolean = true;
    startPawnTracking: boolean = false;

    myID: string = "";
    mPawnRadius: number = 0;
    redPawnIndex: number = -1;
    mLastShotPointerIndex: number = 0;

    mAllPots: Array<PawnComponent> = [];
    mUIManager: GameUIManager = null;

    static MAX_PAWN_PER_TYPE_COUNT = 9;
    static IS_RED_COVERED: boolean = false;

    onLoad() {
        this.mStrikerDistanceFromMid = Math.abs(this.striker.strikerNode.getPosition().y);

        let pNode = cc.find(Constants.PERSISTENT_NODE_NAME);
        if (pNode) {
            this.mIsDebugMode = false;
            this.mPersistentNode = pNode.getComponent(PersistentNodeComponent);
            this.mPersistentNode.node.on(GameEvents.TAKE_SHOT, this.OnTakeShotCallback, this);
            this.mPersistentNode.node.on(GameEvents.UPDATE_TURN, this.OnNextTurnCallback, this);
            this.mPersistentNode.node.on(GameEvents.UPDATE_SCORE, this.OnUpdateScoreCallback, this);
            this.mPersistentNode.node.on(GameEvents.SYNC_PAWNS, this.OnSyncPawnsCallback, this);
            this.mPersistentNode.node.on(GameEvents.GAME_OVER, this.OnGameOverResponseCallback, this);
            this.mPersistentNode.node.on(GameEvents.GE_RED_POT_COVER, this.OnRedCoverEvent, this);

            this.myID = this.mPersistentNode.GetPlayerModel().getID();
        } else {
            this.mIsDebugMode = true;
        }
    }

    start() {
        this.mAllPawnPool.length = 0; //reset
        this.mLogger = new Logger(this.node.name);
        this.mUIManager = this.getComponent(GameUIManager);
    }

    InitUI() {
        this.mUIManager.RegisterBoardManager(this);
        if (this.myID == this.mPlayerPool[0].GetID()) {
            this.mUIManager.InitializePlayerNodes(this.mPlayerPool[0], this.mPlayerPool[1]);
        } else {
            this.mUIManager.InitializePlayerNodes(this.mPlayerPool[1], this.mPlayerPool[0]);
        }
        //console.log("Initializing UI");
    }

    InitializeCarromBoard() {
        if (this.mAllPawnPool.length > 0) {
            for (let index = 0; index < this.mAllPawnPool.length; index++) {
                this.mAllPawnPool[index].node.destroy();
            }
        }

        if (this.mIsMyShot == false) { //rotate pawnholder 120 degree
            this.pawnHolder.angle = 210;
        }

        this.mAllPawnPool.length = 0;
        let pawnNode = cc.instantiate(this.pawnPrefab);
        this.mPawnRadius = pawnNode.getComponent(cc.CircleCollider).radius;
        let r = this.mPawnRadius;
        let d = r * 2;

        //let deltaX = Math.abs(r * 2 - ((r * 2) * Math.cos(45)));
        let deltaY = Math.abs(d - ((d) * Math.sin(45)));

        let startPos = cc.Vec2.ZERO;
        startPos.x = -d; // first pawn
        startPos.y = d * 2 - (deltaY * 2);

        //Real values
        let currentHighestCol = 3;
        let currentHighestRow = 3;

        //Testing  values
        // let currentHighestCol = 2;
        // let currentHighestRow = 2;

        let currentType = 1;
        let toggleThreshold = 0;
        let idCounter = -1;

        for (let row = 0; row < currentHighestRow; row++) {
            for (let col = 0; col < currentHighestCol; col++) {
                idCounter++;
                if (row + col > 0) { //skipping first pawn, its already created
                    pawnNode = cc.instantiate(this.pawnPrefab);
                }
                pawnNode.setPosition(startPos);
                this.AddToPawnPool(pawnNode, idCounter);
                this.ConvertPawnTo(pawnNode, (row == 2 && col == 2) ? 0 : currentType);

                if (row != 2) { // adding counter pawn
                    pawnNode = cc.instantiate(this.pawnPrefab);
                    pawnNode.setPosition(new cc.Vec2(startPos.x, -startPos.y));

                    this.AddToPawnPool(pawnNode, idCounter);
                    this.ConvertPawnTo(pawnNode, currentType);
                }

                if (toggleThreshold <= 0) {
                    currentType = this.TogglePawnType(currentType);
                }
                startPos.x += d;
                toggleThreshold--;
            }

            toggleThreshold = row + 1;
            startPos.x = -d - ((row + 1) * r);
            startPos.y -= (d - deltaY);

            currentHighestCol++;
            if (currentHighestCol >= 6) {
                //this.pawnHolder.angle = 30; //doesnt matter because all pawns are rigid body
                break;
            }
        }//for

        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            if (element.pawnType == PawnType.RED) {
                this.redPawnIndex = index;
                break;
            }
        }
    }

    onDestroy() {
        if (this.mIsDebugMode) return;

        this.mPersistentNode.node.off(GameEvents.TAKE_SHOT, this.OnTakeShotCallback, this);
        this.mPersistentNode.node.off(GameEvents.UPDATE_TURN, this.OnNextTurnCallback, this);
        this.mPersistentNode.node.off(GameEvents.UPDATE_SCORE, this.OnUpdateScoreCallback, this);
        this.mPersistentNode.node.off(GameEvents.SYNC_PAWNS, this.OnSyncPawnsCallback, this);
        this.mPersistentNode.node.off(GameEvents.GAME_OVER, this.OnGameOverResponseCallback, this);
        this.mPersistentNode.node.off(GameEvents.GE_RED_POT_COVER, this.OnRedCoverEvent, this);
    }

    Initialize1v1Players(currentTurnIndex: number) {
        this.mCurrentTurnIndex = currentTurnIndex;
    }

    OnNextTurnCallback(next_turn_id: string) {
        if (this.mIsGameOver) {
            return;
        }

        if (this.mIsDebugMode) {
            this.mIsMyShot = true;
            if (this.mIsValidPotPending == false) {
                this.mCurrentTurnIndex = ((this.mCurrentTurnIndex + 1) % this.mPlayerPool.length);
            }
        } else {
            if (this.myID == this.mPlayerPool[0].GetID()) {
                this.mCurrentTurnIndex = (next_turn_id == this.myID) ? 0 : 1;
            } else if (this.myID == this.mPlayerPool[1].GetID()) {
                this.mCurrentTurnIndex = next_turn_id == this.myID ? 1 : 0;
            }
            this.mIsMyShot = (next_turn_id == this.myID); //take off control from player

            if (this.mIsMyShot) {
                this.ReactivateAllBody();
            } else {
                this.DeactivateAllBody();
            }
        }

        this.StartShotTimer();
        this.striker.ResetStriker();
        this.ApplyTurn();
    }

    StartShotTimer() {
        this.mUIManager.InitTimer(this.mIsMyShot ? this.myID : this.GetOpponentId());
    }

    ShotTimeOutRequest() {
        console.error("TIMEOUT REQUEST::::");
        if (this.mIsDebugMode == false) {
            if (this.mIsMyShot) {
                this.mUIManager.ShowToast(2, "TIME OUT!");
                this.mPersistentNode.GetSocketConnection().sendNextTurnUpdate(this.GetOpponentId());
            } else {
                this.mPersistentNode.GetSocketConnection().sendNextTurnUpdate(this.myID);
            }
        }
    }

    OnStrikerHit(forceVec: cc.Vec2, magnitude: number) {
        this.startPawnTracking = this.mIsMyShot;

        this.mIsValidPotPending = false; // release
        this.mIsMyShot = false;
        //console.log("on striker hit ::: mySHOt::" + this.mIsMyShot + ", istrakcing::" + this.mStartTracking);
        if (this.mIsDebugMode == false) {
            this.mPersistentNode.GetSocketConnection().sendNewShotRequest(forceVec, magnitude);
        }
        this.mUIManager.StopTimer();
    }

    OnTakeShotCallback(body: any) {
        // if (body.player_id !== this.myID) {
        //     //console.log("PROPAGATING FOR ::: " + this.mPersistentNode.GetPlayerModel().getName());
        //     //this.striker.ApplyForce(new cc.Vec2(body.force_x, body.force_y), body.mag);
        // }
        this.mUIManager.StopTimer();
    }

    OnUpdateScoreCallback(body: any) {
        this.mPlayerPool[0].SetScore(body.p1_score);
        this.mPlayerPool[1].SetScore(body.p2_score);
        this.mUIManager.UpdateScore();
    }

    ApplyTurn() {
        this.GetClosePawnList();
        this.UpdateStrikerPos();
    }

    private UpdateStrikerPos() {
        //this.striker.node.active = true;

        const startPosY = this.mIsMyShot ? -this.mStrikerDistanceFromMid : this.mStrikerDistanceFromMid;
        this.striker.strikerNode.setPosition(0, startPosY);

        let startPosX = this.striker.mPhysicsComponent.radius;
        let counter = 0;
        while (!this.IsStrikerPosValid()) { //TODO check both ways
            counter++;
            if (counter % 2 == 0) { //check right
                startPosX = (counter / 2) * this.striker.mPhysicsComponent.radius;
            } else { //check right
                startPosX = -((counter + 1) / 2) * this.striker.mPhysicsComponent.radius;
            }
            this.striker.strikerNode.setPosition(startPosX, startPosY);
        }
    }

    closePawnIndexList: Array<number> = [];

    GetClosePawnList() {
        this.closePawnIndexList.length = 0;

        const startPosY = this.mIsMyShot ? -this.mStrikerDistanceFromMid : this.mStrikerDistanceFromMid;
        const dangerDistance = this.striker.mPhysicsComponent.radius + this.mAllPawnPool[0].mPhysicsCollider.radius;

        const dangerThresholdMinY = startPosY - dangerDistance;
        const dangerThresholdMaxY = startPosY + dangerDistance;

        const worldPosMin = this.striker.node.convertToWorldSpaceAR(new cc.Vec2(0, dangerThresholdMinY));
        const worldPosMax = this.striker.node.convertToWorldSpaceAR(new cc.Vec2(0, dangerThresholdMaxY));

        //search for potential pawns that can conflict with striker position
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            const worldPos = element.node.parent.convertToWorldSpaceAR(element.node.position);
            if (worldPos.y >= worldPosMin.y && worldPos.y <= worldPosMax.y) {
                //console.log("adding threats::");
                this.closePawnIndexList.push(index);
            }
        }
    }

    IsStrikerPosValid(): boolean {
        //console.log("current total threats :: ", this.closePawnIndexList.length);
        let worldPosStriker = this.striker.node.convertToWorldSpaceAR(this.striker.strikerNode.position);
        const dangerDistance = this.striker.mPhysicsComponent.radius + this.mAllPawnPool[0].mPhysicsCollider.radius;

        for (let index = 0; index < this.closePawnIndexList.length; index++) {
            const element = this.mAllPawnPool[this.closePawnIndexList[index]];
            let worldPosPawn = element.node.parent.convertToWorldSpaceAR(element.node.position);
            const dist = Helper.getDistance(worldPosPawn, worldPosStriker);
            if (dist <= dangerDistance) {
                this.striker.ShowPositionError();
                return false;
            }
        }
        this.striker.HidePositionError();
        return true;
    }

    private IsBoardEmpty(): boolean {
        return (this.mAllPots.length >= BoardManager.MAX_PAWN_PER_TYPE_COUNT * 2);
    }

    OnDrawPopupCallback() { //todo
        this.mUIManager.HideGenericPopup();
    }

    private CommitFoul(ft: FoulTypes) {
        console.error("FOULED ::: ");
        this.mLastShotPointerIndex = this.mAllPots.length; //updating pots
        switch (ft) {
            case FoulTypes.STRIKER_POT:
                this.mUIManager.ShowToast(2, "Foul!!");
                this.Respawn(this.mPlayerPool[this.mCurrentTurnIndex].GetCurrentPawnType(), 1);
                break;
            case FoulTypes.BOARD_EMPTY_WITHOUT_COVER:
                this.mUIManager.ShowToast(2, "Foul!!");
                this.Respawn(this.mPlayerPool[this.mCurrentTurnIndex].GetCurrentPawnType(), 1);
                this.Respawn(this.mPlayerPool[(this.mCurrentTurnIndex + 1) % this.mPlayerPool.length].GetCurrentPawnType(), 1);
                this.Respawn(PawnType.RED, 1);
                break;
            case FoulTypes.NO_REMAINING_POTS_WIHTOUT_COVER:
                this.mUIManager.ShowToast(2, "Foul!!");
                let totalBlackPots = 0;
                let totalWhitePots = 1;
                for (let index = 0; index < this.mAllPots.length; index++) {
                    const element = this.mAllPots[index];
                    if (element.pawnType == PawnType.BLACK) {
                        totalBlackPots++;
                    } else if (element.pawnType == PawnType.WHITE) {
                        totalWhitePots++;
                    }
                }

                if (totalBlackPots >= BoardManager.MAX_PAWN_PER_TYPE_COUNT) {
                    this.Respawn(PawnType.BLACK, 1);
                }

                if (totalWhitePots >= BoardManager.MAX_PAWN_PER_TYPE_COUNT) {
                    this.Respawn(PawnType.WHITE, 1);
                }
                break;
            case FoulTypes.RED_COVER_FAILED:
                this.mUIManager.ShowToast(2, "Red Cover Failed");
                this.Respawn(PawnType.RED, 1);
                break;
        }

        this.mLastShotPointerIndex = this.mAllPots.length;
        //this.ReactivateAllBody();
        if (this.mIsDebugMode == false) {
            this.mPersistentNode.GetSocketConnection().sendScoreUpdate(
                this.mPlayerPool[0].GetScore(),
                this.mPlayerPool[0].GetID(),
                this.mPlayerPool[1].GetScore(),
                this.mPlayerPool[1].GetID()
            );
            this.SendPawnInfo(1);
        }
    }

    private Respawn(pt: PawnType, count: number) {
        if (this.mAllPots.length <= 0) {
            console.log("No pots yet, so no foul");
            return;
        }
        //console.error("FOUL RESPAWN::: ", pt, count);
        let totalRespawned = 0;
        for (let index = this.mAllPots.length - 1; index >= 0; index--) {
            const element = this.mAllPots[index];
            if (element.pawnType == pt) {
                element.FoulRespawn();
                element.node.setPosition(new cc.Vec2(0, 0));
                this.mAllPots.splice(index, 1);
                totalRespawned++;
            }

            if (totalRespawned >= count) {
                break;
            }
        }
    }

    private ProcessGameOver() {
        this.mIsGameOver = true;
        //find the winner
        let winnerID: string = "";

        let whitePotCount = 0;
        let blackPotCount = 0;

        for (let index = 0; index < this.mAllPots.length; index++) {
            const element = this.mAllPots[index];
            if (element.GetPawnType() == PawnType.BLACK) {
                blackPotCount++;
            } else if (element.GetPawnType() == PawnType.WHITE) {
                whitePotCount++;
            }
        }

        let isDraw = blackPotCount == whitePotCount && blackPotCount == BoardManager.MAX_PAWN_PER_TYPE_COUNT;

        if (isDraw) {
            if (this.mPlayerPool[0].GetScore() > this.mPlayerPool[1].GetScore()) {
                winnerID = this.mPlayerPool[0].GetID();
            } else if (this.mPlayerPool[0].GetScore() < this.mPlayerPool[1].GetScore()) {
                winnerID = this.mPlayerPool[1].GetID();
            } else {
                console.error("SCORE MANAGEMENT ERROR, two players cant have same score");
            }
        } else {
            let winType = blackPotCount >= BoardManager.MAX_PAWN_PER_TYPE_COUNT ? PawnType.BLACK : PawnType.WHITE;
            console.log("wintype:::: ", winType);
            if (this.mPlayerPool[0].GetCurrentPawnType() == winType) {
                winnerID = this.mPlayerPool[0].GetID();
            } else {
                winnerID = this.mPlayerPool[1].GetID();
            }
        }

        if (this.mIsDebugMode == false) {
            let redCoveredID = "";
            for (let index = 0; index < this.mPlayerPool.length; index++) {
                const element = this.mPlayerPool[index];
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
    }

    private TogglePawnType(ct: number) {
        if (ct == 1) {
            return 2;
        } else if (ct == 2) {
            return 1;
        }
        return 0;
    }

    private AddToPawnPool(pawn: cc.Node, id: number) {
        let pawnComp = pawn.getComponent(PawnComponent);
        this.mAllPawnPool.push(pawnComp);
        pawnComp.RegisterBoardManager(this);
        pawnComp.SetId(id);
        pawnComp.SetIndex(this.mAllPawnPool.length - 1);
        pawn.setParent(this.pawnHolder);
    }

    private ConvertPawnTo(pn: cc.Node, pt: number) {
        let pawn = pn.getComponent(PawnComponent);
        switch (pt) {
            case 0:
                pawn.Convert(PawnType.RED);
                break;
            case 1:
                pawn.Convert(PawnType.BLACK);
                break;
            case 2:
                pawn.Convert(PawnType.WHITE);
                break;
        }
    }

    GetPlayerByID(id: string): Player {
        for (let index = 0; index < this.mPlayerPool.length; index++) {
            const player = this.mPlayerPool[index];
            if (player.GetID() == id) {
                return player;
            }
        }
        return null;
    }

    OnRedCoverEvent(body) {
        this.GetPlayerByID(body.shooter_id).RedCover();
        if (body.shooter_id == this.myID) { //my shot
            this.mUIManager.ShowToast(2, "Red Covered Successfully!");
        } else {
            this.mUIManager.ShowToast(2, "Red is covered by opponent!");
        }
    }//onredpotevent

    RegisterPot(pawn: PawnComponent) {
        pawn.SetPotPlayer(this.mPlayerPool[this.mCurrentTurnIndex]);
        this.mAllPots.push(pawn);
        console.log("PUSHING PAWN NUMBER : ", pawn.GetId());

        if (this.mIsDebugMode == false) {
            this.mPersistentNode.GetSocketConnection().sendScoreUpdate(
                this.mPlayerPool[0].GetScore(),
                this.mPlayerPool[0].GetID(),
                this.mPlayerPool[1].GetScore(),
                this.mPlayerPool[1].GetID()
            );
            this.SendPawnInfo(1);
        }
        this.mUIManager.UpdateScore();
    }//registerPot

    GetOpponentId(): string {
        if (this.mPlayerPool[0].GetID() == this.mPersistentNode.GetPlayerModel().getID()) {
            return this.mPlayerPool[1].GetID();
        } else if (this.mPlayerPool[1].GetID() == this.mPersistentNode.GetPlayerModel().getID()) {
            return this.mPlayerPool[0].GetID();
        }
    }

    GetAllSpeed(): number {
        let speed = 0;
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            speed += this.mAllPawnPool[index].mRigidBody.linearVelocity.magSqr();
        }
        speed += this.striker.mStrikerRigidBody.linearVelocity.magSqr();
        return speed;
    }

    EvaluateBoardAfterShot() {
        let bState = BoardState.NONE;
        //==1, Board Empty?
        if (this.IsBoardEmpty()) {
            if (BoardManager.IS_RED_COVERED) {
                this.ProcessGameOver();
            } else {
                this.CommitFoul(FoulTypes.BOARD_EMPTY_WITHOUT_COVER);
            }
            return;
        }

        //==2//TODO is striker is pot, commit foul
        //console.log("Evaluating board::");
        //==3, no new pot
        if (this.mLastShotPointerIndex >= this.mAllPots.length) {
            console.log("NO NEW POT HAPPENED===", this.mAllPots.length);
            bState = BoardState.NO_POT;
            this.mIsValidPotPending = false;
            if (this.mIsRedPotCoverPending) {
                this.CommitFoul(FoulTypes.RED_COVER_FAILED);
                this.mIsRedPotCoverPending = false;
            }
            this.TakeNextTurn();
            return;
        }

        //console.log("POT DETECTED");

        //==4 new pot, check the pots
        let myPlayer = this.mPlayerPool[this.mCurrentTurnIndex];
        let otherPlayer = this.mPlayerPool[(this.mCurrentTurnIndex + 1) % this.mPlayerPool.length];

        let totalWhitePots = 0;
        let totalBlackPots = 0;

        for (let index = 0; index < this.mAllPots.length; index++) {
            const element = this.mAllPots[index];
            if (element.GetPawnType() == PawnType.BLACK) {
                totalBlackPots++;
            } else if (element.GetPawnType() == PawnType.WHITE) {
                totalWhitePots++;
            }
        }

        console.log("TOTAL POTS: Black, white", totalBlackPots, totalWhitePots);
        if (totalBlackPots >= BoardManager.MAX_PAWN_PER_TYPE_COUNT || totalWhitePots >= BoardManager.MAX_PAWN_PER_TYPE_COUNT) {
            if (BoardManager.IS_RED_COVERED) {
                console.log("GAME ENDED DUE TO NO POT AVAILABLE FOR A CERTAIN PLAYER & RED IS COVERED");
                this.ProcessGameOver();
            } else {
                this.CommitFoul(FoulTypes.NO_REMAINING_POTS_WIHTOUT_COVER);
            }
            return;
        }

        if (BoardManager.IS_RED_COVERED) {
            console.log("AFTER RED POT< NORMAL POT");
            bState = BoardState.NONE;
            for (let index = this.mLastShotPointerIndex; index < this.mAllPots.length; index++) {
                let element = this.mAllPots[index];
                let myPot = myPlayer.GetCurrentPawnType() == element.GetPawnType() ? true : false;
                if (myPot) {
                    bState = BoardState.VALID_POT;
                }
            }
        } else { // red not covered
            bState = BoardState.NONE;
            if (this.mIsRedPotCoverPending) {
                console.log("PENDING RED COVER CHECK :: ");
                for (let index = this.mLastShotPointerIndex; index < this.mAllPots.length; index++) {
                    let element = this.mAllPots[index];
                    let myPot = myPlayer.GetCurrentPawnType() == element.GetPawnType() ? true : false;
                    if (myPot) {
                        myPlayer.RedCover();
                        bState = BoardState.RED_COVERED;
                        this.mIsRedPotCoverPending = false;
                        this.mPersistentNode.GetSocketConnection().sendRedPotCoverReq({ shooter_id: this.myID });
                        //this.mUIManager.ShowToast(2, "Red Covered Successfully");
                    }

                    if (myPot == false && bState != BoardState.RED_COVERED) {
                        bState = BoardState.RED_COVER_FAILED;
                    }
                }
            } else {
                console.log("NORMAL CHECK, RED NOT COVERED, all pot length, lastPotPointer ", this.mAllPots.length, this.mLastShotPointerIndex);
                for (let index = this.mLastShotPointerIndex; index < this.mAllPots.length; index++) {
                    let element = this.mAllPots[index];
                    if (element.GetPawnType() == PawnType.RED) {
                        this.mIsRedPotCoverPending = true;
                        bState = BoardState.RED_POT;
                        this.mUIManager.ShowToast(2, "Now Give cover of red");
                    } else {
                        console.log("LOCAL PLAYER:: ", myPlayer.GetName());
                        console.log("OTHER PLAYER:: ", otherPlayer.GetName());
                        // console.log("Traversing index :: ", element.GetId());

                        let myPot = myPlayer.GetCurrentPawnType() == element.GetPawnType() ? true : false;
                        if (myPot) {
                            // console.log("VALID POT HAPPENDED:::");
                            bState = BoardState.VALID_POT;
                        }
                    }
                }
            }
        }

        if (bState == BoardState.RED_COVER_FAILED) {
            console.log("RED COVER FAILED:: OPPONENT PAWN STRIKED");
            this.CommitFoul(FoulTypes.RED_COVER_FAILED);
            this.TakeNextTurn();
            return;
        }

        this.mIsValidPotPending = (bState == BoardState.VALID_POT || bState == BoardState.RED_COVERED || bState == BoardState.RED_POT);
        console.log("is valid pot::?? " + this.mIsValidPotPending + ", state:: " + bState);
        this.mLastShotPointerIndex = this.mAllPots.length;
        this.TakeNextTurn();
    }

    SendPawnInfo(isLastUpdate: number, onlyStrikerUpdate = false) {
        //TODO just send the necessary pawns
        let infoJSON: any = {};

        if (onlyStrikerUpdate == false) {
            infoJSON.all_pawns = [];
            let whitePotCount = 0;
            let blackPotCount = 0;

            for (let index = 0; index < this.mAllPawnPool.length; index++) {
                const element = this.mAllPawnPool[index];
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

        infoJSON.shooter_id = this.myID;
        infoJSON.last_update = isLastUpdate;
        infoJSON.striker_pos_x = this.striker.strikerNode.position.x;
        infoJSON.striker_pos_y = this.striker.strikerNode.position.y;
        // this.mWhitePotCount = whitePotCount;
        // this.mBlackPotCount = blackPotCount;
        this.mPersistentNode.GetSocketConnection().sendPawnInfo(infoJSON);
    }

    OnGameOverResponseCallback(data: any) {
        console.log("On game over response callback :: ", data);
        //show game over ui
        if (data.winner_id == this.myID) {
            this.mUIManager.ShowMatchEndPopup(true);
        } else {
            this.mUIManager.ShowMatchEndPopup(false);
        }
    }

    OnSyncPawnsCallback(body: any) {
        if (body.shooter_id == this.myID) { //no need to update my pawns, physics is controlling them
            return;
        }

        let lastUpdate = body.last_update == 0 ? false : true;
        const updateRate = 0.06;

        if (lastUpdate) {
            this.mAllPots.length = 0;
        }

        if (body.all_pawns) {
            for (let index = 0; index < body.all_pawns.length; index++) {
                let inNum = body.all_pawns[index].index_num;
                let x = body.all_pawns[index].position_x;
                let y = body.all_pawns[index].position_y;
                let isPot = body.all_pawns[index].is_potted;

                this.mAllPawnPool[inNum].mIsPotted = isPot;
                this.mAllPawnPool[inNum].node.active = !isPot;

                if (isPot && lastUpdate) {
                    this.mAllPots.push(this.mAllPawnPool[inNum]);
                }

                this.mAllPawnPool[inNum].node.stopAllActions();
                if (lastUpdate == false) {
                    let action = cc.moveTo(updateRate, x, y);
                    this.mAllPawnPool[inNum].node.runAction(action);
                } else {
                    this.mAllPawnPool[inNum].node.setPosition(x, y);
                }
            }
        }

        if (lastUpdate) {
            this.mLastShotPointerIndex = this.mAllPots.length;
            this.striker.strikerNode.setPosition(new cc.Vec2(-body.striker_pos_x, -body.striker_pos_y));
        } else {
            this.striker.strikerNode.stopAllActions();
            let strikerMoveAction = cc.moveTo(updateRate, -body.striker_pos_x, -body.striker_pos_y);
            this.striker.strikerNode.runAction(strikerMoveAction);
        }
    }

    DeactivateAllBody() {
        //console.error(":::deactivating pawn bodies:::::");
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            element.DisablePhysics();
        }
        this.striker.DisablePhysics();
    }

    ReactivateAllBody() {
        //console.error(":::activating pawn bodies;::");
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            if (element.mIsPotted == false) {
                element.ActivatePhysics();
            }
        }
        this.striker.ActivatePhysics();
    }

    TakeNextTurn() {
        if (this.mIsDebugMode) {
            this.OnNextTurnCallback("");
        } else {
            let chosenID = this.mIsValidPotPending ? this.myID : this.GetOpponentId();
            this.mPersistentNode.GetSocketConnection().sendNextTurnUpdate(chosenID);
        }
    }

    frameStep: number = 0;
    totalSec: number = 0;

    update(dt) {
        if (this.mIsDebugMode) {
            return;
        }

        if (this.startPawnTracking) {
            this.frameStep += dt;
            this.totalSec += dt;

            if (this.frameStep > 0.05) { //update rate with the server
                this.frameStep = 0;
                this.SendPawnInfo(0);

                if (this.GetAllSpeed() <= 0 || this.totalSec >= 7) {
                    this.SendPawnInfo(1);
                    this.totalSec = 0;
                    this.startPawnTracking = false;
                    this.EvaluateBoardAfterShot();
                }
            }
        }
    }
}
