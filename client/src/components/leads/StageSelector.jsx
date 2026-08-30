import { STAGE_ORDER, STAGE_LABELS } from '../../utils/helpers';

export default function StageSelector({ currentStage, onStageChange }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="stage-pipeline">
      {STAGE_ORDER.map((stage, index) => {
        const isActive = stage === currentStage;
        const isCompleted = index < currentIndex;
        let className = 'stage-step';
        if (isActive) className += ' active';
        if (isCompleted) className += ' completed';

        return (
          <div
            key={stage}
            className={className}
            onClick={() => onStageChange(stage)}
            title={`Set stage to ${STAGE_LABELS[stage]}`}
            role="button"
            tabIndex={0}
            id={`stage-${stage}`}
          >
            <div className="stage-step-bar" />
            <span className="stage-step-label">{STAGE_LABELS[stage]}</span>
          </div>
        );
      })}
    </div>
  );
}
