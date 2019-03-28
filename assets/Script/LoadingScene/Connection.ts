import { Logger } from "./Logger";
import { GameEvents, RequestTypes as RequestTypes, Constants } from "./Constants";
import PersistentNodeComponent from "./PersistentNodeComponent";
import { socket } from "../SocketIO/socket.io";

export class Connection {
    private _mainUrl: string = "";
    private _webSocket: WebSocket = null;
    private _logger: Logger = null;

    constructor(conURL: string) {
        this._mainUrl = conURL;
        this._logger = new Logger("Connection");
    }

    sendGetRequest(endPoint: string, onSuccess: Function, onFailure?: Function) {
        let self = this;
        let xmlRequest = new XMLHttpRequest(); //TODO make ActiveXObject for IE and Edge
        xmlRequest.open("GET", this._mainUrl + endPoint);
        //xmlRequest.withCredentials = true;
        xmlRequest.setRequestHeader('Content-type', 'text/plain');
        xmlRequest.onreadystatechange = function () {
            if (xmlRequest.readyState == 4) {
                if (xmlRequest.status == 200) {
                    self._logger.Log("get request send successful");
                    onSuccess(xmlRequest.response);
                } else {
                    self._logger.Log("Invalid status : " + xmlRequest.status);
                    if (onFailure) onFailure(xmlRequest.response);
                }
            } else if (xmlRequest.readyState <= 0) {
                self._logger.Log("Invalid state: " + xmlRequest.readyState);
            }
        };

        xmlRequest.onerror = function () {
            if (onFailure) {
                onFailure("Error sending GET request ");
            }
        };

        xmlRequest.send();
    }

    sendPostRequest(endPoint: string, data: string, onSuccess: Function, onFailure?: Function) {
        let self = this;
        let xmlRequest = new XMLHttpRequest();
        xmlRequest.open("POST", this._mainUrl + endPoint);
        xmlRequest.setRequestHeader('Content-type', 'application/json');
        xmlRequest.onreadystatechange = function () {
            if (xmlRequest.readyState == 4) {
                if (xmlRequest.status == 200) {
                    self._logger.Log("Post Request successfull::");
                    onSuccess(xmlRequest.response);
                } else {
                    self._logger.Log("Invalid status : " + xmlRequest.status);
                    if (onFailure) onFailure(xmlRequest.response);
                }
            } else if (xmlRequest.readyState <= 0) {
                self._logger.Log("Invalid state: " + xmlRequest.readyState);
            }
        };

        xmlRequest.onerror = function () {
            if (onFailure) {
                onFailure("Error sending GET request ");
            }
        };

        xmlRequest.send(data); //TODO, data encryption
    }
}

export class SocketConnection {

    mLogger: Logger = null;
    mRegistryURL: string = "";
    mySocket = null;
    mPersistentNode: PersistentNodeComponent;
    mIsConnected: boolean = false;

    constructor(url: string, pn: PersistentNodeComponent) {
        this.mRegistryURL = url;
        this.mLogger = new Logger("SocketConnection");
        this.mPersistentNode = pn;
        this.mIsConnected = false;
    }

    retryConnection() {
        if (this.mIsConnected) {
            this.mLogger.Log("already connected");
            return;
        }
        this.connectSocket();
    }

