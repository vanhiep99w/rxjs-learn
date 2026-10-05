'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './marble-diagram.module.css';

type MarbleTokenType =
  | 'next'
  | 'complete'
  | 'error'
  | 'subscribe'
  | 'unsubscribe';

type MarbleToken = {
  frame: number;
  type: MarbleTokenType;
  value?: string;
};

export type MarbleRow = {
  label: string;
  marble: string;
  kind?: 'source' | 'inner' | 'output' | 'subscription';
};

export type MarbleDiagramProps = {
  title: string;
  rows: readonly MarbleRow[];
  caption?: string;
  frameLabel?: string;
  values?: Readonly<Record<string, string>>;
  showLegend?: boolean;
};

type ParsedRow = MarbleRow & {
  frameCount: number;
  tokens: MarbleToken[];
};

const LABEL_WIDTH = 126;
const FRAME_WIDTH = 42;
const TOP_RULER_HEIGHT = 32;
const ROW_HEIGHT = 70;
const OPERATOR_HEIGHT = 74;
const RIGHT_PADDING = 58;
const AXIS_RIGHT = 22;

function positionForFrame(
  frame: number,
  frameCount: number,
  diagramWidth: number,
  offset = 0,
) {
  if (frameCount <= 1) return LABEL_WIDTH + offset;

  const progress = frame / (frameCount - 1);
  const timelineWidth = diagramWidth - LABEL_WIDTH - RIGHT_PADDING;

  return LABEL_WIDTH + progress * timelineWidth + offset;
}

const tokenTypeByCharacter: Record<string, MarbleTokenType> = {
  '|': 'complete',
  '#': 'error',
  '^': 'subscribe',
  '!': 'unsubscribe',
};

const syntaxLabels: Record<MarbleTokenType, string> = {
  next: 'Giá trị được phát',
  complete: 'Complete',
  error: 'Error',
  subscribe: 'Subscribe',
  unsubscribe: 'Unsubscribe',
};

function tokenFromCharacter(character: string, frame: number): MarbleToken {
  const type = tokenTypeByCharacter[character] ?? 'next';

  return type === 'next'
    ? { frame, type, value: character }
    : { frame, type };
}

function parseMarble(row: MarbleRow): ParsedRow {
  const tokens: MarbleToken[] = [];
  let frame = 0;

  for (let index = 0; index < row.marble.length; index += 1) {
    const character = row.marble[index];

    if (/\s/.test(character)) continue;

    if (character === '-') {
      frame += 1;
      continue;
    }

    if (character === '(') {
      const groupEnd = row.marble.indexOf(')', index + 1);

      if (groupEnd === -1) {
        throw new Error(
          `Marble row "${row.label}" has an opening parenthesis without a closing parenthesis.`,
        );
      }

      const group = row.marble.slice(index + 1, groupEnd).replace(/\s/g, '');
      for (const groupedCharacter of group) {
        tokens.push(tokenFromCharacter(groupedCharacter, frame));
      }

      frame += 1;
      index = groupEnd;
      continue;
    }

    if (character === ')') {
      throw new Error(
        `Marble row "${row.label}" has a closing parenthesis without an opening parenthesis.`,
      );
    }

    tokens.push(tokenFromCharacter(character, frame));
    frame += 1;
  }

  const finalTokenFrame = tokens.reduce(
    (maximum, token) => Math.max(maximum, token.frame),
    0,
  );

  return {
    ...row,
    frameCount: Math.max(frame, finalTokenFrame + 1, 1),
    tokens,
  };
}

