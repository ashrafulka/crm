import GenericPopup, { GenericPopupBtnType } from "./GenericPopup";
import GameSceneComponent from "../Managers/GameSceneComponent";
import { GameScenes, Constants, AllGameModes } from "../LoadingScene/Constants";
import Helper from "../Helpers/Helper";
import PlayerUI from "./PlayerUI";
import { Player } from "../Player";
import BoardManager from "../Managers/BoardManager";
import WaitingPanelComponent from "./WaitingPanelComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameUIManager extends cc.Component {

    @property(GenericPopup) genericPopup: GenericPopup = null;
    @property(cc.Node) allPopups: Array<cc.Node> = [];
    @property(cc.Node) matchEndPopup: cc.Node = null;
    @property([PlayerUI]) playerUIList: PlayerUI[] = [];
    @property(cc.Button) matchEndOkBtn: cc.Button = null;
    @property(cc.Button) rematchBtn: cc.Button = null;
    @property(cc.Label) matchEndLabel: cc.Label = null;
    @property(cc.Label) toastLabel: cc.Label = null;
    @property(cc.Node) toastNode: cc.Node = null;
    @property(cc.Node) waitPanel: cc.Node = null;

    mPlayerList: Array<Player> = [];

    timerTracking: boolean = false;
    mCurrentRunningLabel: cc.Label = null;
    mBoardManager: BoardManager = null;

    start() {
        this.matchEndOkBtn.clickEvents.push(Helper.getEventHandler(this.node, "GameUIManager", "OnMatchEndOkBtnClick"));
    }

    ShowGenericPopup(msg: string, title: string, btnLabel?: string, btnClick?: cc.Component.EventHandler, popupType?: GenericPopupBtnType) {
        this.genericPopup.Initialize(msg, title, btnLabel ? btnLabel : null, btnClick ? btnClick : null, popupType ? popupType : null);
        this.genericPopup.node.active = true;
    }

    RegisterBoardManager(bm: BoardManager) {
        this.mBoardManager = bm;
    }

    HideGenericPopup() {
        this.genericPopup.node.active = false;
    }

    ShowWaitPanel() {
        let self = this;
        this.waitPanel.active = true;
        this.waitPanel.getComponent(WaitingPanelComponent).initialize(Constants.MAX_TIME_WAIT_IN_SEC, function () { //failed to connect
            self.waitPanel.active = false;
            self.waitPanel.getComponent(WaitingPanelComponent).clear();
            self.ShowGenericPopup(
                "Failed to connect to server. Sorry for the inconveniences. We will fix it asap.",
                "Error",
                "Go Back",
                Helper.getEventHandler(self.node, "GameSceneComponent", "OnServerErrorAck"),
                GenericPopupBtnType.NEGATIVE
            );
        });
    }

    HideWaitPanel() {
        this.waitPanel.active = false;
        this.waitPanel.getComponent(WaitingPanelComponent).clear();
    }

    //show match end popup
    ShowMatchEndPopup(isWin: boolean) {
        this.matchEndPopup.active = true;
        if (isWin) {
            this.matchEndLabel.string = "You win!";
        } else {
            this.matchEndLabel.string = "You loose!";
        }
    }

    HideAllPopups() {
        for (let index = 0; index < this.allPopups.length; index++) {
            const element = this.allPopups[index];
            element.active = false;
        }

        this.HideWaitPanel();
        this.genericPopup.node.active = false;
    }

    OnMatchEndOkBtnClick() {
        //mach end call goes to gamescene component
        cc.director.loadScene(GameScenes.LOBBY);
    }

    OnRematchBtnClick() {
        //Re-match
        console.log("Re-match button click");
    }

    InitializePlayerNodes(p0: Player, p1: Player) { // this serial will be put by board manager, 0=me, 1 = other player
        this.mPlayerList.length = 0;
        this.mPlayerList.push(p0);
        this.mPlayerList.push(p1);

        this.playerUIList[0].nameLabel.string = this.mPlayerList[0].GetName();
        this.playerUIList[0].typeLabel.string = this.mPlayerList[0].GetCurrentPawnTypeString();
        this.playerUIList[0].timerLabel.string = "00";

        this.playerUIList[1].nameLabel.string = this.mPlayerList[1].GetName();
        this.playerUIList[1].typeLabel.string = this.mPlayerList[1].GetCurrentPawnTypeString();
        this.playerUIList[1].timerLabel.string = "00";
    }

    UpdateScore() {
        this.playerUIList[0].nameLabel.string = this.mPlayerList[0].GetName() + " : " + this.mPlayerList[0].GetScore();
        this.playerUIList[1].nameLabel.string = this.mPlayerList[1].GetName() + " : " + this.mPlayerList[1].GetScore();
    }

    ShowToast(duration: number, msg: string) {
        //console.log("showing toast::");
        this.toastLabel.string = msg;
        this.toastNode.stopAllActions();
        this.toastNode.active = true;
        this.toastNode.setScale(0);

        let firstScale = cc.scaleTo(duration / 3, 1);
        let delay = cc.delayTime(duration / 2);
        let lastScale = cc.scaleTo(duration / 6, 0);

        this.toastNode.stopAllActions();
        this.toastNode.runAction(cc.sequence(firstScale, delay, lastScale));
    }

    InitTimer(shooterID: string) {
        //console.log("Initializing timer");
        if (shooterID == this.mPlayerList[0].GetID()) {//myshot
            this.playerUIList[0].timerImage.node.active = true;
            this.mCurrentRunningLabel = this.playerUIList[0].timerLabel;

            this.playerUIList[1].timerImage.node.active = false;
        } else { // opponent shot
            this.playerUIList[1].timerImage.node.active = true;
            this.mCurrentRunningLabel = this.playerUIList[1].timerLabel;

            this.playerUIList[0].timerImage.node.active = false;
        }

        this.mCurrentRunningLabel.string = Constants.MAX_TIME_WAIT_PER_SHOT + "s";
        this.timerTracking = true;
        this.totalSec = 0;
    }

    StopTimer() {
        this.timerTracking = false;
        this.totalSec = 0;
    }

    totalSec: number = 0;
    update(dt) {
        if (this.timerTracking) {
            this.totalSec += dt;
            let timeRemain = Constants.MAX_TIME_WAIT_PER_SHOT - Math.floor(this.totalSec);
            this.mCurrentRunningLabel.string = timeRemain < 0 ? "0" : timeRemain.toString();
            if (timeRemain <= 0) {
                this.timerTracking = false;
                if (this.mBoardManager.currentGameMode == AllGameModes.FRIEND_1v1) {
                    this.mBoardManager.mBMWithFriend.SendTimeOutRequest();
                } else if (this.mBoardManager.currentGameMode == AllGameModes.QUICK_MATCH) {
                    this.mBoardManager.mIsValidPotPending = false; // is it foul??
                    this.mBoardManager.TakeNextTurn();
                }
            }
        } else {
            this.totalSec = 0;
        }
    }
}
