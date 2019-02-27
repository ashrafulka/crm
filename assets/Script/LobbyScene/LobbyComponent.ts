import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { WSConnection } from "../LoadingScene/Connection";
import { Constants } from "../LoadingScene/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyComponent extends cc.Component {

    @property(cc.Label)
    playerNameLabel: cc.Label = null;

    mPersistentNode: PersistentNodeComponent = null;

    start() {
        this.mPersistentNode = cc.find('PersistentNode').getComponent(PersistentNodeComponent);
        this.playerNameLabel.string = "Welcome " + this.mPersistentNode.GetPlayerModel().getName();


        let wsCon = new WSConnection(Constants.HEROKU_WS_ADDR);
        wsCon.initWs();
    }
    // update (dt) {}
}
