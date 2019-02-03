
const {ccclass, property} = cc._decorator;

@ccclass
export default class BoardManager extends cc.Component {

    @property(cc.Node)
    pockets:Array<cc.Node> = [];

    pocketColliders:Array<cc.CircleCollider> =  [];
    
    start () {

        for(let i=0;i<this.pockets.length;i++){
            this.pocketColliders[i] = this.pockets[i].getComponent(cc.CircleCollider); 
        }
    }//start
}
