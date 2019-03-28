import PawnComponent, { PawnType } from "./../Pawn";
import { Player } from "../Player";
import Striker from "../Striker";
import { Constants, GameType, AllGameModes, GameEvents } from "../LoadingScene/Constants";
import PersistentNodeComponent from "../LoadingScene/PersistentNodeComponent";
import { Logger } from "../LoadingScene/Logger";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoardManager extends cc.Component {

    @property(cc.Node)
    pawnHolder: cc.Node = null;

    @property(cc.Node)
    pockets: Array<cc.Node> = [];

    @property(cc.Prefab)
    pawnPrefab: cc.Prefab = null;

    @property(Striker)
    striker: Striker = null;

    @property(cc.Label)
    scoreLabels: Array<cc.Label> = [];

    mAllPawnPool: Array<PawnComponent> = [];
    mPlayerPool: Array<Player> = [];

    mPersistentNode: PersistentNodeComponent = null;
    mLogger: Logger = null;

    mCurrentTurnIndex: number = 0;
    mPersonalIndex: number = 0;
    mStrikerDistanceFromMid: number = 0;
    mTotalPawnsCount: number = 0;

    mBlackPotCount: number = 0;
    mWhitePotCount: number = 0;
    MAX_PAWN_PER_TYPE_COUNT = 9;

    //Flags
    mIsGameOver: boolean = false;
    mIsValidPotPending: boolean = false;

    myID: string = "";
    mIsDebugMode: boolean = false;
    mIsMyShot: boolean = true;
    mStartTracking: boolean = false;

    onLoad() {
        this.mStrikerDistanceFromMid = Math.abs(this.striker.strikerNode.getPosition().y);

        let pNode = cc.find(Constants.PERSISTENT_NODE_NAME);
        if (pNode) {
            this.mIsDebugMode = false;
            this.mPersistentNode = pNode.getComponent(PersistentNodeComponent);
            this.mPersistentNode.node.on(GameEvents.TAKE_SHOT, this.PropagateStrikerShot, this);
            this.mPersistentNode.node.on(GameEvents.UPDATE_TURN, this.ApplyNextTurn, this);
            this.mPersistentNode.node.on(GameEvents.UPDATE_SCORE, this.UpdateScore, this);
            this.mPersistentNode.node.on(GameEvents.SYNC_PAWNS, this.SyncPawns, this);

            this.myID = this.mPersistentNode.GetPlayerModel().getID();
        } else {
            this.mIsDebugMode = true;
        }
    }

    start() {
        this.mAllPawnPool.length = 0; //reset
        this.mLogger = new Logger(this.node.name);

        this.striker.node.active = false;
        //this.InitializePlayers();
        //this.ApplyTurn();
        //this.mPlayerPool[this.mCurrentTurnIndex].SetType(PawnType.WHITE);
        //this.mPlayerPool[(this.mCurrentTurnIndex + 1) % this.mPlayerPool.length].SetType(PawnType.BLACK);
    }

    InitializeCarromBoard() {
        if (this.mAllPawnPool.length > 0) {
            for (let index = 0; index < this.mAllPawnPool.length; index++) {
                this.mAllPawnPool[index].node.destroy();
            }
        }

        if (this.mIsMyShot == false) { //rotate pawnholder 120 degree
            this.pawnHolder.angle = 210;
        }

        this.mAllPawnPool.length = 0;
        let pawnNode = cc.instantiate(this.pawnPrefab);
        let r = pawnNode.getComponent(cc.CircleCollider).radius;
        let d = r * 2;

        //let deltaX = Math.abs(r * 2 - ((r * 2) * Math.cos(45)));
        let deltaY = Math.abs(d - ((d) * Math.sin(45)));

        let startPos = cc.Vec2.ZERO;
        startPos.x = -d; // first pawn
        startPos.y = d * 2 - (deltaY * 2);

        //Real values
        // let currentHighestCol = 3;
        // let currentHighestRow = 3;

        //Testing  values
        let currentHighestCol = 2;
        let currentHighestRow = 2;

        let currentType = 1;
        let toggleThreshold = 0;
        let idCounter = -1;

        for (let row = 0; row < currentHighestRow; row++) {
            for (let col = 0; col < currentHighestCol; col++) {
                idCounter++;
                if (row + col > 0) { //skipping first pawn, its already created
                    pawnNode = cc.instantiate(this.pawnPrefab);
                }
                pawnNode.setPosition(startPos);
                this.AddToPawnPool(pawnNode, idCounter);
                this.ConvertPawnTo(pawnNode, (row == 2 && col == 2) ? 0 : currentType);

                if (row != 2) { // adding counter pawn
                    pawnNode = cc.instantiate(this.pawnPrefab);
                    pawnNode.setPosition(new cc.Vec2(startPos.x, -startPos.y));

                    this.AddToPawnPool(pawnNode, idCounter);
                    this.ConvertPawnTo(pawnNode, currentType);
                }

                if (toggleThreshold <= 0) {
                    currentType = this.TogglePawnType(currentType);
                }
                startPos.x += d;
                toggleThreshold--;
            }

            toggleThreshold = row + 1;
            startPos.x = -d - ((row + 1) * r);
            startPos.y -= (d - deltaY);

            currentHighestCol++;
            if (currentHighestCol >= 6) {
                //this.pawnHolder.angle = 30; //doesnt matter because all pawns are rigid body
                break;
            }
        }//for
    }

    onDestroy() {
        if (this.mIsDebugMode) return;

        this.mPersistentNode.node.off(GameEvents.TAKE_SHOT, this.PropagateStrikerShot, this);
        this.mPersistentNode.node.off(GameEvents.UPDATE_TURN, this.ApplyNextTurn, this);
        this.mPersistentNode.node.off(GameEvents.UPDATE_SCORE, this.UpdateScore, this);
        this.mPersistentNode.node.off(GameEvents.SYNC_PAWNS, this.SyncPawns, this);
    }

    IsStrikerMoving() {
        if (!this.striker.mStrikerRigidBody) {
            console.warn("couldnt find rigid body");
            return false;
        }

        if (this.striker.mStrikerRigidBody.linearVelocity == cc.Vec2.ZERO) {
            return false;
        }

        return true;
    }

    Initialize1v1Players(personalIndex: number, currentTurnIndex: number) {
        this.mPersonalIndex = personalIndex;
        this.mCurrentTurnIndex = currentTurnIndex;
        this.mPlayerPool[this.mCurrentTurnIndex].SetType(PawnType.WHITE);
        this.mPlayerPool[(this.mCurrentTurnIndex + 1) % this.mPlayerPool.length].SetType(PawnType.BLACK);
    }

    ApplyNextTurn(next_turn_id: string) {
        if (this.mIsGameOver) {
            return;
        }

        if (this.mIsDebugMode) {
            this.mIsMyShot = true;
            if (this.mIsValidPotPending == false) {
                this.mCurrentTurnIndex = ((this.mCurrentTurnIndex + 1) % this.mPlayerPool.length);
            }
        } else {
            if (this.myID == this.mPlayerPool[0].GetID()) {
                this.mCurrentTurnIndex = (next_turn_id == this.myID) ? 0 : 1;
            } else if (this.myID == this.mPlayerPool[1].GetID()) {
                this.mCurrentTurnIndex = next_turn_id == this.myID ? 1 : 0;
            }
            this.mIsMyShot = (next_turn_id == this.myID); //take off control from player

            if (this.mIsMyShot) {
                this.ReactivateAllBody();
            } else {
                this.DeactivateAllBody();
            }
        }

        this.striker.ResetStriker();
        this.ApplyTurn();
    }

    OnStrikerHit(forceVec: cc.Vec2, magnitude: number) {
        this.mStartTracking = this.mIsMyShot;

        this.mIsValidPotPending = false; // release
        this.mIsMyShot = false;
        // this.mStartTracking = true;
        console.log("on striker hit ::: mySHOt::" + this.mIsMyShot + ", istrakcing::" + this.mStartTracking);

        if (this.mIsDebugMode == false) {
            this.mPersistentNode.GetSocketConnection().sendNewShotRequest(forceVec, magnitude);
        }
    }

    PropagateStrikerShot(body: any) {
        if (body.player_id !== this.myID) {
            console.log("PROPAGATING FOR ::: " + this.mPersistentNode.GetPlayerModel().getName());
            //this.striker.ApplyForce(new cc.Vec2(body.force_x, body.force_y), body.mag);
        }
    }

    UpdateScore(body: any) {
        this.mPlayerPool[0].SetScore(body.p1_score);
        this.mPlayerPool[1].SetScore(body.p2_score);

        this.UpdateScoreUI();
    }

    ApplyTurn() {
        //update striker pos
        //console.log("applying turn, ", this.mCurrentTurnIndex);
        this.UpdateStrikerPos();
    }

    private UpdateStrikerPos() {
        // if (this.mCurrentTurnIndex == 0) {
        //     this.striker.node.active = true;
        //     this.striker.strikerNode.setPosition(0, this.mStrikerDistanceFromMid);
        //     return;
        // } else if (this.mCurrentTurnIndex == 1) {
        //     this.striker.node.active = true;
        //     this.striker.strikerNode.setPosition(0, -this.mStrikerDistanceFromMid);
        //     return;
        // }

        this.striker.node.active = true;
        if (this.mIsMyShot) {
            this.striker.strikerNode.setPosition(0, -this.mStrikerDistanceFromMid);
        } else {
            //this.striker.strikerNode.setPosition(0, this.mStrikerDistanceFromMid);
            this.striker.node.active = false;
        }
    }

    private IsBoardEmpty(): boolean {
        return (this.mBlackPotCount == this.mWhitePotCount) && (this.mBlackPotCount == this.MAX_PAWN_PER_TYPE_COUNT);
    }

    private ProcessGameOver() {
        this.mIsGameOver = true;
        if (this.IsBoardEmpty()) { //TODO
            //compare score
            let winnerIndex = -1;
            let currHighestScore = 0;
            for (let i = 0; i < this.mPlayerPool.length; i++) {
                if (this.mPlayerPool[i].GetScore() > currHighestScore) {
                    currHighestScore = this.mPlayerPool[i].GetScore();
                    winnerIndex = i;
                }
            }
            return;
        }

        let winType = PawnType.NONE;
        if (this.mBlackPotCount >= this.MAX_PAWN_PER_TYPE_COUNT) {
            winType = PawnType.BLACK;
        } else if (this.mWhitePotCount >= this.MAX_PAWN_PER_TYPE_COUNT) {
            winType = PawnType.WHITE;
        }

        for (let i = 0; i < this.mPlayerPool.length; i++) {
            if (this.mPlayerPool[i].GetCurrentPawnType() == winType) {
                console.log("WINNER :  " + this.mPlayerPool[i].GetName());
                break;
            }
        }
    }

    UpdateScoreUI() {
        if (this.mIsDebugMode) {
            this.scoreLabels[this.mCurrentTurnIndex].string = this.mPlayerPool[this.mCurrentTurnIndex].GetName() + " : " + this.mPlayerPool[this.mCurrentTurnIndex].GetScore();
        } else {
            if (this.mPlayerPool[0].GetID() == this.mPersistentNode.GetPlayerModel().getID()) {
                this.scoreLabels[0].string = this.mPlayerPool[0].GetName() + " **: " + this.mPlayerPool[0].GetScore();
                this.scoreLabels[1].string = this.mPlayerPool[1].GetName() + " : " + this.mPlayerPool[1].GetScore();
            } else if (this.mPlayerPool[1].GetID() == this.mPersistentNode.GetPlayerModel().getID()) {
                this.scoreLabels[0].string = this.mPlayerPool[1].GetName() + " : " + this.mPlayerPool[1].GetScore();
                this.scoreLabels[1].string = this.mPlayerPool[0].GetName() + " **: " + this.mPlayerPool[0].GetScore();
            }
        }
    }

    private TogglePawnType(ct: number) {
        if (ct == 1) {
            return 2;
        } else if (ct == 2) {
            return 1;
        }
        return 0;
    }

    private AddToPawnPool(pawn: cc.Node, id: number) {
        let pawnComp = pawn.getComponent(PawnComponent);
        this.mAllPawnPool.push(pawnComp);
        pawnComp.RegisterBoardManager(this);
        pawnComp.SetId(id);
        pawn.setParent(this.pawnHolder);
    }
    private ConvertPawnTo(pn: cc.Node, pt: number) {
        let pawn = pn.getComponent(PawnComponent);
        switch (pt) {
            case 0:
                pawn.Convert(PawnType.RED);
                break;
            case 1:
                pawn.Convert(PawnType.BLACK);
                break;
            case 2:
                pawn.Convert(PawnType.WHITE);
                break;
        }
    }

    RegisterPot(pawn: PawnComponent) {
        let scoreToAdd = 1;
        switch (pawn.GetPawnType()) {
            case PawnType.RED:
                scoreToAdd = 2;
                break;
            case PawnType.BLACK:
                this.mBlackPotCount++;
                break;
            case PawnType.WHITE:
                this.mWhitePotCount++;
                break;
        }

        this.mPlayerPool[this.mCurrentTurnIndex].AddToScore(scoreToAdd);

        this.mIsValidPotPending = true;
        pawn.SetPotPlayer(this.mPlayerPool[this.mCurrentTurnIndex]);

        if (this.mIsDebugMode == false) {
            this.mPersistentNode.GetSocketConnection().sendScoreUpdate(
                this.mPlayerPool[0].GetScore(),
                this.mPlayerPool[0].GetID(),
                this.mPlayerPool[1].GetScore(),
                this.mPlayerPool[1].GetID()
            );

            this.SendPawnInfo(1);
        }

        this.UpdateScoreUI();

        console.log("white left " + (this.MAX_PAWN_PER_TYPE_COUNT - this.mWhitePotCount));
        console.log("black left " + (this.MAX_PAWN_PER_TYPE_COUNT - this.mBlackPotCount));

        if (this.mWhitePotCount >= this.MAX_PAWN_PER_TYPE_COUNT || this.mBlackPotCount >= this.MAX_PAWN_PER_TYPE_COUNT) {
            //process game over for white player
            this.ProcessGameOver();
        }
    }//registerPot

    GetOpponentId(): string {
        if (this.mPlayerPool[0].GetID() == this.mPersistentNode.GetPlayerModel().getID()) {
            return this.mPlayerPool[1].GetID();
        } else if (this.mPlayerPool[1].GetID() == this.mPersistentNode.GetPlayerModel().getID()) {
            return this.mPlayerPool[0].GetID();
        }
    }

    GetAllSpeed(): number {
        let speed = 0;
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            speed += this.mAllPawnPool[index].mRigidBody.linearVelocity.magSqr();
        }

        speed += this.striker.mStrikerRigidBody.linearVelocity.magSqr();
        return speed;
    }

    SendPawnInfo(lastUpdate: number) {
        //TODO just send the necessary pawns
        let infoJSON: any = {};
        infoJSON.all_pawns = [];

        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            let isPot = element.mIsPotted ? 1 : 0;

            infoJSON.all_pawns.push({
                index_num: index,
                position_x: element.node.position.x,
                position_y: element.node.position.y,
                is_potted: isPot
            });
        }
        infoJSON.shooter_id = this.myID;
        infoJSON.last_update = lastUpdate;
        this.mPersistentNode.GetSocketConnection().sendPawnInfo(infoJSON);
    }

    SyncPawns(body: any) {
        //console.log("synching :: ", body.shooter_id, this.myID);
        let lastUpdate = body.last_update == 0 ? false : true;

        if (body.all_pawns && body.shooter_id != this.myID) {
            //console.log("total pawns:: ", body.all_pawns.length);
            for (let index = 0; index < body.all_pawns.length; index++) {
                let inNum = body.all_pawns[index].index_num;
                let x = body.all_pawns[index].position_x;
                let y = body.all_pawns[index].position_y;
                let isPot = body.all_pawns[index].is_potted;

                if (isPot == 0) { //active
                    //console.log("moving to position::: ", lastUpdate);
                    this.mAllPawnPool[inNum].node.active = true;
                    if (lastUpdate == false) {
                        var action = cc.moveTo(0.1, x, y);
                        this.mAllPawnPool[inNum].node.runAction(action);

                    } else {
                        this.mAllPawnPool[inNum].node.setPosition(x, y);
                    }
                } else {
                    this.mAllPawnPool[inNum].mIsPotted = true;
                    this.mAllPawnPool[inNum].node.active = false;
                }
            }
        }
    }

    DeactivateAllBody() {
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            element.DeactivateRigidbody();
        }
    }

    ReactivateAllBody() {
        for (let index = 0; index < this.mAllPawnPool.length; index++) {
            const element = this.mAllPawnPool[index];
            if (element.mIsPotted == false) {
                element.ActivateRigidbody();
            }
        }
    }

    TakeNextTurn() {
        let chosenID = this.mIsValidPotPending ? this.myID : this.GetOpponentId();
        this.ApplyNextTurn(chosenID);
        this.mPersistentNode.GetSocketConnection().sendNextTurnUpdate(chosenID);
    }

    frameStep: number = 0;
    totalSec: number = 0;

    update(dt) {
        if (this.mIsDebugMode) {
            //this.frameStep += dt;
            //console.log(this.frameStep, dt);
            return;
        }

        if (this.mStartTracking) {
            this.frameStep += dt;
            this.totalSec += dt;

            if (this.frameStep > 0.05) {
                this.frameStep = 0;
                this.SendPawnInfo(0);

                if (this.GetAllSpeed() <= 2 || this.totalSec >= 7) { //TODO,neglagible speed or threshold
                    console.error("SENDING FINAL INFO");
                    this.SendPawnInfo(1);
                    this.totalSec = 0;
                    this.mStartTracking = false;
                    this.TakeNextTurn();
                }
            }
        }
    }
}
