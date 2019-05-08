import PawnComponent, { PawnType } from "./../Pawn";
import { Player, BoardState, FoulTypes } from "../Player";
import Striker from "../Striker";
import { Constants, GameType, AllGameModes, GameEvents } from "../LoadingScene/Constants";
import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Logger } from "../LoadingScene/Logger";
import GameUIManager from "../UI/GameUIManager";
import Helper from "../Helpers/Helper";
import { GenericPopupBtnType } from "../UI/GenericPopup";
import BoardManagerWithFriend from "./BoardManagerWithFriend";
import BoardManagerWithBot from "./BoardManagerWithBot";

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
    //mIsDebugMode: boolean = false;
    mIsMyShot: boolean = true;

    myID: string = "";
    mPawnRadius: number = 0;
    redPawnIndex: number = -1;
    mLastShotPointerIndex: number = 0;

    mAllPots: Array<PawnComponent> = [];
    mUIManager: GameUIManager = null;
    mBMWithFriend: BoardManagerWithFriend = null;
    mBWithBot: BoardManagerWithBot = null;
    currentGameMode: AllGameModes = AllGameModes.NONE;

    static MAX_PAWN_PER_TYPE_COUNT = 9;
    static IS_RED_COVERED: boolean = false;

    onLoad() {
        this.mStrikerDistanceFromMid = Math.abs(this.striker.strikerNode.getPosition().y);
        this.mUIManager = this.getComponent(GameUIManager);
        this.mLogger = new Logger(this.node.name);
        this.striker.RegisterBoardManager(this);
    }

    RegisterPersistentNode(pn: PersistentNodeComponent) {
        this.mPersistentNode = pn;
        this.currentGameMode = this.mPersistentNode.GetCurrentGameModel().GetGameMode();
        this.myID = this.mPersistentNode.GetPlayerModel().getID();
        switch (this.mPersistentNode.GetCurrentGameModel().GetGameMode()) {
            case AllGameModes.QUICK_MATCH:
                //add quick match things
                this.mBWithBot = this.addComponent(BoardManagerWithBot);
                this.mBWithBot.RegisterBoardManager(this, this.mPersistentNode.GetCurrentBot());
                break;
            case AllGameModes.FRIEND_1v1:
                this.mBMWithFriend = this.addComponent(BoardManagerWithFriend);
                this.mBMWithFriend.RegisterBoardManager(this);
                break;
            default:
                break;
        }
    }

    InitUI() {
        this.mUIManager.RegisterBoardManager(this);
        if (this.myID == this.mPlayerPool[0].GetID()) {
            this.mUIManager.InitializePlayerNodes(this.mPlayerPool[0], this.mPlayerPool[1]);
        } else {
            this.mUIManager.InitializePlayerNodes(this.mPlayerPool[1], this.mPlayerPool[0]);
        }
    }

    InitializeCarromBoard() {
        this.mAllPawnPool.length = 0; //reset

        if (this.currentGameMode == AllGameModes.FRIEND_1v1 && this.mIsMyShot == false) { //rotate pawnholder 120 degree
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
        //let currentHighestCol = 2;
        //let currentHighestRow = 2;

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


        if (this.currentGameMode == AllGameModes.QUICK_MATCH) {
            this.mBWithBot.InitBoard();
        }
    }

    Initialize1v1Players(currentTurnIndex: number) {
        this.mCurrentTurnIndex = currentTurnIndex;
    }

    StartShotTimer() {
        this.mUIManager.StartTimer(this.mIsMyShot ? this.myID : this.GetOpponentId());
    }

    OnStrikerHit(forceVec: cc.Vec2, magnitude: number) {
        if (this.currentGameMode == AllGameModes.FRIEND_1v1) {
            this.mBMWithFriend.startPawnTracking = this.mIsMyShot;
        } else if (this.currentGameMode == AllGameModes.QUICK_MATCH) {
            this.mBWithBot.startPawnTracking = true; //always me shooting (shooting always happening in my end)
        }

        this.mIsValidPotPending = false; // release
        this.mIsMyShot = false;

        if (this.currentGameMode == AllGameModes.FRIEND_1v1) {
            this.mBMWithFriend.SendNewShotRequest(forceVec, magnitude);
        }
        this.mUIManager.StopTimer();
    }

    ApplyTurn() {
        this.striker.UpdateStrikerPos(this.mIsMyShot);
        this.striker.GetClosePawnList(this.mIsMyShot, this.mAllPawnPool);

        if (this.currentGameMode == AllGameModes.QUICK_MATCH && this.mIsMyShot == false) {
            this.mBWithBot.TakeShot();
        }
    }

    private IsBoardEmpty(): boolean {
        return (this.mAllPots.length >= ((BoardManager.MAX_PAWN_PER_TYPE_COUNT * 2) + 1));
    }

    OnDrawPopupCallback() { //todo
        this.mUIManager.HideGenericPopup();
    }

    private CommitFoul(ft: FoulTypes) {
        //console.error("FOULED ::: ");
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
        if (this.currentGameMode == AllGameModes.FRIEND_1v1) {
            this.mBMWithFriend.SendScoreUpdate();
        } else if (this.currentGameMode == AllGameModes.QUICK_MATCH) {
            this.mUIManager.UpdateScore();
        }
        this.TakeNextTurn();
    }

    private Respawn(pt: PawnType, count: number) {
        if (this.mAllPots.length <= 0) {
            console.log("No pots yet, so no foul");
            return;
        }
        console.error("FOUL RESPAWN::: ", this.mAllPots);
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
            if (this.mPlayerPool[0].GetCurrentPawnType() == winType) {
                winnerID = this.mPlayerPool[0].GetID();
            } else {
                winnerID = this.mPlayerPool[1].GetID();
            }
        }

        if (this.currentGameMode == AllGameModes.FRIEND_1v1) {
            this.mBMWithFriend.GameOver(winnerID);
        } else if (this.currentGameMode == AllGameModes.QUICK_MATCH) {
            this.mBWithBot.GameOver(winnerID);
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
        pawnComp.SetId(this.mAllPawnPool.length - 1);
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

    RegisterPot(pawn: PawnComponent) {
        pawn.SetPotPlayer(this.mPlayerPool[this.mCurrentTurnIndex],
            this.mPlayerPool[(this.mCurrentTurnIndex + 1) % this.mPlayerPool.length]);

        this.mAllPots.push(pawn);
        if (this.currentGameMode == AllGameModes.FRIEND_1v1) {
            this.mBMWithFriend.SendScoreUpdate();
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

        //==2 is striker is pot, commit foul

        //==3, no new pot
        if (this.mLastShotPointerIndex >= this.mAllPots.length) {
            console.log("NO NEW POT HAPPENED::", this.mAllPots.length);
            bState = BoardState.NO_POT;
            this.mIsValidPotPending = false;
            if (this.mIsRedPotCoverPending) {
                this.mIsRedPotCoverPending = false;
                this.CommitFoul(FoulTypes.RED_COVER_FAILED);
            } else {
                this.TakeNextTurn();
            }
            return;
        }

        //==4 new pot, check the pots
        let currentPlayer = this.mPlayerPool[this.mCurrentTurnIndex]; //this.GetPlayerByID(this.myID);
        let otherPlayer = this.mPlayerPool[(this.mCurrentTurnIndex + 1) % this.mPlayerPool.length]; //this.GetPlayerByID(this.GetOpponentId());  //this.mPlayerPool[(this.mCurrentTurnIndex + 1) % this.mPlayerPool.length];

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

        console.log("current player ::: ", currentPlayer.GetName());
        console.log("other player ;:: ", otherPlayer.GetName());
        //console.log("TOTAL POTS: Black, white", totalBlackPots, totalWhitePots);
        if (totalBlackPots >= BoardManager.MAX_PAWN_PER_TYPE_COUNT || totalWhitePots >= BoardManager.MAX_PAWN_PER_TYPE_COUNT) {
            if (BoardManager.IS_RED_COVERED) {
                //console.log("GAME ENDED DUE TO NO POT AVAILABLE FOR A CERTAIN PLAYER & RED IS COVERED");
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
                let myPot = currentPlayer.GetCurrentPawnType() == element.GetPawnType() ? true : false;
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
                    let myPot = currentPlayer.GetCurrentPawnType() == element.GetPawnType() ? true : false;
                    if (myPot) {
                        currentPlayer.RedCover();
                        bState = BoardState.RED_COVERED;
                        this.mIsRedPotCoverPending = false;

                        if (this.currentGameMode == AllGameModes.FRIEND_1v1) {
                            this.mBMWithFriend.SendRedCoverRequest(this.myID);
                        }
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
                        //TODO
                        this.mUIManager.ShowToast(2, "Now Give cover of red");
                    } else {
                        console.log("LOCAL PLAYER:: ", currentPlayer.GetName());
                        console.log("OTHER PLAYER:: ", otherPlayer.GetName());

                        let myPot = currentPlayer.GetCurrentPawnType() == element.GetPawnType() ? true : false;
                        if (myPot) {
                            bState = BoardState.VALID_POT;
                        }
                    }
                }
            }
        }

        if (bState == BoardState.RED_COVER_FAILED) {
            console.log("RED COVER FAILED:: OPPONENT PAWN STRIKED");
            this.CommitFoul(FoulTypes.RED_COVER_FAILED);
            return;
        }

        this.mIsValidPotPending = (bState == BoardState.VALID_POT || bState == BoardState.RED_COVERED || bState == BoardState.RED_POT);
        console.log("is valid pot::?? " + this.mIsValidPotPending + ", state:: " + bState, "red cover :: ", this.mIsRedPotCoverPending);
        this.mLastShotPointerIndex = this.mAllPots.length;
        this.TakeNextTurn();
    }

    DeactivateAllBody() {
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            element.DisablePhysics();
        }
        this.striker.DisablePhysics();
    }

    ReactivateAllBody() {
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            if (element.mIsPotted == false) {
                element.ActivatePhysics();
            }
        }
        this.striker.ActivatePhysics();
    }

    TakeNextTurn() {
        if (this.currentGameMode == AllGameModes.FRIEND_1v1) {
            let chosenID = this.mIsValidPotPending ? this.myID : this.GetOpponentId();
            this.mBMWithFriend.SendNextTurnUpdate(chosenID);
        } else if (this.currentGameMode == AllGameModes.QUICK_MATCH) {
            let chosenID = "";
            //toggle 
            if (this.mIsValidPotPending) {
                chosenID = this.mCurrentTurnIndex == 0 ? this.myID : this.GetOpponentId();
            } else {
                chosenID = this.mCurrentTurnIndex == 0 ? this.GetOpponentId() : this.myID;
            }
            this.mBWithBot.OnNextTurnCallback(chosenID);
        }
    }
}
