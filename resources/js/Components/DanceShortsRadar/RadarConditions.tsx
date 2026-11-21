import { router } from '@inertiajs/react';

import DanceShortsDisplaySelectField from '../Lab/DanceShortsRadar/Fields/DanceShortsDisplaySelectField';
import { isNavigableSelectOption, type DanceShortsDisplaySelectGroup, type DanceShortsDisplaySelectGroupKey } from '../Lab/DanceShortsRadar/displaySelectGroups';
import { DANCE_SHORTS_RADAR_RELOAD_OPTIONS } from '../Lab/DanceShortsRadar/inertiaReloadOptions';

type Props = {
    selectGroups: DanceShortsDisplaySelectGroup[];
    activeSelectGroup: DanceShortsDisplaySelectGroupKey;
    onActiveSelectGroupChange: (key: DanceShortsDisplaySelectGroupKey) => void;
};

/** PCは条件帯、スマホは既存の選択群・スワイプ操作を使います。hrefと選択値はサーバー出力のままです。 */
export default function RadarConditions(props: Props) {
    return (
        <>
            <div className="radar-conditions__compact"><DanceShortsDisplaySelectField {...props} /></div>
            <div className="radar-conditions__wide">
                {props.selectGroups.map(group => (
                    <fieldset key={group.key}>
                        <legend>{group.label}</legend>
                        <div className="radar-conditions__options">
                            {group.options.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={option.isActive}
                                    onClick={() => {
                                        props.onActiveSelectGroupChange(group.key);
                                        if (isNavigableSelectOption(option)) router.get(option.href, {}, DANCE_SHORTS_RADAR_RELOAD_OPTIONS);
                                    }}
                                >{option.label}</button>
                            ))}
                        </div>
                    </fieldset>
                ))}
            </div>
        </>
    );
}
