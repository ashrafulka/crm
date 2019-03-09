import { Logger } from "./Logger";
import { GameEvents, RequestTypes as RequestTypes } from "./Constants";
import PersistentNodeComponent from "./PersistentNodeComponent";

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

export class WSConnection {

    mLogger: Logger = null;
    mRegistryURL: string = "";
    ws: WebSocket = null;
    mPersistentNode: PersistentNodeComponent = null;
    isConnecting = true;
    forceClose = false;

    constructor(url: string, pn: PersistentNodeComponent) {
        this.mRegistryURL = url;
        this.mLogger = new Logger("WSConnection");
        this.mPersistentNode = pn;
    }

    forceCloseWS() {
        this.forceClose = true;
        this.ws.close();
    }

    connectWs() {
        this.isConnecting = true;
        let self = this;
        let ws = new WebSocket(this.mRegistryURL);

        ws.onopen = function (e) {
            self.isConnecting = false;
            self.mLogger.Log("Opening connection");
        };

        ws.onclose = function (e) {
            self.isConnecting = false;
            self.mLogger.Log("Closing connection");
            self.ws = null;

            if (self.forceClose == false) {
                self.retryConnection();
                let maxRetryCount = 3;
                let reconnect = setInterval(function () {
                    maxRetryCount--;
                    self.retryConnection();
                    if (maxRetryCount <= 0 || self.isConnecting == false) {
                        clearInterval(reconnect);
                    }
                }, 3000);
            }
        };
        ws.onmessage = function (e) {
            self.isConnecting = false;
            self.mLogger.Log("On Message: ", e.data);
            let jsonData = JSON.parse(e.data);

            if (!jsonData || !jsonData.body) {
                return;
            }

            self.mLogger.Log("My event type : " + jsonData.body["event_type"]);
            //console.log(jsonData.body["event_type"]);
            if (jsonData.body && jsonData.body.event_type) {
                //if (jsonData.body.event_type == GameEvents.ROOM_CREATION_SUCCESS)
                switch (jsonData.body.event_type) {
                    case GameEvents.ROOM_CREATION_SUCCESS:
                        self.mPersistentNode.node.emit(GameEvents.ROOM_CREATION_SUCCESS);
                        break;
                    case GameEvents.ROOM_CREATION_FAILED:
                        self.mPersistentNode.node.emit(GameEvents.ROOM_CREATION_FAILED);
                        break;
                    case GameEvents.START_GAME:
                        self.mPersistentNode.node.emit(GameEvents.START_GAME);
                        break;
                    case GameEvents.START_GAME_FAIL:
                        self.mPersistentNode.node.emit(GameEvents.START_GAME_FAIL);
                        break;
                    default:
                        break;
                }
            }
        }//onmessage

        ws.onerror = function (e) {
            self.isConnecting = false;
            self.mLogger.LogError("on error ", e);
        };

        this.ws = ws;
    }

    retryConnection() {
        if (this.ws && (this.ws.readyState == this.ws.CONNECTING || this.ws.readyState == this.ws.OPEN)) {
            this.mLogger.Log("Already trying to connect or connected");
            return;
        }

        this.connectWs();
    }


    updateWSToServer() {

    }//updatewstoserver

    sendCreateRoomRequest(pid: string, rid: string) {
        this.ws.send(JSON.stringify({
            request_type: RequestTypes.CREATE_ROOM,
            room_id: rid,
            fb_id: pid
        }));
        // if (this.ws.readyState == this.ws.OPEN) {

        // } else {
        //     this.retryConnection();
        // }
    }

    sendJoinRoomRequest(pid: string, rid: string) {
        this.ws.send(JSON.stringify({
            request_type: RequestTypes.JOIN_ROOM,
            room_id: rid,
            fb_id: pid
        }));

        // if (this.ws.readyState == this.ws.OPEN) {

        // } else {
        //     this.retryConnection();
        // }
    }
}