function markerForToken(
  token: MarbleToken,
  xAt: (offset?: number) => number,
  y: number,
  colorClass: string,
  description?: string,
) {
  const x = xAt();
  const accessibleLabel = `${description ?? token.value ?? syntaxLabels[token.type]}, frame ${token.frame}`;

  if (token.type === 'next') {
    return (
      <g className={styles.nextMarker}>
        <title>{accessibleLabel}</title>
        <circle
          className={`${styles.eventCircle} ${colorClass}`}
          cx={x}
          cy={y}
          r="15"
        />
        <text
          className={styles.eventText}
          dominantBaseline="central"
          textAnchor="middle"
          x={x}
          y={y}
        >
          {token.value}
        </text>
      </g>
    );
  }

  if (token.type === 'complete') {
    return (
      <g className={styles.terminalMarker}>
        <title>{accessibleLabel}</title>
        <line x1={x} x2={x} y1={y - 16} y2={y + 16} />
      </g>
    );
  }

  if (token.type === 'error') {
    return (
      <g className={styles.errorMarker}>
        <title>{accessibleLabel}</title>
        <circle cx={x} cy={y} r="14" />
        <line x1={xAt(-6)} x2={xAt(6)} y1={y - 6} y2={y + 6} />
        <line x1={xAt(6)} x2={xAt(-6)} y1={y - 6} y2={y + 6} />
      </g>
    );
  }

  if (token.type === 'subscribe') {
    return (
      <g className={styles.lifecycleMarker}>
        <title>{accessibleLabel}</title>
        <line x1={x} x2={x} y1={y - 15} y2={y + 15} />
        <line x1={xAt(-6)} x2={x} y1={y - 8} y2={y - 15} />
        <line x1={x} x2={xAt(6)} y1={y - 15} y2={y - 8} />
      </g>
    );
  }

  return (
    <g className={styles.unsubscribeMarker}>
      <title>{accessibleLabel}</title>
      <line x1={x} x2={x} y1={y - 15} y2={y + 15} />
      <line x1={xAt(-6)} x2={xAt(6)} y1={y - 15} y2={y - 3} />
      <line x1={xAt(6)} x2={xAt(-6)} y1={y - 15} y2={y - 3} />
    </g>
  );
}

function SyntaxSymbol({ type }: { type: MarbleTokenType }) {
  if (type === 'next') {
    return (
      <span className={`${styles.legendSymbol} ${styles.legendNext} ${styles.marbleBlue}`}>
        a
      </span>
    );
  }

  const characters: Record<Exclude<MarbleTokenType, 'next'>, string> = {
    complete: '│',
    error: '×',
    subscribe: '↑',
    unsubscribe: '×',
  };

  return (
    <span className={`${styles.legendSymbol} ${styles[`legend-${type}`]}`}>
      {characters[type]}
    </span>
  );
}

