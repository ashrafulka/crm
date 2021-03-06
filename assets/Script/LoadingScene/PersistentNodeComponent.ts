import { PlayerModel } from "./PlayerModel";
import { Logger } from "./Logger";
import { ConnectionStrings, GameEvents, AllGameModes, Constants } from "./Constants";
import { GameState, States } from "./GameState";
import { GameModel } from "./GameModel";
import { Connection, SocketConnection } from "./Connection";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PersistentNodeComponent extends cc.Component {

    private mPlayer: PlayerModel = null;
    private mLogger: Logger = null;
    private connection: Connection = null;
    private mSocketConnection: SocketConnection = null;
    private mGameState: GameState = null;
    private mCurrentGameModel: GameModel = null;

    onLoad() {
        cc.game.addPersistRootNode(this.node);
        this.mLogger = new Logger(this.node.name);
        this.mGameState = new GameState();
    }

    GetGameState() {
        return this.mGameState;
    }

    SaveConnection(con: Connection) {
        this.connection = con;
    }

    GetServerConnection(): Connection {
        return this.connection;
    }

    SaveSocketConnection(con: SocketConnection) {
        this.mSocketConnection = con;
    }

    GetSocketConnection() {
        return this.mSocketConnection;
    }

    LoadAndLogin() {
        this.mPlayer = new PlayerModel(FBInstant.player.getName(), FBInstant.player.getID());
        this.mPlayer.setPhotoURL(FBInstant.player.getPhoto());
        this.mPlayer.setContextID(FBInstant.context.getID());
        this.mPlayer.setContextType(FBInstant.context.getType());
        this.mPlayer.setEntryPointData(FBInstant.getEntryPointData());

        let self = this;
        FBInstant.player.getSignedPlayerInfoAsync(Constants.SIGNED_PLAYER_ASYNC_FLAG)
            .then(function (result) {
                self.mLogger.Log("signed playerinfo success:  ", result);
                self.mPlayer.setSignature(result.getSignature());
                // The verification of the ID and signature should happen on server side.
                self.RequestLogin({ pid: result.getPlayerID(), pname: self.mPlayer.getName() });
            });
    }//LoadPlayer

    RequestLogin(obj: any) {
        let data = JSON.stringify(obj);
        let self = this;
        this.connection.sendPostRequest(ConnectionStrings.LOGIN_STR, data, function (msg: string) {
            let msgDecoded = JSON.parse(msg);
            if (msgDecoded.success && msgDecoded.success == true) {
                self.mLogger.Log("Login success: ", msg);
                self.node.emit(GameEvents.SUCCESS_LOGIN);
                self.GetGameState().ChangeState(States.LOGGED_IN);
            } else {
                self.mLogger.LogError("ERROR : LOGGIN IN : " + msg);
                self.node.emit(GameEvents.FAILED_LOGIN);
            }
        }, function (msg: string) {
            self.mLogger.LogError("ERROR loggin in : " + msg);
            self.node.emit(GameEvents.FAILED_LOGIN);
        });
    }

    GetPlayerModel(): PlayerModel {
        return this.mPlayer;
    }

    SetCurrentGameModel(gm: GameModel) {
        this.mCurrentGameModel = gm;
    }

    GetCurrentGameModel(): GameModel {
        return this.mCurrentGameModel;
    }

}