
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
        return Math.sqrt( Math.pow(fv.x - sv.x, 2) + Math.pow(fv.y-sv.y,2) );
    }

    static getTouchPointOnCirlce(center:cc.Vec2, radius:number, touchPoint:cc.Vec2 ):cc.Vec2{
        let touchAngle = Helper.getAngle360( new cc.Vec2(1,0), center.sub(touchPoint));
        return new cc.Vec2(center.x + radius * Math.cos(touchAngle), center.y + radius * Math.sin(touchAngle));
    }

    static getAngle(u:cc.Vec2, v:cc.Vec2, isRadian=true):number{
        let nu = u.normalize();
        let nv = v.normalize();

        let dotProduct = nu.x * nv.x + nu.y * nv.y;
        let firstVectorLength = Math.sqrt( (nu.x * nu.x) + (nu.y * nu.y) );
        let secondVectorLength = Math.sqrt( (nv.x * nv.x) + (nv.y * nv.y) );

        let angle = Math.acos(dotProduct / (firstVectorLength * secondVectorLength));
        if (isRadian){
            return angle;
        } else {
            return cc.misc.radiansToDegrees(angle);
        }
    }

    static getAngle360(u:cc.Vec2, v:cc.Vec2, isRadian=true):number{
        let nu = u.normalize();
        let nv = v.normalize();

        //dot = x1*x2 + y1*y2      # dot product
        //det = x1*y2 - y1*x2      # determinant

        let dot = nu.x*nv.x + nu.y*nv.y;     // dot product
        let det = nu.x*nv.y - nv.x*nu.y;     // determinant
        let angle = Math.atan2(det, dot);  // atan2(y, x) or atan2(sin, cos)

        if (isRadian)
            return angle;
        else 
            return 180 - angle * 360 / (2*Math.PI);
    }
}