    connectSocket() {
        let self = this;
        let socket = io.connect(this.mRegistryURL);
        this.mLogger.Log("Socket initialized");

        socket.on('connected', function (data) {
            self.mIsConnected = true;
            self.mPersistentNode.SaveSocketConnection(self);
            //let jsonData = JSON.parse(data);
            if (data.success) {
                self.mLogger.Log("SOCKET CONNECTED ", data);
            }
        });

        socket.on(GameEvents.ROOM_CREATION_SUCCESS, function (data) {
            self.mLogger.Log("room created ", data);
            self.mPersistentNode.node.emit(GameEvents.ROOM_CREATION_SUCCESS);
        });

        socket.on(GameEvents.ROOM_JOIN_SUCCESS, function (data) {
            self.mLogger.Log("room joined ", data);
            self.mPersistentNode.node.emit(GameEvents.ROOM_JOIN_SUCCESS);
        });

        socket.on(GameEvents.START_GAME, function (data) {
            self.mLogger.Log("start game call", data);
            self.mPersistentNode.node.emit(GameEvents.START_GAME, data.body);
        });

        socket.on(GameEvents.SERVER_ERR, function (data) {
            self.mLogger.LogError("game fail", data);
            self.mPersistentNode.node.emit(GameEvents.SERVER_ERR, data);
        });

        socket.on(GameEvents.TAKE_SHOT, function (data) {
            self.mLogger.Log("taking shottt:::: ", data);
            self.mPersistentNode.node.emit(GameEvents.TAKE_SHOT, data.body);
        });

        socket.on(GameEvents.UPDATE_TURN, function (data) {
            self.mLogger.Log("updating turn:::: ", data);
            self.mPersistentNode.node.emit(GameEvents.UPDATE_TURN, data.body.next_turn_id);
        });

        socket.on(GameEvents.UPDATE_SCORE, function (data) {
            self.mLogger.Log("update:::score:::: ", data);
            self.mPersistentNode.node.emit(GameEvents.UPDATE_SCORE, data.body);
        });

        socket.on(GameEvents.SYNC_PAWNS, function (data) {
            //self.mLogger.Log("sycing pawns::: ", data);
            self.mPersistentNode.node.emit(GameEvents.SYNC_PAWNS, data.body);
        });

        this.mySocket = socket;
        this.mPersistentNode.SaveSocketConnection(this.mySocket);
    }

    sendRoomJoinRequest(pid: string, pName: string, rid: string, initiatorID: string, rmMasterName: string) {
        if (!this.mySocket)
            return;

        this.mySocket.emit(RequestTypes.JOIN_ROOM, {
            request_type: RequestTypes.JOIN_ROOM,
            room_id: rid,
            player_id: pid,
            player_name: pName,
            room_master_id: initiatorID,
            room_master_name: rmMasterName
        });
    }

    sendCreateRoomRequest(pid: string, rid: string) {
        if (!this.mySocket)
            return;

        this.mySocket.emit(RequestTypes.CREATE_ROOM, {
            request_type: RequestTypes.CREATE_ROOM,
            room_id: rid,
            player_id: pid
        });
    }

    sendNewShotRequest(fVector: cc.Vec2, magnitude: number) {
        if (!this.mySocket) {
            this.mLogger.LogError("web socket isnt added");
            return;
        }

        this.mySocket.emit(RequestTypes.NEW_SHOT, {
            request_type: RequestTypes.NEW_SHOT,
            room_id: this.mPersistentNode.GetCurrentGameModel().GetRoomID(),
            player_id: this.mPersistentNode.GetPlayerModel().getID(),
            force_x: fVector.x,
            force_y: fVector.y,
            mag: magnitude
        });
    }

    sendNextTurnUpdate(id: string) {
        if (!this.mySocket) {
            this.mLogger.LogError("web socket isnt added, failed request : sendNextTurnUpdate");
            return;
        }

        console.log("requesting next turn");
        this.mySocket.emit(RequestTypes.REQUEST_TURN, {
            request_type: RequestTypes.REQUEST_TURN,
            room_id: this.mPersistentNode.GetCurrentGameModel().GetRoomID(),
            player_id: this.mPersistentNode.GetPlayerModel().getID(),
            next_turn_id: id
        });
    }

    sendScoreUpdate(p1ScoreUpdate: number, p1id: string, p2ScoreUpdate: number, p2id: string) {
        if (!this.mySocket) {
            this.mLogger.LogError("web socket isnt added, failed request : sendNextTurnUpdate");
            return;
        }

        this.mySocket.emit(RequestTypes.UPDATE_SCORE, {
            request_type: RequestTypes.UPDATE_SCORE,
            room_id: this.mPersistentNode.GetCurrentGameModel().GetRoomID(),
            p1_id: p1id,
            p2_id: p2id,
            p1_score: p1ScoreUpdate,
            p2_score: p2ScoreUpdate
        });
    }

