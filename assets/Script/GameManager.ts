import BoardManager, { GAME_TYPE } from "./BoardManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    mBoardManager:BoardManager = null;

    start () {
        this.mBoardManager = this.getComponent(BoardManager);
        
        this.mBoardManager.initialize(GAME_TYPE.CARROM); // TODO , will come from lobby
    }//start



}
