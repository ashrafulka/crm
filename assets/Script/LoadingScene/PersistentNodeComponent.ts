import { PlayerModel } from "./PlayerModel";
import { Logger } from "./Logger";
import { Connection } from "./Connection";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PersistentNodeComponent extends cc.Component {

    mPlayer: PlayerModel = null;
    mLogger: Logger = null;

    connection: Connection = null;

    onLoad() {
        cc.game.addPersistRootNode(this.node);
        this.mLogger = new Logger(this.node.name);
    }

    start() {
        this.LoadPlayer();
    }//start

    SaveConnection(con: Connection) {
        this.connection = con;
    }

    LoadPlayer() {
        this.mPlayer = new PlayerModel(FBInstant.player.getName(), FBInstant.player.getID());
        this.mPlayer.setPhotoURL(FBInstant.player.getPhoto());
        this.mPlayer.setContextID(FBInstant.context.getID());
        this.mPlayer.setContextType(FBInstant.context.getType());

        let self = this;
        FBInstant.player.getSignedPlayerInfoAsync('meta-data')
            .then(function (result) {
                self.mLogger.Log("signed playerinfo success:  ", result);
                // The verification of the ID and signature should happen on server side.
                self.RequestLogin({
                    PLAYER_ID: result.getPlayerID(),
                    PLAYER_SIGNATURE: result.getSignature()
                });
            });
    }//LoadPlayer

    RequestLogin(obj: any) {
        let pid = obj.PLAYER_ID;
        let signature = obj.PLAYER_SIGNATURE;

        // this.mLogger.Log("requesting login ", pid);
        // this.mLogger.Log("requesting login ", signature);

        let data = JSON.stringify({ "PLAYER_ID": pid, "PLAYER_SIGNATURE": signature });
        let self = this;
        this.connection.sendPostRequest("/login", data, function (msg: string) {
            self.mLogger.Log("Login success: ", msg);

            self.mLogger.Log("pid: ", pid);
            self.mLogger.Log("pid: ", self.mPlayer.getID());

            if (pid == self.mPlayer.getID()) {
                self.mLogger.Log("PERFECT MATCH!!");
            }
            self.mPlayer.setSignature(signature);
        })
    }



}