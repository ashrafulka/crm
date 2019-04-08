import Helper from "../Helpers/Helper";
import BoardManager from "../Managers/BoardManager";
import PawnComponent from "../Pawn";

const { ccclass, property } = cc._decorator;


export enum BarType {
    STRIKER_DENSITY = 0,
    STRIKER_FRICTION,
    STRIKER_BOUNCE,
    PAWN_DENSITY,
    PAWN_FRICTION,
    PAWN_BOUNCE
}

@ccclass
export default class DevUI extends cc.Component {

    @property(cc.Node)
    devUIPanel: cc.Node = null;

    @property(cc.Slider)
    allBars: Array<cc.Slider> = [];

    @property(cc.Label)
    allLabels: Array<cc.Label> = [];

    @property(cc.Node)
    dummyPawn: cc.Node = null;

    allProgress: Array<number> = [];

    @property([cc.Float])
    allMins: Array<number> = [];

    @property([cc.Float])
    allMax: Array<number> = [];

    @property(cc.Button)
    saveBtn: cc.Button = null;
    @property(cc.Button)
    closeBtn: cc.Button = null;
    @property(cc.Button)
    resetBtn: cc.Button = null;

    @property
    allKeys: Array<string> = [];

    mBoardManager: BoardManager = null;

    onLoad() {
        this.allKeys.push("STRIKER_DENSITY");
        this.allKeys.push("STRIKER_FRICTION");
        this.allKeys.push("STRIKER_RESTITUTION");
        this.allKeys.push("PAWN_DENSITY");
        this.allKeys.push("PAWN_FRICTION");
        this.allKeys.push("PAWN_RESTITUTION");

        this.mBoardManager = this.node.getComponent(BoardManager);
        this.saveBtn.clickEvents.push(Helper.getEventHandler(this.node, "DevUI", "OnSaveBtnClick"));
        this.closeBtn.clickEvents.push(Helper.getEventHandler(this.node, "DevUI", "OnCloseBtnClick"));
        this.resetBtn.clickEvents.push(Helper.getEventHandler(this.node, "DevUI", "OnResetBtnClick"));
        for (let i = 0; i < this.allBars.length; i++) {
            this.allBars[i].slideEvents.push(Helper.getEventHandler(this.node, "DevUI", "OnBarSlide", i));
        }
    }

    SaveData(index) {
        cc.sys.localStorage.setItem(this.allKeys[index], this.allProgress[index]);
    }//saveData

    SaveDataAll() {
        for (let i = 0; i < this.allKeys.length; i++) {
            cc.sys.localStorage.setItem(this.allKeys[i], this.allProgress[i]);
        }
    }

