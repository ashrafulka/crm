import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Constants, AllGameModes, GameEvents } from "../LoadingScene/Constants";
import { States } from "../LoadingScene/GameState";
import WaitingPanelComponent from "../UI/WaitingPanelComponent";
import { WSConnection } from "../LoadingScene/Connection";
import { Logger } from "../LoadingScene/Logger";
import BoardManager from "./BoardManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameSceneComponent extends cc.Component {

    @property(cc.Node)
    waitingPanelNode: cc.Node = null;

    @property(cc.Node)
    failedToConnectNode: cc.Node = null;

    mBoardManager: BoardManager = null;
    mPersistentNode: PersistentNodeComponent = null;
    mLogger: Logger = null;

    start() {
        this.mLogger = new Logger(this.node.name);
        this.mPersistentNode = cc.find(Constants.PERSISTENT_NODE_NAME).getComponent(PersistentNodeComponent);
        this.mBoardManager = this.node.getComponent(BoardManager);

        let entryPointData = this.mPersistentNode.GetPlayerModel().getEntryPointData();
        let gameModel = this.mPersistentNode.GetCurrentGameModel();

        if (gameModel.GetGameMode() == AllGameModes.FRIEND_1v1) {
            let self = this;
            let conn = new WSConnection(Constants.HEROKU_WS_ADDR, this.mPersistentNode);
            conn.connectWs();

            let waitForWs = setInterval(function () {
                self.mLogger.Log("waiting for web socekt connection");
                if (conn.ws.readyState == conn.ws.OPEN) {
                    console.log("WS OPEN");
                    self.mPersistentNode.SaveWS(conn);
                    if (entryPointData != null && entryPointData.room_id) { //2nd player
                        self.mLogger.Log("JOIN ROOM REQUEST");
                        conn.sendJoinRoomRequest(self.mPersistentNode.GetPlayerModel().getID(), self.mPersistentNode.GetCurrentGameModel().GetRoomID());
                    } else { //1st player
                        self.mLogger.Log("Creating new room");
                        conn.sendCreateRoomRequest(self.mPersistentNode.GetPlayerModel().getID(), self.mPersistentNode.GetCurrentGameModel().GetRoomID());
                    }
                    self.mPersistentNode.node.on(GameEvents.ROOM_CREATION_SUCCESS, self.OnRoomCreationSuccess, self);
                    self.mPersistentNode.node.on(GameEvents.ROOM_CREATION_FAILED, self.OnRoomCreationFail, self);
                    self.mPersistentNode.node.on(GameEvents.START_GAME, self.OnGameStartCall, self);
                    self.mPersistentNode.node.on(GameEvents.START_GAME_FAIL, self.OnGameStartFailed, self);
                    clearInterval(waitForWs);
                }
            }, 500);
        }

        this.InitializeWaitPanel();
    }//start

    InitializeWaitPanel() {
        let gs = this.mPersistentNode.GetGameState().GetCurrentState();
        if (gs == States.WAITING_FOR_FRIEND_TO_CONNECT) {
            let self = this;
            this.waitingPanelNode.active = true;
            this.waitingPanelNode.getComponent(WaitingPanelComponent).initialize(60, function () {
                self.waitingPanelNode.active = false;
                self.failedToConnectNode.active = true;
                console.log("end all ws connections, show failed message, go to lobby scene on button press");
            });
        }
    }

    OnRoomCreationSuccess() {
        this.mLogger.Log("room successfully created");
        //this.waitingPanelNode.active = false;
        //this.failedToConnectNode.active = false;

        this.mPersistentNode.node.off(GameEvents.ROOM_CREATION_SUCCESS, this.OnRoomCreationSuccess, this);
    }

    OnRoomCreationFail() {
        this.mLogger.LogError("Room creation failed");
        this.waitingPanelNode.active = false;
        this.failedToConnectNode.active = true;
        //room creation fail

        this.mPersistentNode.node.off(GameEvents.ROOM_CREATION_FAILED, this.OnRoomCreationFail, this);
    }

    OnGameStartCall() {
        this.mLogger.Log("YOOOO:::::Game should start now");
        this.waitingPanelNode.active = false;
        this.failedToConnectNode.active = false;
        // start game here

        this.mPersistentNode.node.off(GameEvents.START_GAME, this.OnGameStartCall, this);
    }

    OnGameStartFailed() {
        this.mLogger.LogError("YOOO:::: Game start failed ;:(");
        this.mPersistentNode.node.off(GameEvents.START_GAME_FAIL, this.OnGameStartFailed, this);
    }

}
