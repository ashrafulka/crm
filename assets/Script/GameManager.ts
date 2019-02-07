import BoardManager, { GAME_TYPE } from "./BoardManager";
import Pawn from "./Pawn";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    mBoardManager: BoardManager = null;

    start() {
        this.mBoardManager = this.getComponent(BoardManager);

    }//start


    registerPot(pawn: Pawn) {

    }
}
