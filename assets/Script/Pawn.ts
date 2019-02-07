export enum PawnType {
    RED = 0,
    BLACK = 1,
    WHITE = 2
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class Pawn extends cc.Component {

    @property({ type: cc.Enum(PawnType) })
    pawnType: PawnType = PawnType.BLACK;

    @property(cc.SpriteFrame)
    redSpriteFrame: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    blackSpriteFrame: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    whiteSpriteFrame: cc.SpriteFrame = null;

    start() {
        //this.init(this.pawnType);
    }

    init(pawnType: PawnType) {
        switch (pawnType) {
            case PawnType.BLACK:
                this.getComponent(cc.Sprite).spriteFrame = this.blackSpriteFrame;
                break;
            case PawnType.RED:
                this.getComponent(cc.Sprite).spriteFrame = this.redSpriteFrame;
                break;
            case PawnType.WHITE:
                this.getComponent(cc.Sprite).spriteFrame = this.whiteSpriteFrame;
                break;
        }
    }

    convert(pawnType: PawnType) {
        this.pawnType = pawnType;
        this.init(this.pawnType);
    }

    deactiveAfter(duration: number) {
        var self = this;
        this.scheduleOnce(function () {
            self.node.active = false;
        }, duration);
    }
}
