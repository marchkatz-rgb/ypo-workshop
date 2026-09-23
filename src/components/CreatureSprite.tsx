import { CreatureArt } from "./CreatureArt";
import { drawingUrl } from "../lib/data";
import type { Appearance, OrganismKind } from "../lib/types";

interface Props {
  appearance: Appearance;
  kind: OrganismKind;
  seed: string;
  /** Pixel size when used in normal HTML. Omit when nesting inside an SVG (then it fills a 200x200 box). */
  size?: number;
  className?: string;
}

/**
 * Shows the creator's drawing when there is one, otherwise the app's own art.
 * Works both as a normal element and nested inside an SVG scene.
 */
export function CreatureSprite({ appearance, kind, seed, size, className }: Props) {
  const drawing = appearance.drawing;
  if (!drawing?.cutoutPath) {
    return size !== undefined
      ? <CreatureArt appearance={appearance} kind={kind} seed={seed} size={size} className={className} />
      : <CreatureArt appearance={appearance} kind={kind} seed={seed} x={0} y={0} className={className} />;
  }
  const url = drawingUrl(drawing.cutoutPath);
  const flip = drawing.flip ? "scale(-1,1) translate(-200,0)" : undefined;
  if (size !== undefined) {
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} className={className} aria-hidden="true">
        <image href={url} x="0" y="0" width="200" height="200" preserveAspectRatio="xMidYMax meet" transform={flip} />
      </svg>
    );
  }
  return <image href={url} x="0" y="0" width="200" height="200" preserveAspectRatio="xMidYMax meet" transform={flip} className={className} />;
}
