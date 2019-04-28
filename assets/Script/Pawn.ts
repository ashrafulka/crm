import { Player } from "./Player";
import BoardManager from "./Managers/BoardManager";
import Helper from "./Helpers/Helper";
import { AllGameModes } from "./LoadingScene/Constants";

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

    @property({ type: cc.Enum(PawnType) }) pawnType: PawnType = PawnType.BLACK;
    @property(cc.SpriteFrame) redSpriteFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) blackSpriteFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame) whiteSpriteFrame: cc.SpriteFrame = null;
    @property(cc.Label) idLabel: cc.Label = null;

    @property mXPotCheckDistance: number = 60;
    @property mYPotCheckDistance: number = 220;
    @property mMinimumPotDistanceCheck: number = 0;

    mId: number = -1;
    mIndex: number = -1;
    mPotPlayer: Player = null;
    mIsPotted: boolean = false;
    mRigidBody: cc.RigidBody = null;
    mPhysicsCollider: cc.PhysicsCircleCollider = null;
    mBoardManager: BoardManager = null;
    mAllPocketPositions: Array<cc.Vec2> = [];

    vanishSchedule = null;

    onLoad() {
        this.mRigidBody = this.node.getComponent(cc.RigidBody);
        this.mPhysicsCollider = this.node.getComponent(cc.PhysicsCircleCollider);
        this.mRigidBody.allowSleep = false;
    }

    start() {
        this.DisablePhysics();
        let self = this;
        this.scheduleOnce(function () {
            self.ActivatePhysics();
        }, 1);
    }

    SetId(id: number) {
        this.mId = id;
        this.idLabel.string = id.toString();
    }

    GetId(): number {
        return this.mId;
    }

    SetIndex(index: number): number {
        return this.mIndex;
    }

    GetIndex(): number {
        return this.mIndex;
    }

    GetPotPlayer(): Player {
        return this.mPotPlayer;
    }

    SetPotPlayer(player: Player, opponent: Player) {
        this.mPotPlayer = player;
        this.mIsPotted = true;
        if (this.GetPawnType() == PawnType.RED) {
            this.mPotPlayer.AddToScore(5);
        } else if (this.GetPawnType() == this.mPotPlayer.GetCurrentPawnType()) {
            this.mPotPlayer.AddToScore(1);
        } else {
            opponent.AddToScore(1);
        }
    }

    FoulRespawn() {
        console.log("foul respawning :: " + this.GetId());
        if (this.mPotPlayer) {
            this.mPotPlayer.AddToScore(this.pawnType == PawnType.RED ? -5 : -1);
        }

        this.mPotPlayer = null;
        this.mIsPotted = false;
        if (this.vanishSchedule) {
            clearInterval(this.vanishSchedule);
        }
        this.node.active = true;
        this.node.stopAllActions();
        this.node.setScale(1);
        this.ActivatePhysics();
    }

    RegisterBoardManager(bm: BoardManager) {
        this.mBoardManager = bm;
        this.RegisterPockets(this.mBoardManager.pockets);
    }

    private RegisterPockets(ap: Array<cc.Node>) {
        console.log("Registering pockets:::");
        for (let index = 0; index < ap.length; index++) {
            this.mAllPocketPositions.push(new cc.Vec2(ap[index].getPosition().x, ap[index].getPosition().y));
        }
    }

    // onEnable() {
    //     console.log("ENABLE ID :: ", this.GetId());
    // }//onenable
    // onDisable() {
    //     console.log("DISABLE ID :: ", this.GetId());
    // }//ondisable

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
        if (dis <= this.mMinimumPotDistanceCheck) {
            this.DisablePhysics();
            this.mBoardManager.RegisterPot(this);
            let scaleTo = cc.scaleTo(0.1, 0.7, 0.7);
            this.node.runAction(scaleTo);
            this.DeactiveAfter(0.2);
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

    Convert(pawnType: PawnType) {
        this.pawnType = pawnType;
        this.init(this.pawnType);
    }

    DeactiveAfter(duration: number) {
        var self = this;
        this.vanishSchedule = this.scheduleOnce(function () {
            //console.log("Deactivating id:: ", this.mId);
            self.node.active = false;
        }, duration);
    }

    DisablePhysics() {
        //console.log("disabling physics ", this.GetId());
        this.mRigidBody.linearVelocity = cc.Vec2.ZERO;
        this.mPhysicsCollider.enabled = false;
        this.mRigidBody.active = false;
    }

    ActivatePhysics() {
        //console.log("activating physics : " + this.GetId());
        this.mRigidBody.active = true;
        this.mPhysicsCollider.enabled = true;
    }
}