export function MarbleDiagram({
  title,
  rows,
  caption,
  frameLabel = '1 khoảng = 1 frame',
  values,
  showLegend = true,
}: MarbleDiagramProps) {
  const parsedRows = rows.map(parseMarble);
  const frameCount = Math.max(
    ...parsedRows.map((row) => row.frameCount),
    1,
  );
  const outputRowIndex = parsedRows.findIndex((row) => row.kind === 'output');
  const hasOperatorBand = outputRowIndex > 0;
  const operatorOffset = hasOperatorBand ? OPERATOR_HEIGHT : 0;
  const minimumWidth =
    LABEL_WIDTH + (frameCount - 1) * FRAME_WIDTH + RIGHT_PADDING;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const diagramWidth = Math.max(minimumWidth, containerWidth);
  const height =
    TOP_RULER_HEIGHT + parsedRows.length * ROW_HEIGHT + operatorOffset + 18;
  const operatorY = TOP_RULER_HEIGHT + outputRowIndex * ROW_HEIGHT;

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(scroller.getBoundingClientRect().width);
      setContainerWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
    };

    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(scroller);

    return () => observer.disconnect();
  }, []);
  const usedTokenTypes = new Set(
    parsedRows.flatMap((row) => row.tokens.map((token) => token.type)),
  );
  const legendOrder: MarbleTokenType[] = [
    'next',
    'complete',
    'error',
    'subscribe',
    'unsubscribe',
  ];
  const visibleLegendTypes = legendOrder.filter((type) => usedTokenTypes.has(type));
  const valueEntries = Object.entries(values ?? {});
  const valueColorIndexes = new Map<string, number>();

  for (const row of parsedRows) {
    for (const token of row.tokens) {
      if (
        token.type === 'next' &&
        token.value &&
        !valueColorIndexes.has(token.value)
      ) {
        valueColorIndexes.set(token.value, valueColorIndexes.size % 4);
      }
    }
  }

  for (const [value] of valueEntries) {
    if (!valueColorIndexes.has(value)) {
      valueColorIndexes.set(value, valueColorIndexes.size % 4);
    }
  }

  const colorClasses = [
    styles.marbleBlue,
    styles.marbleGreen,
    styles.marbleYellow,
    styles.marbleRed,
  ];
  const colorClassFor = (value?: string) =>
    colorClasses[valueColorIndexes.get(value ?? '') ?? 0];
  const accessibleRows = parsedRows
    .map((row) => `${row.label}: ${row.marble}`)
    .join('. ');
  const estimatedFrameLabelWidth = Math.min(
    260,
    Math.max(120, frameLabel.length * 5.5),
  );
  const frameLabelStart = diagramWidth - 16 - estimatedFrameLabelWidth;

  return (
    <figure className={styles.figure}>
      {!hasOperatorBand ? (
        <div className={styles.fallbackTitle}>{title}</div>
      ) : null}

      <div className={styles.mobileScrollHint} aria-hidden="true">
        Vuốt ngang để xem tiếp →
      </div>

      <div
        ref={scrollerRef}
        className={styles.scroller}
        tabIndex={0}
        aria-label={`Cuộn sơ đồ: ${title}`}
      >
        <svg
          aria-hidden="true"
          className={styles.diagram}
          height={height}
          width={diagramWidth}
        >
          {Array.from({ length: frameCount }, (_, frame) => {
            const x = positionForFrame(frame, frameCount, diagramWidth);
            const isNumberedFrame = frame === 0 || frame % 5 === 0;
            const showNumber =
              isNumberedFrame && (frame === 0 || x < frameLabelStart - 12);

            return showNumber ? (
              <g key={`frame-${frame}`}>
                <line
                  className={styles.rulerTick}
                  x1={x}
                  x2={x}
                  y1="20"
                  y2="26"
                />
                <text
                  className={styles.axisText}
                  textAnchor="middle"
                  x={x}
                  y="14"
                >
                  {frame}
                </text>
              </g>
            ) : null;
          })}

          <text
            className={styles.frameText}
            textAnchor="end"
            x={diagramWidth - 16}
            y="15"
          >
            {frameLabel}
          </text>

          {hasOperatorBand ? (
            <g className={styles.operatorGroup}>
              <rect
                className={styles.operatorBand}
                height={OPERATOR_HEIGHT}
                width={diagramWidth}
                x="0"
                y={operatorY}
              />
              <text
                className={styles.operatorTitle}
                dominantBaseline="central"
                textAnchor="middle"
                x={diagramWidth / 2}
                y={operatorY + OPERATOR_HEIGHT / 2}
              >
                {title}
              </text>
            </g>
          ) : null}

          {parsedRows.map((row, rowIndex) => {
            const rowOffset =
              hasOperatorBand && rowIndex >= outputRowIndex
                ? OPERATOR_HEIGHT
                : 0;
            const y =
              TOP_RULER_HEIGHT +
              rowIndex * ROW_HEIGHT +
              ROW_HEIGHT / 2 +
              rowOffset;
            const kind = row.kind ?? 'inner';

            return (
              <g
                className={`${styles.row} ${kind === 'output' ? styles.output : ''}`}
                key={`${row.label}-${rowIndex}`}
              >
                <text
                  className={styles.rowLabel}
                  dominantBaseline="central"
                  x="18"
                  y={y}
                >
                  {row.label}
                </text>

                <line
                  className={styles.baseline}
                  x1={LABEL_WIDTH}
                  x2={diagramWidth - 32}
                  y1={y}
                  y2={y}
                />
                <line
                  className={styles.axisArrow}
                  x1={diagramWidth - 33}
                  x2={diagramWidth - AXIS_RIGHT}
                  y1={y - 7}
                  y2={y}
                />
                <line
                  className={styles.axisArrow}
                  x1={diagramWidth - 33}
                  x2={diagramWidth - AXIS_RIGHT}
                  y1={y + 7}
                  y2={y}
                />

                {row.tokens.map((token, tokenIndex) => {
                  const xAt = (offset = 0) =>
                    positionForFrame(
                      token.frame,
                      frameCount,
                      diagramWidth,
                      offset,
                    );
                  const description = token.value
                    ? values?.[token.value]
                    : undefined;

                  return (
                    <g key={`${token.frame}-${token.type}-${token.value ?? ''}-${tokenIndex}`}>
                      {markerForToken(
                        token,
                        xAt,
                        y,
                        colorClassFor(token.value),
                        description,
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.srOnly}>
        {title}. {accessibleRows}
      </div>

      {(caption || (showLegend && visibleLegendTypes.length > 0) || valueEntries.length > 0) ? (
        <figcaption className={styles.footer}>
          {caption ? <p className={styles.caption}>{caption}</p> : null}

          {showLegend && visibleLegendTypes.length > 0 ? (
            <div className={styles.syntaxLegend} aria-label="Chú thích ký hiệu">
              {visibleLegendTypes.map((type) => (
                <span className={styles.syntaxItem} key={type}>
                  <SyntaxSymbol type={type} />
                  {syntaxLabels[type]}
                </span>
              ))}
            </div>
          ) : null}

          {valueEntries.length > 0 ? (
            <dl className={styles.valueLegend}>
              {valueEntries.map(([value, description]) => (
                <div className={styles.valueItem} key={value}>
                  <dt className={colorClassFor(value)}>{value}</dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
