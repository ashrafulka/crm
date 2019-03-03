import { Logger } from "./Logger";

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
    mRegsitryURL: string = "";
    ws: WebSocket = null;

    constructor(url: string) {
        this.mRegsitryURL = url;
        this.mLogger = new Logger("WSConnection");
        this.ws = new WebSocket(this.mRegsitryURL);
    }

    initWs() {
        let self = this;
        this.ws.onopen = function (e) {
            self.mLogger.Log("Opening connection");
        };

        this.ws.onclose = function (e) {
            self.mLogger.Log("Closing connection");
        };

        this.ws.onmessage = function (e) {
            self.mLogger.Log("On Message: ", e.data);
        }
    }

    sendCreateRoomRequest(pid: string) {
        this.ws.send(JSON.stringify({
            requestType: "joinRoom",
            fbid: pid
        }));
    }

    sendJoinRoomRequest(pid: string) {
        this.ws.send(JSON.stringify({
            requestType: "joinRoom",
            fbid: pid
        }));
    }


}
