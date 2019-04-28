
const { ccclass, property } = cc._decorator;


export class BotModel {
    mainID: string = "";
    numID: number = -1;
    level: number = -1;
    displayName: string = "";
    constructor(mid: string, i: number, l: number, dn: string) {
        this.mainID = mid;
        this.numID = i;
        this.level = l;
        this.displayName = dn;
    }
}

@ccclass
export default class BotLoader extends cc.Component {

    @property(cc.JsonAsset) botList: cc.JsonAsset = null;
    mBotObjects: Array<BotModel> = [];

    onLoad() {
        let bp = this.botList.json;
        for (let index = 0; index < bp.length; index++) {
            const element = bp[index];
            this.mBotObjects.push(new BotModel(element.name, element.id, element.level, element.displayName));
        }
        console.log(this.mBotObjects);
    }

    GetRandomBot(): BotModel {
        const randIndex = Math.floor(Math.random() * this.mBotObjects.length);
        return this.mBotObjects[randIndex];
    }
}