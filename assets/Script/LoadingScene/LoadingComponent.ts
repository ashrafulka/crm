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

        let waitForWs = setInterval(function () {
            console.log("Connection state :" + conn2.ws.readyState);
            if (conn2.ws.readyState == conn2.ws.OPEN) {
                console.log("sending create room requsst");
                conn2.sendCreateRoomRequest(FBInstant.player.getID());
                clearInterval(waitForWs);
            }
        }, 500);

        console.log("MY DATA: ", FBInstant.context.getType(), FBInstant.getEntryPointData());

        let self = this;
        FBInstant.context.chooseAsync().then(() => {
            console.log("invitatio sent, ", FBInstant.context.getID());
            console.log("invitatio sent, ", FBInstant.context.getType());
            // Helper.logger.Log("Invite sent");
            // if (successCallback) successCallback(roomId);
            let baseImage = "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";
            FBInstant.updateAsync({
                action: 'CUSTOM',
                cta: 'Join The Fight',
                image: baseImage,
                text: 'X just invaded Y village!',
                template: 'play_turn',
                data: { myReplayData: '1010101' },
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH'
            }).then(function () {
                console.log("final invitation senttt!!!!");
                // Helper.logger.Log("Invite sent");
                // if (successCallback) successCallback(roomId);
            }, function (err) {
                console.log("err: ", err);
                // Helper.logger.Log("Invite sent failed");
                // if (errorCallback) errorCallback(roomId);
            });
        }, function (err) {
            console.log("error : on sending invitation", err);
            // Helper.logger.Log("Invite sent failed");
            // if (errorCallback) errorCallback(roomId);
        });

        // FBInstant.context
        //     .chooseAsync()
        //     .then(function () {
        //         console.log(FBInstant.context.getType());
        //         console.log("new context achieved!");
        //         // 1234567890
        //     });
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


    getDefaultImage() {
        return "";
    }


}