    LoadData(index) {
        //cc.sys.localStorage.removeItem(this.allKeys[index]);
        let data = cc.sys.localStorage.getItem(this.allKeys[index]);
        if (data != null) { //return data
            let val = parseFloat(data);
            this.allProgress[index] = val;
            this.allLabels[index].string = val.toFixed(2);
            console.log((val * 100) / (this.allMax[index] - this.allMins[index]));
            this.allBars[index].progress = (val) / (this.allMax[index] - this.allMins[index]);
        } else { //first time
            switch (index) {
                case BarType.STRIKER_DENSITY:
                    let vsd = this.mBoardManager.striker.mPhysicsComponent.density;
                    this.allProgress[index] = vsd;
                    this.allLabels[index].string = vsd.toFixed(2);
                    this.allBars[index].progress = ((this.allMax[index] - this.allMins[index])) / (vsd * 100);
                    cc.sys.localStorage.setItem(this.allKeys[index], vsd);
                    break;
                case BarType.STRIKER_FRICTION:
                    let vsf = this.mBoardManager.striker.mPhysicsComponent.friction;
                    this.allProgress[index] = vsf;
                    this.allLabels[index].string = vsf.toFixed(2);
                    this.allBars[index].progress = ((this.allMax[index] - this.allMins[index])) / (vsf * 100);
                    cc.sys.localStorage.setItem(this.allKeys[index], vsf);
                    break;
                case BarType.STRIKER_BOUNCE:
                    let vsb = this.mBoardManager.striker.mPhysicsComponent.restitution;
                    this.allProgress[index] = vsb;
                    this.allLabels[index].string = vsb.toFixed(2);
                    this.allBars[index].progress = ((this.allMax[index] - this.allMins[index])) / (vsb * 100);
                    cc.sys.localStorage.setItem(this.allKeys[index], vsb);
                    break;
                case BarType.PAWN_DENSITY:
                    let vpd = this.dummyPawn.getComponent(cc.PhysicsCircleCollider).density;
                    this.allProgress[index] = vpd;
                    this.allLabels[index].string = vpd.toFixed(2);
                    this.allBars[index].progress = ((this.allMax[index] - this.allMins[index])) / (vpd * 100);
                    cc.sys.localStorage.setItem(this.allKeys[index], vpd);
                    break;
                case BarType.PAWN_FRICTION:
                    let vpf = this.dummyPawn.getComponent(cc.PhysicsCircleCollider).friction;
                    this.allProgress[index] = vpf;
                    this.allLabels[index].string = vpf.toFixed(2);
                    this.allBars[index].progress = ((this.allMax[index] - this.allMins[index])) / (vpf * 100);
                    cc.sys.localStorage.setItem(this.allKeys[index], vpf);
                    break;
                case BarType.PAWN_BOUNCE:
                    let vpb = this.dummyPawn.getComponent(cc.PhysicsCircleCollider).restitution;
                    this.allProgress[index] = vpb;
                    this.allLabels[index].string = vpb.toFixed(2);
                    this.allBars[index].progress = ((this.allMax[index] - this.allMins[index])) / (vpb * 100);
                    cc.sys.localStorage.setItem(this.allKeys[index], vpb);
                    break;
            }
        }
    }//LoadData

    OnBarSlide(data, index) {
        let finalValue = this.allMins[index] + ((this.allMax[index] - this.allMins[index]) * this.allBars[index].progress);
        this.allLabels[index].string = finalValue.toFixed(2);
        this.allProgress[index] = finalValue;
    }

    ApplyChanges() {
        for (let i = 0; i < this.allKeys.length; i++) {
            switch (i) {
                case BarType.STRIKER_DENSITY:
                    this.mBoardManager.striker.mPhysicsComponent.density = this.allProgress[i];
                    break;
                case BarType.STRIKER_FRICTION:
                    this.mBoardManager.striker.mPhysicsComponent.friction = this.allProgress[i];
                    break;
                case BarType.STRIKER_BOUNCE:
                    this.mBoardManager.striker.mPhysicsComponent.restitution = this.allProgress[i];
                    break;
                case BarType.PAWN_DENSITY:
                    this.dummyPawn.getComponent(cc.PhysicsCircleCollider).density = this.allProgress[i];
                    break;
                case BarType.PAWN_FRICTION:
                    this.dummyPawn.getComponent(cc.PhysicsCircleCollider).friction = this.allProgress[i];
                    break;
                case BarType.PAWN_BOUNCE:
                    this.dummyPawn.getComponent(cc.PhysicsCircleCollider).restitution = this.allProgress[i];
                    break;
            }
        }
    }

    OnSaveBtnClick() {
        //console.log("save button clicked");
        this.SaveDataAll();
        this.ApplyChanges();
        this.devUIPanel.active = false;
    }

    OnCloseBtnClick() {
        //console.log("close button click");
        this.devUIPanel.active = false;
    }

    OnResetBtnClick() {
        this.mBoardManager.InitializeCarromBoard();
        this.mBoardManager.OnNextTurnCallback("");
    }

    ShowPanel() {
        for (let i = 0; i < this.allBars.length; i++) {
            this.LoadData(i);
        }
        this.devUIPanel.active = true;
    }

}
