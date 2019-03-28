import { Player } from "./Player";
import BoardManager from "./Managers/BoardManager";
import Helper from "./Helpers/Helper";

export enum PawnType {
    NONE = 99,
    RED = 0,
    BLACK = 1,
    WHITE = 2
}

export enum PocketType {
    LEFT_TOP = 0,
    LEFT_BOT,
    RIGHT_TOP,
    RIGHT_BOT
}


const { ccclass, property } = cc._decorator;

@ccclass
export default class PawnComponent extends cc.Component {

    @property({ type: cc.Enum(PawnType) })
    pawnType: PawnType = PawnType.BLACK;

    @property(cc.SpriteFrame)
    redSpriteFrame: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    blackSpriteFrame: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    whiteSpriteFrame: cc.SpriteFrame = null;

    @property
    mXPotCheckDistance: number = 60;
    @property
    mYPotCheckDistance: number = 220;

    @property
    mMinimumPotDistanceCheck: number = 0;

    mId: number = -1;
    mPotPlayer: Player = null;
    mIsPotted: boolean = false;
    mRigidBody: cc.RigidBody = null;
    mPhysicsCollider: cc.PhysicsCircleCollider = null;
    mBoardManager: BoardManager = null;

    mAllPocketPositions: Array<cc.Vec2> = [];

    onLoad() {
        this.mRigidBody = this.getComponent(cc.RigidBody);
        this.mPhysicsCollider = this.getComponent(cc.PhysicsCircleCollider);
    }

    SetId(id: number) {
        this.mId = id;
    }

    GetId(): number {
        return this.mId;
    }

    GetPotPlayer(): Player {
        return this.mPotPlayer;
    }

    SetPotPlayer(player: Player) {
        this.mPotPlayer = player;
        this.mIsPotted = true;
        this.mRigidBody.linearVelocity = cc.Vec2.ZERO;
        this.mRigidBody.angularVelocity = 0;
    }

    RegisterBoardManager(bm: BoardManager) {
        this.mBoardManager = bm;
        this.RegisterPockets(this.mBoardManager.pockets);
    }

    RegisterPockets(ap: Array<cc.Node>) {
        for (let index = 0; index < ap.length; index++) {
            this.mAllPocketPositions.push(new cc.Vec2(ap[index].getPosition().x, ap[index].getPosition().y));
        }
    }

    update(dt) {
        if (this.mIsPotted) {
            return;
        }

        if (Math.abs(this.mRigidBody.linearVelocity.x + this.mRigidBody.linearVelocity.y) > 0) {
            //pawn is moving
            if (this.node.position.x > this.mYPotCheckDistance
                && this.node.position.y > this.mXPotCheckDistance) {
                this.PotCheck(PocketType.RIGHT_TOP);
            } else if (this.node.position.x > this.mXPotCheckDistance
                && this.node.position.y < -this.mYPotCheckDistance) {
                this.PotCheck(PocketType.RIGHT_BOT);
            } else if (this.node.position.x < -this.mXPotCheckDistance
                && this.node.position.y > this.mYPotCheckDistance) {
                this.PotCheck(PocketType.LEFT_TOP);
            } else if (this.node.position.x < -this.mYPotCheckDistance
                && this.node.position.y < -this.mXPotCheckDistance) {
                this.PotCheck(PocketType.LEFT_BOT);
            }
        }
    }

    PotCheck(pocketType: PocketType) {
        let dis = Helper.getDistance(this.node.position, this.mAllPocketPositions[pocketType]);
        //console.log("dis: ", this.GetId(), dis);
        //console.log("distance squared :: ", pockPos.sub(this.node.getPosition()));
        if (dis <= this.mMinimumPotDistanceCheck) {
            this.DeactivateRigidbody();
            this.mBoardManager.RegisterPot(this);
            //TODO
            let moveTo = cc.moveTo(0.1, this.mAllPocketPositions[pocketType]);
            let fadeTo = cc.fadeOut(0.2);
            this.node.runAction(cc.sequence(moveTo, fadeTo));
            this.DeactiveAfter(0.3);
        }
    }

    GetPawnType(): PawnType {
        return this.pawnType;
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

    Reset() {
        this.node.setPosition(cc.Vec2.ZERO);
    }

    Convert(pawnType: PawnType) {
        this.pawnType = pawnType;
        this.init(this.pawnType);
    }

    DeactiveAfter(duration: number) {
        var self = this;
        this.scheduleOnce(function () {
            self.node.active = false;
        }, duration);
    }

    DeactivateRigidbody() {
        this.mPhysicsCollider.enabled = false;
        this.mRigidBody.active = false;
    }

    ActivateRigidbody() {
        this.mRigidBody.active = true;
        this.mPhysicsCollider.enabled = true;
    }
}
