import { PlayerModel } from "./PlayerModel";
import { Logger } from "./Logger";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PersistentNodeComponent extends cc.Component {

    mPlayer: PlayerModel = null;
    mLogger: Logger = null;

    onLoad() {
        cc.game.addPersistRootNode(this.node);
        this.mLogger = new Logger(this.node.name);
    }

    start() {
        this.mPlayer = new PlayerModel(FBInstant.player.getName(), FBInstant.player.getID());
        this.mPlayer.setPhotoURL(FBInstant.player.getPhoto());
        this.mPlayer.setContextID(FBInstant.context.getID());
        this.mPlayer.setContextType(FBInstant.context.getType());

        this.mLogger.Log("player object :", this.mPlayer);
    }//start
}