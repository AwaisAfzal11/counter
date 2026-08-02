import { useClock, useClockEvents } from './context/ClockContext';
import { HeroCounter } from './components/layer0/HeroCounter';
import { MilestoneBanner } from './components/layer0/MilestoneBanner';
import { MarchWindow } from './components/layer1/MarchWindow';
import { BlockLedger } from './components/layer1/BlockLedger';
import { CurrentBattle } from './components/layer2/CurrentBattle';
import { FrontTabs } from './components/layer3/FrontTabs';
import { Chronicle } from './components/layer4/Chronicle';
import { FieldDoctrine } from './components/layer5/FieldDoctrine';
import { LearningLibrary } from './components/layer6/LearningLibrary';
import { ActTransition } from './components/events/ActTransition';
import { Toast } from './components/events/Toast';

export function App() {
  const { now, phase, dayIndex, milestone } = useClock();
  const { actTransition, toast, dismissActTransition } = useClockEvents();

  return (
    <>
      <div className="mx-auto w-full max-w-[480px] px-4 lg:max-w-[1000px]">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
          {/* Layers 0–1: the entire product for 80% of opens. */}
          <div className="lg:sticky lg:top-6">
            {milestone && <MilestoneBanner copy={milestone} />}
            <HeroCounter />
            <div className="mt-4">
              <MarchWindow />
            </div>
            <div className="mt-3">
              <BlockLedger />
            </div>
            <div className="mt-3">
              <CurrentBattle />
            </div>
          </div>

          <div className="mt-3 space-y-3 lg:mt-5">
            <div className="deferred">
              <FrontTabs dayIndex={dayIndex} phase={phase} />
            </div>
            <div className="deferred">
              <Chronicle dayIndex={dayIndex} phase={phase} />
            </div>
            <div className="deferred">
              <FieldDoctrine now={now} />
            </div>
          </div>
        </div>
        <div className="deferred mt-6 pb-12">
          <LearningLibrary now={now} />
        </div>
      </div>

      {toast && <Toast message={toast} />}
      {actTransition && (
        <ActTransition act={actTransition} onDismiss={dismissActTransition} />
      )}
    </>
  );
}