    sendPawnInfo(pawninfo: any) {
        if (!this.mySocket) {
            this.mLogger.LogError("web socket isnt added, failed request : sendNextTurnUpdate");
            return;
        }

        let finalJSON = pawninfo;
        finalJSON.request_type = RequestTypes.SYNC_PAWN_INFO;
        finalJSON.room_id = this.mPersistentNode.GetCurrentGameModel().GetRoomID();
        this.mySocket.emit(RequestTypes.SYNC_PAWN_INFO, finalJSON);
    }

}

// export class WSConnection {

//     mLogger: Logger = null;
//     mRegistryURL: string = "";
//     ws: WebSocket = null;
//     mPersistentNode: PersistentNodeComponent = null;
//     isConnecting = true;
//     forceClose = false;

//     constructor(url: string, pn: PersistentNodeComponent) {
//         this.mRegistryURL = url;
//         this.mLogger = new Logger("WSConnection");
//         this.mPersistentNode = pn;
//     }

//     forceCloseWS() {
//         this.forceClose = true;
//         this.ws.close();
//     }

//     connectWs() {
//         this.isConnecting = true;
//         let self = this;
//         let ws = new WebSocket(this.mRegistryURL);

//         ws.onopen = function (e) {
//             self.isConnecting = false;
//             self.mLogger.Log("Opening connection");
//         };

//         ws.onclose = function (e) {
//             self.isConnecting = false;
//             self.mLogger.Log("Closing connection");
//             self.ws = null;

//             if (self.forceClose == false) {
//                 self.retryConnection();
//                 let maxRetryCount = 3;
//                 let reconnect = setInterval(function () {
//                     maxRetryCount--;
//                     self.retryConnection();
//                     if (maxRetryCount <= 0 || self.isConnecting == false) {
//                         clearInterval(reconnect);
//                     }
//                 }, 3000);
//             }
//         };
//         ws.onmessage = function (e) {
//             self.isConnecting = false;
//             self.mLogger.Log("On Message: ", e.data);
//             let jsonData = JSON.parse(e.data);

//             if (!jsonData || !jsonData.body) {
//                 return;
//             }

//             self.mLogger.Log("My event type : " + jsonData.body["event_type"]);
//             //console.log(jsonData.body["event_type"]);
//             if (jsonData.body && jsonData.body.event_type) {
//                 //if (jsonData.body.event_type == GameEvents.ROOM_CREATION_SUCCESS)
//                 switch (jsonData.body.event_type) {
//                     case GameEvents.ROOM_CREATION_SUCCESS:
//                         self.mPersistentNode.node.emit(GameEvents.ROOM_CREATION_SUCCESS);
//                         break;
//                     case GameEvents.START_GAME:
//                         self.mPersistentNode.node.emit(GameEvents.START_GAME);
//                         break;
//                     case GameEvents.SERVER_ERR:
//                         self.mPersistentNode.node.emit(GameEvents.SERVER_ERR);
//                         break;
//                     default:
//                         break;
//                 }
//             }
//         }//onmessage

//         ws.onerror = function (e) {
//             self.isConnecting = false;
//             self.mLogger.LogError("on error ", e);
//         };

//         this.ws = ws;
//     }

//     retryConnection() {
//         if (this.ws && (this.ws.readyState == this.ws.CONNECTING || this.ws.readyState == this.ws.OPEN)) {
//             this.mLogger.Log("Already trying to connect or connected");
//             return;
//         }

//         this.connectWs();
//     }


//     updateWSToServer() {

//     }//updatewstoserver

//     sendCreateRoomRequest(pid: string, rid: string) {
//         this.ws.send(JSON.stringify({
//             request_type: RequestTypes.CREATE_ROOM,
//             room_id: rid,
//             fb_id: pid
//         }));
//         // if (this.ws.readyState == this.ws.OPEN) {

//         // } else {
//         //     this.retryConnection();
//         // }
//     }

//     sendJoinRoomRequest(pid: string, rid: string) {
//         this.ws.send(JSON.stringify({
//             request_type: RequestTypes.JOIN_ROOM,
//             room_id: rid,
//             fb_id: pid
//         }));

//         // if (this.ws.readyState == this.ws.OPEN) {

//         // } else {
//         //     this.retryConnection();
//         // }
//     }
// }