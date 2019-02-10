import Pawn, { PawnType } from "./../Pawn";
import { Player } from "../Player";

const { ccclass, property } = cc._decorator;

export enum GAME_TYPE {
    CARROM = 0,
    RANDOM
}

@ccclass
export default class BoardManager extends cc.Component {

    @property(cc.Node)
    pawnHolder: cc.Node = null;

    @property(cc.Node)
    pockets: Array<cc.Node> = [];

    @property(cc.Prefab)
    pawnPrefab: cc.Prefab = null;

    mCurrentPawnPool: Array<Pawn> = [];
    mCurrentPlayerPool: Array<Player> = [];

    start() {
        this.mCurrentPawnPool.length = 0; //reset
        this.initialize(GAME_TYPE.CARROM); //it should be called from persistent component

    }

    initialize(gameType: GAME_TYPE) {
        switch (gameType) {
            case GAME_TYPE.CARROM:
                this.initializeCarromBoard();
                break;
            case GAME_TYPE.RANDOM:
                this.initializeRandomBoard();
                break;
        }
    }

    initializePlayers() {
        //coming from server -> persistent object
        this.mCurrentPlayerPool.length = 0;

        this.mCurrentPlayerPool.push(new Player("player0", "Jashim"));
        this.mCurrentPlayerPool.push(new Player("player1", "Kyle"));
    }

    applyTurn() {

    }

    private initializeCarromBoard() {
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
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < currentHighestCol; col++) {
                if (row + col > 0) { //skipping first pawn, its already created
                    pawnNode = cc.instantiate(this.pawnPrefab);
                }
                pawnNode.setPosition(startPos);
                this.addToPawnPool(pawnNode);
                this.convertPawnTo(pawnNode, (row == 2 && col == 2) ? 0 : currentType);

                if (row != 2) { // adding counter pawn
                    pawnNode = cc.instantiate(this.pawnPrefab);
                    pawnNode.setPosition(new cc.Vec2(startPos.x, -startPos.y));

                    this.addToPawnPool(pawnNode);
                    this.convertPawnTo(pawnNode, currentType);
                }

                if (toggleThreshold <= 0) {
                    currentType = this.togglePawnType(currentType);
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

        console.log("total pawns " + this.mCurrentPawnPool.length);
    }

    private togglePawnType(ct: number) {
        if (ct == 1) {
            return 2;
        } else if (ct == 2) {
            return 1;
        }
        return 0;
    }

    private addToPawnPool(pawn: cc.Node) {
        let pawnComp = pawn.getComponent(Pawn);
        this.mCurrentPawnPool.push(pawnComp);
        pawn.setParent(this.pawnHolder);
    }

    private convertPawnTo(pn: cc.Node, pt: number) {
        let pawn = pn.getComponent(Pawn);
        switch (pt) {
            case 0:
                pawn.convert(PawnType.RED);
                break;
            case 1:
                pawn.convert(PawnType.BLACK);
                break;
            case 2:
                pawn.convert(PawnType.WHITE);
                break;
        }
    }

    private initializeRandomBoard() {
        console.log("initializing Random board");

    }

    registerPot(pawn: Pawn) {

    }//registerPot
}
