import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Constants, AllGameModes, GameEvents, ConnectionStrings, GameScenes } from "../LoadingScene/Constants";
import { States } from "../LoadingScene/GameState";
import WaitingPanelComponent from "../UI/WaitingPanelComponent";
import { SocketConnection } from "../LoadingScene/Connection";
import { Logger } from "../LoadingScene/Logger";
import BoardManager from "./BoardManager";
import { Player } from "../Player";
import { PawnType } from "../Pawn";
import DevUI from "../UI/DevUI";
import Helper from "../Helpers/Helper";
import GameUIManager from "../UI/GameUIManager";
import { GenericPopupBtnType } from "../UI/GenericPopup";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameSceneComponent extends cc.Component {

    @property(cc.Button) devToolBtn: cc.Button = null;

    mDevUI: DevUI = null;
    mLogger: Logger = null;
    mIsDebugMode: boolean = false;

    //Managers/crucial components
    mUIManager: GameUIManager = null;
    mBoardManager: BoardManager = null;
    mPersistentNode: PersistentNodeComponent = null;

    onLoad() {
        let pNode = cc.find(Constants.PERSISTENT_NODE_NAME);
        if (pNode) {
            this.mPersistentNode = pNode.getComponent(PersistentNodeComponent);
            this.mIsDebugMode = false;
        } else {
            this.mIsDebugMode = true;
        }
    }

    start() {
        this.mLogger = new Logger(this.node.name);
        this.mBoardManager = this.node.getComponent(BoardManager);
        this.mUIManager = this.node.getComponent(GameUIManager);
        this.mDevUI = this.node.getComponent(DevUI);

        this.devToolBtn.clickEvents.push(Helper.getEventHandler(this.node, "GameSceneComponent", "OnDevToolBtnClick"));

        if (this.mIsDebugMode) {
            //this.OnDebugModeRun();
            return;
        }

        let gameModel = this.mPersistentNode.GetCurrentGameModel();
        if (gameModel.GetGameMode() == AllGameModes.FRIEND_1v1) {
            this.Initiate1v1();
        }

        this.mUIManager.ShowWaitPanel();
    }//start

    Initiate1v1() {
        let entryPointData = this.mPersistentNode.GetPlayerModel().getEntryPointData();

        let self = this;
        self.mPersistentNode.node.on(GameEvents.ROOM_JOIN_SUCCESS, self.OnRoomCreationSuccess, self);
        self.mPersistentNode.node.on(GameEvents.ROOM_CREATION_SUCCESS, self.OnRoomCreationSuccess, self);
        self.mPersistentNode.node.on(GameEvents.START_GAME, self.OnGameStartCall, self);
        self.mPersistentNode.node.on(GameEvents.SERVER_ERR, self.OnServerErr, self);

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
            } else { //1st player
                self.mLogger.Log("CREATING ROOM REQUEST");
                self.mPersistentNode.GetServerConnection().sendPostRequest(
                    ConnectionStrings.ROOM_SAVE,
                    JSON.stringify({
                        room_id: self.mPersistentNode.GetCurrentGameModel().GetRoomID()
                    }),
                    function (msg: string) {
                        let jsonDecode = JSON.parse(msg);
                        if (jsonDecode.success && jsonDecode.success == true) {
                            socketConn.sendCreateRoomRequest(self.mPersistentNode.GetPlayerModel().getID(),
                                self.mPersistentNode.GetCurrentGameModel().GetRoomID());
                        } else {
                            self.OnServerErr("Sorry, Server isn't responding, Try again later.");
                        }
                    },
                    function (err) {
                        console.log("SERVER ERR ERROR::: ", err);
                        self.OnServerErr(err);
                    }
                );
            }
        }, 5000);
    }

    OnRoomCreationSuccess(data: any) {
        this.mLogger.Log("ROOM CREATION:: ", data);
        if (data.success && data.success == true) {
            this.mLogger.Log("ROOM CREATED SUCCESSFULLY::::::");
            this.mPersistentNode.node.off(GameEvents.ROOM_JOIN_SUCCESS, this.OnRoomCreationSuccess, this);
            this.mPersistentNode.node.off(GameEvents.ROOM_CREATION_SUCCESS, this.OnRoomCreationSuccess, this);
        } else {
            this.OnServerErr("Sorry, Server is down. We will fix it asap.");
        }
    }

    OnDebugModeRun() {
        this.mLogger.Log("RUNNING DEBUG MODE:::");
        this.mUIManager.HideAllPopups();

        this.mBoardManager.mIsMyShot = true;
        this.mBoardManager.mPlayerPool.push(new Player("id0", "p0")); // room master
        this.mBoardManager.mPlayerPool.push(new Player("id1", "p1")); // 2nd player
        this.mBoardManager.InitUI();
        this.mBoardManager.mBMWithFriend.OnUpdateScoreCallback({
            p1_score: 0,
            p2_score: 0
        });

        this.mBoardManager.Initialize1v1Players(0);
        this.mBoardManager.InitializeCarromBoard();

        this.mBoardManager.ApplyTurn();
        this.mBoardManager.mPlayerPool[this.mBoardManager.mCurrentTurnIndex].SetType(PawnType.WHITE);
        this.mBoardManager.mPlayerPool[(this.mBoardManager.mCurrentTurnIndex + 1) % this.mBoardManager.mPlayerPool.length].SetType(PawnType.BLACK);

    }

    OnGameStartCall(body: any) {
        this.mUIManager.HideAllPopups();

        this.mBoardManager.mPlayerPool.push(new Player(body.p1_id, body.p1_name)); // room master
        this.mBoardManager.mPlayerPool.push(new Player(body.p2_id, body.p2_name)); // 2nd player

        //unlock id is random
        if (body.unlock_id == body.p1_id) { //room master
            this.mBoardManager.mPlayerPool[0].SetType(PawnType.WHITE);
            this.mBoardManager.mPlayerPool[1].SetType(PawnType.BLACK);
        } else if (body.unlock_id == body.p2_id) {
            this.mBoardManager.mPlayerPool[1].SetType(PawnType.WHITE);
            this.mBoardManager.mPlayerPool[0].SetType(PawnType.BLACK);
        }

        if (body.unlock_id == this.mPersistentNode.GetPlayerModel().getID()) {
            this.mBoardManager.mIsMyShot = true;
            this.mBoardManager.Initialize1v1Players(0);//unlock striker for this player, initiate as main player
        } else {
            this.mBoardManager.mIsMyShot = false;
            this.mBoardManager.Initialize1v1Players(1);
        }
        this.mLogger.Log("CURRENT INDEX::", this.mBoardManager.mCurrentTurnIndex);
        this.mBoardManager.InitializeCarromBoard(); //must be initiated after isMyShot is initialized
        this.mBoardManager.InitUI();
        this.mBoardManager.mBMWithFriend.OnUpdateScoreCallback({
            p1_score: 0,
            p2_score: 0
        });
        //this.mBoardManager.OnNextTurnCallback(body.unlock_id);
        this.mBoardManager.StartShotTimer();
        this.mBoardManager.ApplyTurn();
        this.mPersistentNode.node.off(GameEvents.START_GAME, this.OnGameStartCall, this);
    }

    OnServerErr(msg) {
        this.mLogger.LogError("ERROR: " + msg);
        this.mUIManager.ShowGenericPopup(
            msg,
            "Error",
            "GameSceneComponent",
            Helper.getEventHandler(this.node, "GameSceneComponent", "OnServerErrorAck"),
            GenericPopupBtnType.NEGATIVE
        );
    }

    OnServerErrorAck() {
        cc.director.loadScene(GameScenes.LOBBY);
    }

    OnDevToolBtnClick() {
        this.mDevUI.ShowPanel();
    }

}
