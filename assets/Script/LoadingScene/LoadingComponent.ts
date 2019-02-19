import Helper from "../Helpers/Helper";
import { Logger } from "./Logger";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoadingComponent extends cc.Component {

    @property(cc.Button)
    goToNextSceneBtn: cc.Button = null;

    @property(cc.Label)
    labelText: cc.Label = null;

    mLogger: Logger = null;

    onLoad() {
        this.mLogger = new Logger(this.node.name);

        this.labelText.string = "NATIVE: " + cc.sys.isNative;
    }

    start() {
        this.goToNextSceneBtn.clickEvents.push(Helper.getEventHandler(this.node, "LoadingComponent", "OnGoToNextSceneBtnClick"));
    }//start

    OnGoToNextSceneBtnClick(event: Event) {
        cc.director.loadScene("lobby");
    }
    // update (dt) {}
}
