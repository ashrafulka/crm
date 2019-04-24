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
import { GameModel } from "../LoadingScene/GameModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameSceneComponent extends cc.Component {

    @property(cc.Button) devToolBtn: cc.Button = null;

    mDevUI: DevUI = null;
    mLogger: Logger = null;

    //Managers/crucial components
    mUIManager: GameUIManager = null;
    mBoardManager: BoardManager = null;
    mPersistentNode: PersistentNodeComponent = null;

    onLoad() {
        let pNode = cc.find(Constants.PERSISTENT_NODE_NAME);
        if (pNode) {
            this.mPersistentNode = pNode.getComponent(PersistentNodeComponent);
        } else {
            console.log("Loading Default Profile");
            this.mPersistentNode = this.node.addComponent(PersistentNodeComponent);
            this.mPersistentNode.LoadDefaultProfile();
            this.mPersistentNode.LoadDefaultGameModel();
            this.mPersistentNode.SaveNewBot("JohnDoe");
        }
    }

    start() {
        this.mLogger = new Logger(this.node.name);
        this.mBoardManager = this.node.getComponent(BoardManager);
        this.mUIManager = this.node.getComponent(GameUIManager);
        this.mDevUI = this.node.getComponent(DevUI);

        this.devToolBtn.clickEvents.push(Helper.getEventHandler(this.node, "GameSceneComponent", "OnDevToolBtnClick"));

        let gameModel = this.mPersistentNode.GetCurrentGameModel();
        this.mUIManager.ShowGenericPopup("Connecting...", "Alert");
        if (gameModel.GetGameMode() == AllGameModes.FRIEND_1v1) {
            this.Initiate1v1();
        } else if (gameModel.GetGameMode() == AllGameModes.QUICK_MATCH) {
            this.InitiateQuickBot();
        }
    }//start

    InitiateQuickBot() {
        // let unlockID = (Math.floor(Math.random() * 100) % 2 == 0) ? this.mPersistentNode.GetPlayerModel().getID() :
        //     this.mPersistentNode.GetCurrentBot().mainID;

        let unlockID = this.mPersistentNode.GetCurrentBot().mainID;
        const body = {
            p1_id: this.mPersistentNode.GetPlayerModel().getID(),
            p2_id: this.mPersistentNode.GetCurrentBot().mainID,
            p1_name: this.mPersistentNode.GetPlayerModel().getName(),
            p2_name: this.mPersistentNode.GetCurrentBot().displayName,
            unlock_id: unlockID,
        };
        this.OnGameStartCall(body);
    }//initiateBot

    Initiate1v1() {
        let entryPointData = this.mPersistentNode.GetPlayerModel().getEntryPointData();

        let self = this;
        self.mPersistentNode.node.on(GameEvents.ROOM_JOIN_SUCCESS, self.OnRoomJoinSuccess, self);
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
                self.mUIManager.ShowGenericPopup("Joining Room...Please wait...", "Alert");
                socketConn.sendRoomJoinRequest(self.mPersistentNode.GetPlayerModel().getID(),
                    self.mPersistentNode.GetPlayerModel().getName(),
                    self.mPersistentNode.GetCurrentGameModel().GetRoomID(),
                    self.mPersistentNode.GetCurrentGameModel().GetInitiatorID(),
                    self.mPersistentNode.GetCurrentGameModel().GetInitatorName()
                );
            } else { //1st player
                self.mLogger.Log("CREATING ROOM REQUEST");
                self.mUIManager.ShowGenericPopup("Creating Room...Please wait...", "Alert");
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
            this.mPersistentNode.node.off(GameEvents.ROOM_CREATION_SUCCESS, this.OnRoomCreationSuccess, this);
            this.mPersistentNode.node.off(GameEvents.ROOM_JOIN_SUCCESS, this.OnRoomJoinSuccess, this);
        } else {
            this.OnServerErr("Sorry, Server is down. We will fix it asap.");
        }
        this.SendFBRequest();
        this.mUIManager.ShowWaitPanel();
    }

    OnRoomJoinSuccess(data: any) {
        if (data.success && data.success == true) {
            this.mLogger.Log("ROOM JOINED SUCCESSFULLY::");
            this.mUIManager.ShowGenericPopup("Room Joined Successfully! Starting game...", "Alert");
            this.mPersistentNode.node.off(GameEvents.ROOM_CREATION_SUCCESS, this.OnRoomCreationSuccess, this);
            this.mPersistentNode.node.off(GameEvents.ROOM_JOIN_SUCCESS, this.OnRoomJoinSuccess, this);
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
        console.log("GAME START CALL:: ", body);
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

        this.mBoardManager.RegisterPersistentNode(this.mPersistentNode);
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

        if (this.mPersistentNode.GetCurrentGameModel().GetGameMode() == AllGameModes.FRIEND_1v1) {
            this.mBoardManager.mBMWithFriend.OnUpdateScoreCallback({
                p1_score: 0,
                p2_score: 0
            });
            this.mPersistentNode.node.off(GameEvents.START_GAME, this.OnGameStartCall, this);
        }
        this.mBoardManager.StartShotTimer();
        this.mBoardManager.ApplyTurn();
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

    SendFBRequest() {
        this.mLogger.Log("Send FB Request:: ", FBInstant.context.getID());
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
            self.mUIManager.HideAllPopups();
            self.mUIManager.ShowWaitPanel();
        }, error => {
            console.error('updateAsync() ERROR! ', error);
        });
    }

    OnServerErrorAck() {
        cc.director.loadScene(GameScenes.LOBBY);
    }

    OnDevToolBtnClick() {
        this.mDevUI.ShowPanel();
    }

}
