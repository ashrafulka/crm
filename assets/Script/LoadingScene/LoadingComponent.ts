import Helper from "../Helpers/Helper";
import { Logger } from "./Logger";
import { Connection } from "./Connection";
import { Constants } from "./Constants";
import PersistentNodeComponent from "./PersistentNodeComponent";

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
    }

    start() {
        this.goToNextSceneBtn.clickEvents.push(Helper.getEventHandler(this.node, "LoadingComponent", "OnGoToNextSceneBtnClick"));

        cc.director.preloadScene('lobby');
        //Load connection, Login
        let self = this;
        let conn = new Connection(Constants.EC2_SERVER_ADDR);
        conn.sendGetRequest("/connection", function (msg: string) {
            self.mLogger.Log("login success ", msg);
            self.mPersistentNode.SaveConnection(conn);
            self.mPersistentNode.LoadPlayer();
        }, function () {
            self.mLogger.LogError("Connection ERROR");
        });
    }//start

    OnGoToNextSceneBtnClick() {
        cc.director.loadScene("lobby");
    }


    msgUpdateInterval: number = 1;
    currentTimePassed: number = 0;

    update(dt) {
        this.currentTimePassed += dt;
        if (this.currentTimePassed > this.msgUpdateInterval) {
            this.currentTimePassed = 0;
            if (this.mPersistentNode.connection == null) {
                this.labelText.string = "Connecting...please wait";
            } else if (this.mPersistentNode.mPlayer.getSignature() != "") {
                this.labelText.string = "Loggin in...";
                this.OnGoToNextSceneBtnClick();
            }
        }
    }
}
