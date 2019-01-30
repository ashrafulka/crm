
export default class Helper {

    static getEventHandler(node:cc.Node, component:string, functionName:string, data?: any):cc.Component.EventHandler {
        var eHandler:cc.Component.EventHandler = new cc.Component.EventHandler();
        eHandler.target = node;
        eHandler.component = component;
        eHandler.handler = functionName;
        eHandler.customEventData = data;
        return eHandler;
    }

    static getDistance(fv:cc.Vec2, sv:cc.Vec2):number{
        return Math.sqrt( fv.x*fv.x - sv.x*sv.x + fv.y*fv.y - sv.y*sv.y);
    }
}
