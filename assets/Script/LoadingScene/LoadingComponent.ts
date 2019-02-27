import Helper from "../Helpers/Helper";
import { Logger } from "./Logger";
import { Connection, WSConnection } from "./Connection";
import { Constants, ConnectionStrings, GameEvents } from "./Constants";
import PersistentNodeComponent from "./PersistentNodeComponent";
import { States } from "./GameState";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoadingComponent extends cc.Component {

    @property(cc.Button)
    goToNextSceneBtn: cc.Button = null;

    @property(cc.Label)
    labelText: cc.Label = null;

    mLogger: Logger = null;
    mPersistentNode: PersistentNodeComponent = null;
    onLoad() {
        this.mLogger = new Logger(this.node.name);
        //this.labelText.string = "NATIVE: " + cc.sys.isNative;
        this.mPersistentNode = cc.find("PersistentNode").getComponent(PersistentNodeComponent);

        //this.node.on(GameEvents.SUCCESS_CONNECTION, this.OnConnectionComplete, this);
        this.mPersistentNode.node.on(GameEvents.SUCCESS_LOGIN, this.OnSuccessfulLogin, this);
        this.mPersistentNode.node.on(GameEvents.FAILED_LOGIN, this.OnConnectionFailed, this);
    }

    start() {
        this.goToNextSceneBtn.clickEvents.push(Helper.getEventHandler(this.node, "LoadingComponent", "OnGoToNextSceneBtnClick"));
        cc.director.preloadScene('lobby');

        this.mPersistentNode.GetGameState().ChangeState(States.PRE_LOAD);
        //Load connection, Login
        let self = this;
        let conn = new Connection(Constants.HEROKU_SRVR_ADDR);
        conn.sendGetRequest(ConnectionStrings.CONNECTION_STR, function (msg: string) {
            let msgDecoded = JSON.parse(msg);
            if (msgDecoded.success && msgDecoded.success == true) {
                self.OnConnectionComplete();
                self.mPersistentNode.SaveConnection(conn);
            } else {
                self.mLogger.LogError("Connection Error " + msg);
            }
        }, function (msg: string) {
            self.mLogger.LogError("Connection ERROR: " + msg);
        });
    }//start

    OnConnectionFailed(obj: any) {
        this.labelText.string = "Connection failed: " + obj.msg;
    }

    OnConnectionComplete() {
        this.labelText.string = "Connecting...please wait";
        this.mPersistentNode.GetGameState().ChangeState(States.LOGGING_IN);

        console.log("connecting to web socket");
        let conn2 = new WSConnection(Constants.HEROKU_WS_ADDR);
        conn2.initWs();
        //this.mPersistentNode.LoadAndLogin();
    }

    OnSuccessfulLogin() {
        this.labelText.string = "Loggin in...";
        cc.director.loadScene("lobby");
    }

    onDestroy() {
        //this.node.off(GameEvents.SUCCESS_CONNECTION, this.OnConnectionComplete, this);
        this.mPersistentNode.node.off(GameEvents.SUCCESS_LOGIN, this.OnSuccessfulLogin, this);
        this.mPersistentNode.node.off(GameEvents.FAILED_LOGIN, this.OnConnectionFailed, this);
    }


}
