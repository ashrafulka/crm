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


}
