import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Constants, GameScenes, AllGameModes, ConnectionStrings } from "../LoadingScene/Constants";
import Helper from "../Helpers/Helper";
import { Logger } from "../LoadingScene/Logger";
import { PlayerModel } from "../LoadingScene/PlayerModel";
import { GameModel } from "../LoadingScene/GameModel";
import { Player } from "../Player";
import { States } from "../LoadingScene/GameState";
import LobbyUIManager from "./LobbyUIManager";
import BotLoader from "../Managers/BotLoader";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyComponent extends cc.Component {

    @property(cc.Label) playerNameLabel: cc.Label = null;
    @property(cc.Button) playWithFriendBtn: cc.Button = null;
    @property(cc.Button) quickMatchBtn: cc.Button = null;

    mPersistentNode: PersistentNodeComponent = null;
    mPlayerModel: PlayerModel = null;
    mLogger: Logger = null;
    mUIManager: LobbyUIManager = null;
    mBotLoader: BotLoader = null;

    start() {
        this.mLogger = new Logger("LobbyComponent");
        this.mUIManager = this.getComponent(LobbyUIManager);
        this.mBotLoader = this.getComponent(BotLoader);

        let pNode = cc.find(Constants.PERSISTENT_NODE_NAME);
        if (pNode == null) { //default
            this.mPersistentNode = this.addComponent(PersistentNodeComponent);
            this.mPersistentNode.LoadDefaultProfile();
        } else {
            this.mPersistentNode = pNode.getComponent(PersistentNodeComponent);
        }

        this.mPlayerModel = this.mPersistentNode.GetPlayerModel();
        this.playerNameLabel.string = "Welcome " + this.mPlayerModel.getName();

        let currentEntryPointData: any = this.mPlayerModel.getEntryPointData();
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
        cc.director.preloadScene(GameScenes.GAME);

        FBInstant.context.chooseAsync().then(() => {
            let gm = new GameModel();
            gm.SetGameMode(AllGameModes.FRIEND_1v1);
            gm.SetRoomID(FBInstant.context.getID());
            this.mPersistentNode.SetCurrentGameModel(gm);
            this.mPersistentNode.GetGameState().ChangeState(States.WAITING_FOR_FRIEND_TO_CONNECT);
            cc.director.loadScene(GameScenes.GAME);
        }, function (err) {
            console.log("error : on sending invitation", err);
        });
    }

    OnQuickMatchBtnClick() {
        //load shuffle animation
        //load game scene - with (BOT context initially), save it on PersistentNodeComponent
        //console.log("quick match button clicked");
        const max = 7;
        const min = 3;

        let duration = 1;//Math.floor(Math.random() * (max - min)) + min;
        this.mUIManager.ShowQuickMatchPanel(duration,
            this.mPersistentNode.GetPlayerModel().getName(),
            this.mPersistentNode.SaveNewBot("JohnDoe").displayName);

        this.scheduleOnce(function () {
            cc.director.loadScene(GameScenes.GAME);
        }, duration + 1);
    }
    // update (dt) {}
}
