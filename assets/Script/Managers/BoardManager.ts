import PawnComponent, { PawnType } from "./../Pawn";
import { Player } from "../Player";
import Striker from "../Striker";
import { Constants, GameType, AllGameModes, GameEvents } from "../LoadingScene/Constants";
import { WSConnection } from "../LoadingScene/Connection";
import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Logger } from "../LoadingScene/Logger";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardManager extends cc.Component {

    @property(cc.Node)
    boardBody: cc.Node = null;

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

    mAllPawnPool: Array<PawnComponent> = [];
    mPlayerPool: Array<Player> = [];

    mPersistentNode: PersistentNodeComponent = null;
    mLogger: Logger = null;

    mCurrentTurnIndex: number = 0;
    mPersonalIndex: number = 0;
    mStrikerDistanceFromMid: number = 0;
    mTotalPawnsCount: number = 0;

    mBlackPotCount: number = 0;
    mWhitePotCount: number = 0;
    MAX_PAWN_PER_TYPE_COUNT = 9;

    //Flags
    mIsGameOver: boolean = false;
    mIsValidPotPending: boolean = false;

    onLoad() {
        //this.mStrikerDistanceFromMid = Math.abs(this.striker.strickerBody.getPosition().y);
    }

    start() {
        this.mAllPawnPool.length = 0; //reset
        this.mLogger = new Logger(this.node.name);
        this.mPersistentNode = cc.find(Constants.PERSISTENT_NODE_NAME).getComponent(PersistentNodeComponent);


        //this.Initialize(GAME_TYPE.CARROM); //it should be called from persistent component
        //this.InitializePlayers();

        //this.ApplyTurn();
        //this.mPlayerPool[this.mCurrentTurnIndex].SetType(PawnType.WHITE);
        //this.mPlayerPool[(this.mCurrentTurnIndex + 1) % this.mPlayerPool.length].SetType(PawnType.BLACK);
    }

    Initialize(gameType: GameType) {
        switch (gameType) {
            case GameType.CARROM:
                this.InitializeCarromBoard();
                break;
            case GameType.RANDOM:
                //this.initializeRandomBoard();
                break;
        }
    }

    IsStrikerMoving() {
        if (!this.striker.mStrikerRigidBody) {
            console.warn("couldnt find rigid body");
            return false;
        }

        if (this.striker.mStrikerRigidBody.linearVelocity == cc.Vec2.ZERO) {
            return false;
        }

        return true;
    }

    InitializePlayers() {
        //coming from server -> persistent object
        this.mPlayerPool.length = 0;

        this.mPlayerPool.push(new Player("player0", "James", 0));
        this.mPlayerPool.push(new Player("player1", "Kyle", 1));

        this.mPersonalIndex = 0; //TODO

        switch (this.mPersonalIndex) {
            case 1: // TOP player
                this.boardBody.angle = 180;
                break;
            case 0:
                this.boardBody.angle = 0;
                break;
            default:
                break;
        }
    }

    HandleNextTurn() {
        if (this.mIsGameOver) {
            return;
        }
        if (this.mIsValidPotPending == false) {
            this.mCurrentTurnIndex = ((this.mCurrentTurnIndex + 1) % this.mPlayerPool.length);
        }

        //hand over current turn
        this.striker.ResetStriker();
        this.ApplyTurn();
    }

    OnStrikerHit() {
        this.mIsValidPotPending = false; // release
    }

    private ApplyTurn() {
        //update striker pos
        this.UpdateStrikerPos();
    }

    private UpdateStrikerPos() {
        switch (this.mCurrentTurnIndex) {
            case 1: // TOP Player
                this.striker.strickerBody.setPosition(0, this.mStrikerDistanceFromMid);
                break;
            case 0:
                this.striker.strickerBody.setPosition(0, -this.mStrikerDistanceFromMid);
                break;
        }
    }

    private IsBoardEmpty(): boolean {
        return (this.mBlackPotCount == this.mWhitePotCount) && (this.mBlackPotCount == this.MAX_PAWN_PER_TYPE_COUNT);
    }

    private ProcessGameOver() {
        this.mIsGameOver = true;
        if (this.IsBoardEmpty()) { //TODO
            //compare score
            let winnerIndex = -1;
            let currHighestScore = 0;
            for (let i = 0; i < this.mPlayerPool.length; i++) {
                if (this.mPlayerPool[i].GetScore() > currHighestScore) {
                    currHighestScore = this.mPlayerPool[i].GetScore();
                    winnerIndex = i;
                }
            }

            console.log("WINNER :  " + this.mPlayerPool[winnerIndex].GetName());
            return;
        }

        let winType = PawnType.NONE;
        if (this.mBlackPotCount >= this.MAX_PAWN_PER_TYPE_COUNT) {
            winType = PawnType.BLACK;
        } else if (this.mWhitePotCount >= this.MAX_PAWN_PER_TYPE_COUNT) {
            winType = PawnType.WHITE;
        }

        for (let i = 0; i < this.mPlayerPool.length; i++) {
            if (this.mPlayerPool[i].GetCurrentPawnType() == winType) {
                console.log("WINNER :  " + this.mPlayerPool[i].GetName());
                break;
            }
        }
    }

    private UpdateScoreUI() {
        this.scoreLabels[this.mCurrentTurnIndex].string = this.mPlayerPool[this.mCurrentTurnIndex].GetName() + " : " + this.mPlayerPool[this.mCurrentTurnIndex].GetScore();
    }

    private InitializeCarromBoard() {
        this.mAllPawnPool.length = 0;
        let pawnNode = cc.instantiate(this.pawnPrefab);
        let r = pawnNode.getComponent(cc.CircleCollider).radius;
        let d = r * 2;

        //let deltaX = Math.abs(r * 2 - ((r * 2) * Math.cos(45)));
        let deltaY = Math.abs(r * 2 - ((r * 2) * Math.sin(45)));

        let startPos = cc.Vec2.ZERO;
        startPos.x = -d; // first pawn
        startPos.y = d * 2 - (deltaY * 2);

        let currentHighestCol = 3;
        let currentType = 1;
        let toggleThreshold = 0;
        let idCounter = -1;
        for (let row = 0; row < 3; row++) {
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
        pawnComp.SetId(id);
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

    RegisterPot(pawn: PawnComponent) {
        if (pawn.GetId() < 0) {
            return;
        }

        let scoreToAdd = 1;
        switch (pawn.GetPawnType()) {
            case PawnType.RED:
                scoreToAdd = 2;
                break;
            case PawnType.BLACK:
                this.mBlackPotCount++;
                break;
            case PawnType.WHITE:
                this.mWhitePotCount++;
                break;
        }

        this.mPlayerPool[this.mCurrentTurnIndex].AddToScore(scoreToAdd);

        this.mIsValidPotPending = true;
        pawn.SetPotPlayer(this.mPlayerPool[this.mCurrentTurnIndex]);

        this.UpdateScoreUI();

        console.log("white left " + (this.MAX_PAWN_PER_TYPE_COUNT - this.mWhitePotCount));
        console.log("black left " + (this.MAX_PAWN_PER_TYPE_COUNT - this.mBlackPotCount));
        if (this.mWhitePotCount >= this.MAX_PAWN_PER_TYPE_COUNT || this.mBlackPotCount >= this.MAX_PAWN_PER_TYPE_COUNT) {
            //process game over for white player
            this.ProcessGameOver();
        }
    }//registerPot
}
