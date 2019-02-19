import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyComponent extends cc.Component {

    start() {
        let persistentNode = cc.find('PersistentNode').getComponent(PersistentNodeComponent);

        console.log("lobbyComponent start");
        persistentNode.getMessage();
    }

    // update (dt) {}
}
