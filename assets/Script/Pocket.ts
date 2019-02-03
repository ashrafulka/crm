const {ccclass, property} = cc._decorator;

@ccclass
export default class Pocket extends cc.Component {


    
    onCollisionEnter(other, self){
        console.log("some collision enter " + other.node.name);
    }//oncollisionenter
}
