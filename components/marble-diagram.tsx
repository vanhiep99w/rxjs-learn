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

const LABEL_WIDTH = 132;
const FRAME_WIDTH = 38;
const HEADER_HEIGHT = 38;
const ROW_HEIGHT = 62;
const RIGHT_PADDING = 28;

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
  x: number,
  y: number,
  description?: string,
) {
  const accessibleLabel = `${description ?? token.value ?? syntaxLabels[token.type]}, frame ${token.frame}`;

  if (token.type === 'next') {
    return (
      <g className={styles.nextMarker}>
        <title>{accessibleLabel}</title>
        <circle className={styles.eventCircle} cx={x} cy={y} r="13" />
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
        <line x1={x - 3} x2={x - 3} y1={y - 14} y2={y + 14} />
        <line x1={x + 3} x2={x + 3} y1={y - 14} y2={y + 14} />
      </g>
    );
  }

  if (token.type === 'error') {
    return (
      <g className={styles.errorMarker}>
        <title>{accessibleLabel}</title>
        <circle cx={x} cy={y} r="12" />
        <line x1={x - 5} x2={x + 5} y1={y - 5} y2={y + 5} />
        <line x1={x + 5} x2={x - 5} y1={y - 5} y2={y + 5} />
      </g>
    );
  }

  if (token.type === 'subscribe') {
    return (
      <g className={styles.lifecycleMarker}>
        <title>{accessibleLabel}</title>
        <line x1={x} x2={x} y1={y - 13} y2={y + 13} />
        <path d={`M ${x - 5} ${y - 7} L ${x} ${y - 13} L ${x + 5} ${y - 7}`} />
      </g>
    );
  }

  return (
    <g className={styles.lifecycleMarker}>
      <title>{accessibleLabel}</title>
      <line x1={x} x2={x} y1={y - 13} y2={y + 13} />
      <line x1={x - 5} x2={x + 5} y1={y - 13} y2={y - 5} />
      <line x1={x + 5} x2={x - 5} y1={y - 13} y2={y - 5} />
    </g>
  );
}

function SyntaxSymbol({ type }: { type: MarbleTokenType }) {
  if (type === 'next') {
    return <span className={`${styles.legendSymbol} ${styles.legendNext}`}>a</span>;
  }

  const characters: Record<Exclude<MarbleTokenType, 'next'>, string> = {
    complete: 'Ⅱ',
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
  frameLabel = 'Mỗi vạch = 1 frame',
  values,
  showLegend = true,
}: MarbleDiagramProps) {
  const parsedRows = rows.map(parseMarble);
  const frameCount = Math.max(
    ...parsedRows.map((row) => row.frameCount),
    1,
  );
  const width = LABEL_WIDTH + (frameCount - 1) * FRAME_WIDTH + RIGHT_PADDING;
  const height = HEADER_HEIGHT + parsedRows.length * ROW_HEIGHT + 16;
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
  const accessibleRows = parsedRows
    .map((row) => `${row.label}: ${row.marble}`)
    .join('. ');

  return (
    <figure className={styles.figure}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Marble timeline</div>
          <div className={styles.title}>{title}</div>
        </div>
        <div className={styles.frameLabel}>{frameLabel}</div>
      </div>

      <div className={styles.mobileScrollHint} aria-hidden="true">
        Vuốt ngang để xem tiếp →
      </div>

      <div className={styles.scroller} tabIndex={0} aria-label={`Cuộn sơ đồ: ${title}`}>
        <svg
          aria-hidden="true"
          className={styles.diagram}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
        >
          {Array.from({ length: frameCount }, (_, frame) => {
            const x = LABEL_WIDTH + frame * FRAME_WIDTH;
            const showNumber = frame === 0 || frame % 5 === 0;

            return (
              <g key={`frame-${frame}`}>
                <line
                  className={showNumber ? styles.majorGridLine : styles.gridLine}
                  x1={x}
                  x2={x}
                  y1={HEADER_HEIGHT - 2}
                  y2={height - 12}
                />
                {showNumber ? (
                  <text
                    className={styles.axisText}
                    textAnchor="middle"
                    x={x}
                    y={20}
                  >
                    {frame}
                  </text>
                ) : null}
              </g>
            );
          })}

          {parsedRows.map((row, rowIndex) => {
            const y = HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
            const kind = row.kind ?? 'inner';
            const subscribeFrame = row.tokens.find(
              (token) => token.type === 'subscribe',
            )?.frame;
            const terminalFrame = [...row.tokens]
              .reverse()
              .find((token) =>
                ['complete', 'error', 'unsubscribe'].includes(token.type),
              )?.frame;
            const lineStart = LABEL_WIDTH + (subscribeFrame ?? 0) * FRAME_WIDTH;
            const lineEnd =
              LABEL_WIDTH + (terminalFrame ?? frameCount - 1) * FRAME_WIDTH;

            return (
              <g
                className={`${styles.row} ${styles[kind]}`}
                key={`${row.label}-${rowIndex}`}
              >
                {kind === 'output' ? (
                  <rect
                    className={styles.outputBand}
                    height={ROW_HEIGHT - 10}
                    rx="7"
                    width={width - 16}
                    x="8"
                    y={y - (ROW_HEIGHT - 10) / 2}
                  />
                ) : null}

                {rowIndex > 0 ? (
                  <line
                    className={styles.rowDivider}
                    x1="16"
                    x2={width - 16}
                    y1={y - ROW_HEIGHT / 2}
                    y2={y - ROW_HEIGHT / 2}
                  />
                ) : null}

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
                  x1={lineStart}
                  x2={Math.max(lineStart, lineEnd)}
                  y1={y}
                  y2={y}
                />

                {row.tokens.map((token, tokenIndex) => {
                  const x = LABEL_WIDTH + token.frame * FRAME_WIDTH;
                  const description = token.value
                    ? values?.[token.value]
                    : undefined;

                  return (
                    <g key={`${token.frame}-${token.type}-${token.value ?? ''}-${tokenIndex}`}>
                      {markerForToken(token, x, y, description)}
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
                  <dt>{value}</dt>
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
