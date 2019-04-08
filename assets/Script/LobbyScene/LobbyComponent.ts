import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Constants, GameScenes, AllGameModes, ConnectionStrings } from "../LoadingScene/Constants";
import Helper from "../Helpers/Helper";
import { Logger } from "../LoadingScene/Logger";
import { PlayerModel } from "../LoadingScene/PlayerModel";
import { GameModel } from "../LoadingScene/GameModel";
import { Player } from "../Player";
import { States } from "../LoadingScene/GameState";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyComponent extends cc.Component {

    @property(cc.Label)
    playerNameLabel: cc.Label = null;
    @property(cc.Button)
    playWithFriendBtn: cc.Button = null;
    @property(cc.Button)
    quickMatchBtn: cc.Button = null;

    mPersistentNode: PersistentNodeComponent = null;
    mPlayerModel: PlayerModel = null;
    mLogger: Logger = null;


    start() {
        this.mLogger = new Logger("LobbyComponent");
        this.mPersistentNode = cc.find('PersistentNode').getComponent(PersistentNodeComponent);
        this.mPlayerModel = this.mPersistentNode.GetPlayerModel();
        this.playerNameLabel.string = "Welcome " + this.mPlayerModel.getName();

        let currentEntryPointData: any = this.mPlayerModel.getEntryPointData();
        console.log("current entry point data : ", currentEntryPointData);
        if (currentEntryPointData != null && currentEntryPointData.room_id && currentEntryPointData.room_id != "") {
            //CHECK TIMER, date
            const createdDate = new Date(currentEntryPointData.date);
            const diffInSec = (Date.now() - createdDate.getTime()) / 1000;

            if (diffInSec < Constants.MAX_TIME_WAIT_IN_SEC) {
                this.mLogger.Log("Context id found:::" + currentEntryPointData.context_id);
                let gm = new GameModel();
                gm.SetGameMode(AllGameModes.FRIEND_1v1);
                gm.SetRoomID(currentEntryPointData.room_id);
                gm.SetInitiator(currentEntryPointData.sender_id, currentEntryPointData.sender_name);
                this.mPersistentNode.SetCurrentGameModel(gm);
                cc.director.loadScene(GameScenes.GAME);
            } else {
                //make sure user not selected an old context to play new match
                this.mLogger.Log("MAKING SURE PREVIOUS ID NOT SELECTED");
                let self = this;
                const conn = this.mPersistentNode.GetServerConnection();
                const data = JSON.stringify({
                    room_to_check: currentEntryPointData.room_id
                });

                conn.sendPostRequest(ConnectionStrings.ROOM_TIME_CHECK, data, function (msg: string) {
                    console.log("ROOM TIEM CHECK MSG::: ", msg);
                    let msgDecode = JSON.parse(msg);
                    if (msgDecode.success && msgDecode.success == true) {
                        self.mLogger.Log("Context id found:::" + currentEntryPointData.context_id);
                        let gm = new GameModel();
                        gm.SetGameMode(AllGameModes.FRIEND_1v1);
                        gm.SetRoomID(currentEntryPointData.room_id);
                        gm.SetInitiator(currentEntryPointData.sender_id, currentEntryPointData.sender_name);
                        self.mPersistentNode.SetCurrentGameModel(gm);
                        cc.director.loadScene(GameScenes.GAME);
                    }
                });
                //console.error(":::CONTEXT TIME MAXED OUT:::");
            }
        } else {
            this.InitButtons();
        }
    }

    InitButtons() {
        this.playWithFriendBtn.clickEvents.push(Helper.getEventHandler(this.node, "LobbyComponent", "OnPlayWithFriendsBtnClick"));
        this.quickMatchBtn.clickEvents.push(Helper.getEventHandler(this.node, "LobbyComponent", "OnQuickMatchBtnClick"));
    }

    OnPlayWithFriendsBtnClick() {
        console.log("play with friends button clicked");
        cc.director.preloadScene(GameScenes.GAME);

        FBInstant.context.chooseAsync().then(() => {

            let cid = FBInstant.context.getID();
            let cType = FBInstant.context.getType();
            let pName = this.mPersistentNode.GetPlayerModel().getName();
            let pid = this.mPersistentNode.GetPlayerModel().getID();
            let self = this;
            let dateNow = Date.now();

            let baseImage = "data:image/png;base64,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";
            FBInstant.updateAsync({
                action: 'CUSTOM',
                cta: 'Play Now!',
                image: baseImage,
                text: pName + ' wants to play carrom with you!',
                template: 'play_turn',
                data: { context_id: cid, context_type: cType, room_id: cid, sender_id: pid, date: dateNow, sender_name: pName },
                strategy: 'IMMEDIATE',
                notification: 'PUSH'
            }).then(() => {
                console.log('updateAsync() success!');
                let gm = new GameModel();
                gm.SetGameMode(AllGameModes.FRIEND_1v1);
                gm.SetRoomID(cid);
                self.mPersistentNode.SetCurrentGameModel(gm);
                self.mPersistentNode.GetGameState().ChangeState(States.WAITING_FOR_FRIEND_TO_CONNECT);
                cc.director.loadScene(GameScenes.GAME);
            }, error => {
                console.error('updateAsync() ERROR! ', error);
            });
        }, function (err) {
            console.log("error : on sending invitation", err);
        });
    }


    OnQuickMatchBtnClick() {
        //load shuffle animation
        //load game scene - with (BOT context initially), save it on PersistentNodeComponent
        console.log("quick match button clicked");
    }
    // update (dt) {}
}
