import PawnComponent, { PawnType } from "./../Pawn";
import { Player } from "../Player";
import Striker from "../Striker";

const { ccclass, property } = cc._decorator;

export enum GAME_TYPE {
    CARROM = 0,
    RANDOM
}

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

    mCurrentPawnPool: Array<PawnComponent> = [];
    mCurrentPlayerPool: Array<Player> = [];

    mCurrentTurnIndex: number = 0;
    mPersonalIndex: number = 0;
    mStrikerDistanceFromMid: number = 0;
    //Flags
    mIsGameOver: boolean = false;
    mIsValidPotPending: boolean = false;

    onLoad() {
        this.mStrikerDistanceFromMid = Math.abs(this.striker.strickerBody.getPosition().y);
    }

    start() {
        this.mCurrentPawnPool.length = 0; //reset
        this.Initialize(GAME_TYPE.CARROM); //it should be called from persistent component
        this.InitializePlayers();

        this.HandleNextTurn();
        //this.mCurrentTurnIndex = 0; //TODO server?
    }

    Initialize(gameType: GAME_TYPE) {
        switch (gameType) {
            case GAME_TYPE.CARROM:
                this.InitializeCarromBoard();
                break;
            case GAME_TYPE.RANDOM:
                //this.initializeRandomBoard();
                break;
        }
    }

    InitializePlayers() {
        //coming from server -> persistent object
        this.mCurrentPlayerPool.length = 0;

        this.mCurrentPlayerPool.push(new Player("player0", "James"));
        this.mCurrentPlayerPool.push(new Player("player1", "Kyle"));

        this.mPersonalIndex = 1; //TODO

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
        //check if game over
        if (this.mIsGameOver) {
            this.ProcessGameOver();
            return;
        }
        //hand over current turn
        this.striker.ResetStriker();
        this.ApplyTurn();
    }

    ApplyTurn() {
        if (this.mIsValidPotPending == false) {
            this.mCurrentTurnIndex = ((this.mCurrentTurnIndex + 1) % this.mCurrentPlayerPool.length);
        }

        this.mIsValidPotPending = false; // release
        //TODO,save red
        //update striker pos
        this.UpdateStrikerPos();
        //update ui
        this.UpdateUIPosition();
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

    private UpdateUIPosition() {
        //TODO
    }

    private ProcessGameOver() {

    }

    private InitializeCarromBoard() {
        this.mCurrentPawnPool.length = 0;
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
        this.mCurrentPawnPool.push(pawnComp);
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

        this.mIsValidPotPending = true;
        console.log("pawn pot" + pawn.GetId() + ", player : " + this.mCurrentTurnIndex);

    }//registerPot
}
