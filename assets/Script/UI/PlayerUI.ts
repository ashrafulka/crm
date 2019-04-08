const { ccclass, property } = cc._decorator;

@ccclass("PlayerUI")
export default class PlayerUI {
    @property(cc.Node) parentNode: cc.Node = null;
    @property(cc.Label) nameLabel: cc.Label = null;
    @property(cc.Label) typeLabel: cc.Label = null;
    @property(cc.Label) timerLabel: cc.Label = null;
    @property(cc.Sprite) timerImage: cc.Sprite = null;
}