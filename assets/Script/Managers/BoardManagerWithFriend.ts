import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardManagerWithFriend extends cc.Component {

    mPersistentNode: PersistentNodeComponent = null;
    start() {

    }

    AttachListeners() {
        if (this.mPersistentNode == null) {
            console.error("Persistent node not found");
            return;
        }
    }
}
