import Pawn from "./Pawn";

const {ccclass, property} = cc._decorator;

export enum GAME_TYPE {
    CARROM = 0,
    RANDOM
}

@ccclass
export default class BoardManager extends cc.Component {

    @property(cc.Node)
    midPoint:cc.Node;

    @property(cc.Node)
    pawnHolder:cc.Node;

    @property(cc.Node)
    pockets:Array<cc.Node> = [];

    @property(cc.Node)
    pawnPositions:Array<cc.Node> = [];

    mCurrentPawnPool:Array<Pawn> = [];
    
    start () {
        this.mCurrentPawnPool.length = 0; //reset
    }

    initialize(gameType:GAME_TYPE){
        switch (gameType){
            case GAME_TYPE.CARROM:
                this.initializeCarromBoard();
            break;
            case GAME_TYPE.RANDOM:
                this.initializeRandomBoard();
            break;
        }
    }

    private initializeCarromBoard(){
        console.log("initializing carrom board");
        

    }

    private initializeRandomBoard(){
        console.log("initializing Random board");

    }

    private addPawnAt(pos:cc.Vec2){

    }
}
