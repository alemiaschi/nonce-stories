import type { TreeNode as TreeNodeData } from '../../hooks/useTreeData';

interface TreeNodeProps {
  node: TreeNodeData;
  x: number;
  y: number;
  isHighlighted: boolean;
  isActive: boolean;
  onClick: (id: string) => void;
}

const STATE_COLORS = {
  root: { fill: '#44403c', stroke: '#1c1917', text: '#fafaf9' },
  expanded: { fill: '#7c4f2a', stroke: '#5c3418', text: '#fef9f5' },
  frontier: { fill: '#e7e5e4', stroke: '#a8a29e', text: '#78716c' },
};

const DEPTH_RADIUS = [22, 18, 15, 13, 12, 11, 10];

export function TreeNodeCircle({ node, x, y, isHighlighted, isActive, onClick }: TreeNodeProps) {
  const colors = STATE_COLORS[node.state] ?? STATE_COLORS.frontier;
  const r = DEPTH_RADIUS[Math.min(node.depth, DEPTH_RADIUS.length - 1)];

  return (
    <g
      transform={`translate(${x},${y})`}
      className="cursor-pointer"
      onClick={() => onClick(node.id)}
      role="button"
      aria-label={node.id}
    >
      {/* Glow for active node */}
      {(isActive || isHighlighted) && (
        <circle
          r={r + 6}
          fill="none"
          stroke={isActive ? '#7c4f2a' : '#d97706'}
          strokeWidth={1.5}
          opacity={0.4}
        />
      )}
      <circle
        r={r}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={isActive ? 2 : 1}
        opacity={node.state === 'frontier' ? 0.55 : 1}
        className="transition-all duration-200"
      />
      {/* Label for root and depth-1 nodes */}
      {node.depth <= 1 && node.parentWord && (
        <text
          y={r + 12}
          textAnchor="middle"
          className="font-mono"
          fontSize={9}
          fill="#78716c"
        >
          {node.parentWord}
        </text>
      )}
    </g>
  );
}
