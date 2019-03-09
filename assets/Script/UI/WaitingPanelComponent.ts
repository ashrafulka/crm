const { ccclass, property } = cc._decorator;

@ccclass
export default class WaitingPanelComponent extends cc.Component {

    @property(cc.Label)
    waitingTimeLabel: cc.Label = null;

    mTotalTimeToCount: number = 0;
    mIntervalLoop = null;

    start() {

    }

    initialize(countdown: number, onEndTimer: Function) {
        if (this.mIntervalLoop) {
            clearInterval(this.mIntervalLoop);
        }

        this.mTotalTimeToCount = countdown;
        this.waitingTimeLabel.string = this.mTotalTimeToCount + " s";

        let self = this;
        this.mIntervalLoop = setInterval(function () {
            self.mTotalTimeToCount--;
            self.waitingTimeLabel.string = self.mTotalTimeToCount + " s";
            if (self.mTotalTimeToCount <= 0) {
                onEndTimer();
                clearInterval(self.mIntervalLoop);
            }
        }, 1000);
    }


}
