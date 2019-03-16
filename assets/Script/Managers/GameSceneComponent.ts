import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Constants, AllGameModes, GameEvents, ConnectionStrings } from "../LoadingScene/Constants";
import { States } from "../LoadingScene/GameState";
import WaitingPanelComponent from "../UI/WaitingPanelComponent";
import { SocketConnection } from "../LoadingScene/Connection";
import { Logger } from "../LoadingScene/Logger";
import BoardManager from "./BoardManager";
import { Player } from "../Player";
import { PawnType } from "../Pawn";

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
            let maxTryCount = Constants.MAX_RETRY_COUNT;
            let socketConn: SocketConnection = null;

            let waitForSocket = setInterval(function () {
                maxTryCount--;

                if (socketConn && socketConn.mIsConnected) {
                    clearInterval(waitForSocket);
                    return;
                }

                if (maxTryCount <= 0) {
                    self.OnServerErr({ message: "No Response from server." });
                    clearInterval(waitForSocket);
                    return;
                }

                socketConn = new SocketConnection(Constants.HEROKU_SRVR_ADDR + ConnectionStrings.FRIEND_1v1, self.mPersistentNode);
                socketConn.connectSocket();

                if (entryPointData != null && entryPointData.room_id) { //2nd player
                    self.mLogger.Log("JOIN ROOM REQUEST");
                    socketConn.sendRoomJoinRequest(self.mPersistentNode.GetPlayerModel().getID(),
                        self.mPersistentNode.GetPlayerModel().getName(),
                        self.mPersistentNode.GetCurrentGameModel().GetRoomID(),
                        self.mPersistentNode.GetCurrentGameModel().GetInitiatorID(),
                        self.mPersistentNode.GetCurrentGameModel().GetInitatorName()
                    );
                    self.mPersistentNode.node.on(GameEvents.ROOM_JOIN_SUCCESS, self.OnRoomCreationSuccess, self);
                } else { //1st player
                    self.mLogger.Log("CREATING ROOM REQUEST");
                    socketConn.sendCreateRoomRequest(self.mPersistentNode.GetPlayerModel().getID(), self.mPersistentNode.GetCurrentGameModel().GetRoomID());
                    self.mPersistentNode.node.on(GameEvents.ROOM_CREATION_SUCCESS, self.OnRoomCreationSuccess, self);
                }
                self.mPersistentNode.node.on(GameEvents.START_GAME, self.OnGameStartCall, self);
                self.mPersistentNode.node.on(GameEvents.SERVER_ERR, self.OnServerErr, self);
            }, 5000);
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
        this.mLogger.Log("ROOM CREATED SUCCESSFULLY::::::");
        //this.waitingPanelNode.active = false;
        //this.failedToConnectNode.active = false;

        this.mPersistentNode.node.off(GameEvents.ROOM_CREATION_SUCCESS, this.OnRoomCreationSuccess, this);
    }

    OnGameStartCall(body: any) {
        this.waitingPanelNode.active = false;
        this.failedToConnectNode.active = false;
        this.waitingPanelNode.getComponent(WaitingPanelComponent).clear();

        this.mBoardManager.mPlayerPool.push(new Player(body.p1_id, body.p1_name));
        this.mBoardManager.mPlayerPool.push(new Player(body.p2_id, body.p2_name));
        this.mBoardManager.InitializeCarromBoard();

        if (body.unlock_id == this.mPersistentNode.GetPlayerModel().getID()) {
            //unlock striker for this player, initiate as main player
            this.mBoardManager.Initialize1v1Players(0, 0);
        } else {
            this.mBoardManager.Initialize1v1Players(1, 0);
        }

        this.mBoardManager.ApplyTurn();
        this.mBoardManager.mPlayerPool[this.mBoardManager.mCurrentTurnIndex].SetType(PawnType.WHITE);
        this.mBoardManager.mPlayerPool[(this.mBoardManager.mCurrentTurnIndex + 1) % this.mBoardManager.mPlayerPool.length].SetType(PawnType.BLACK);

        this.mPersistentNode.node.off(GameEvents.START_GAME, this.OnGameStartCall, this);
    }

    OnServerErr(data) {
        this.mLogger.LogError("Server ERROR: " + data);
    }

}
