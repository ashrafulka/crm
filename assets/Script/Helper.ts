
export default class Helper {

    static getEventHandler(node:cc.Node, component:string, functionName:string, data?: any):cc.Component.EventHandler {
        var eHandler:cc.Component.EventHandler = new cc.Component.EventHandler();
        eHandler.target = node;
        eHandler.component = component;
        eHandler.handler = functionName;
        eHandler.customEventData = data;
        return eHandler;
    }
}
