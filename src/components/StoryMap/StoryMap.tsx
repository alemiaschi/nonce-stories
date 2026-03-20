import { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import * as d3 from 'd3';
import type { AppData } from '../../types';
import { useTreeData, type TreeNode } from '../../hooks/useTreeData';
import { LexiconSidebar } from './LexiconSidebar';
import { StatsPanel } from './StatsPanel';

interface StoryMapProps {
  data: AppData;
  activeStoryId?: string;
  onNavigate?: (storyId: string) => void;
}

const DEPTH_RADIUS = [22, 18, 15, 13, 12, 11, 10];
const NODE_FILL = {
  root: '#44403c',
  expanded: '#7c4f2a',
  frontier: '#e7e5e4',
  dead: '#c4b5a5',
};
const NODE_STROKE = {
  root: '#1c1917',
  expanded: '#5c3418',
  frontier: '#a8a29e',
  dead: '#9c8879',
};

export function StoryMap({ data, activeStoryId, onNavigate }: StoryMapProps) {
  const location = useLocation();
  const locationState = location.state as { highlight?: string } | null;
  const svgRef = useRef<SVGSVGElement>(null);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(locationState?.highlight ?? null);
  const [currentActive, setCurrentActive] = useState<string>(activeStoryId ?? 'story_0');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 640);
  const rootNode = useTreeData(data);

  const handleNavigate = useCallback((storyId: string) => {
    setCurrentActive(storyId);
    onNavigate?.(storyId);
  }, [onNavigate]);

  useEffect(() => {
    if (!svgRef.current) return;

    const container = svgRef.current.parentElement!;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    // Build D3 hierarchy
    const hierarchy = d3.hierarchy<TreeNode>(rootNode, d => d.children);

    // Use tree layout — vertical orientation
    const treeLayout = d3.tree<TreeNode>()
      .size([W - 120, H - 120])
      .separation((a, b) => (a.parent === b.parent ? 1.4 : 2));

    const root = treeLayout(hierarchy);

    // Zoom + pan group
    const g = svg.append('g').attr('transform', `translate(60, 60)`);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform as unknown as string);
      });

    svg.call(zoom);

    // Draw edges
    const linkGenerator = d3.linkVertical<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
      .x(d => d.x)
      .y(d => d.y);

    g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', '#d6d3d1')
      .attr('stroke-width', 1)
      .attr('opacity', 0.6);

    // Edge labels (parent word)
    g.selectAll('.edge-label')
      .data(root.links())
      .enter()
      .append('text')
      .attr('class', 'edge-label')
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2 - 4)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', 8)
      .attr('fill', '#a8a29e')
      .text(d => d.target.data.parentWord ?? '');

    // Draw nodes
    const nodeGroups = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('cursor', 'pointer')
      .on('click', (_, d) => handleNavigate(d.data.id));

    nodeGroups.each(function(d) {
      const el = d3.select(this);
      const state = d.data.state;
      const r = DEPTH_RADIUS[Math.min(d.data.depth, DEPTH_RADIUS.length - 1)];
      const isActive = d.data.id === currentActive;

      // Glow ring for active node
      if (isActive) {
        el.append('circle')
          .attr('r', r + 5)
          .attr('fill', 'none')
          .attr('stroke', '#b45309')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.4);
      }

      el.append('circle')
        .attr('r', r)
        .attr('fill', NODE_FILL[state] ?? NODE_FILL.frontier)
        .attr('stroke', NODE_STROKE[state] ?? NODE_STROKE.frontier)
        .attr('stroke-width', isActive ? 2 : 1)
        .attr('opacity', state === 'frontier' ? 0.5 : 1);

      // † marker for dead nodes
      if (state === 'dead') {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-family', 'serif')
          .attr('font-size', r * 0.9)
          .attr('fill', '#78716c')
          .attr('pointer-events', 'none')
          .text('†');
      }

      // Label for shallow nodes
      if (d.data.depth <= 1 && d.data.parentWord) {
        el.append('text')
          .attr('y', r + 11)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'JetBrains Mono', monospace")
          .attr('font-size', 8)
          .attr('fill', '#78716c')
          .text(d.data.parentWord);
      }

      // Root label
      if (d.data.depth === 0) {
        el.append('text')
          .attr('y', r + 14)
          .attr('text-anchor', 'middle')
          .attr('font-family', "'Lora', Georgia, serif")
          .attr('font-size', 9)
          .attr('font-style', 'italic')
          .attr('fill', '#57534e')
          .text('root');
      }
    });

    // Tooltip on hover
    const tooltip = d3.select('body').select<HTMLDivElement>('#tree-tooltip');

    nodeGroups
      .on('mouseenter', (event, d) => {
        const isDead = d.data.state === 'dead';
        const label = isDead && d.data.deathNote
          ? `<span style="font-family: monospace; font-size: 11px;">${d.data.id}</span><br/><span style="font-family: serif; font-size: 11px; font-style: italic; opacity: 0.8;">† ${d.data.deathNote}</span>`
          : `<span style="font-family: monospace; font-size: 11px;">${d.data.id}</span>`;
        tooltip
          .style('display', 'block')
          .style('left', `${event.pageX + 12}px`)
          .style('top', `${event.pageY - 28}px`)
          .html(label);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', `${event.pageX + 12}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseleave', () => {
        tooltip.style('display', 'none');
      });

    // Fit to view initially
    const bounds = (g.node() as SVGGElement).getBBox();
    const scale = Math.min(0.9, Math.min(W / (bounds.width + 80), H / (bounds.height + 80)));
    const tx = W / 2 - (bounds.x + bounds.width / 2) * scale;
    const ty = 40 - bounds.y * scale;
    svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));

  }, [rootNode, currentActive, handleNavigate]);

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Tooltip (global, positioned by D3) */}
      <div
        id="tree-tooltip"
        style={{ display: 'none', position: 'fixed', zIndex: 200, pointerEvents: 'none' }}
        className="bg-stone-800 text-stone-100 text-xs px-2.5 py-1.5 rounded shadow-lg"
      />

      <div className="flex flex-1 min-h-0">
        {/* Lexicon sidebar */}
        {sidebarOpen && (
          <LexiconSidebar
            data={data}
            onNavigate={handleNavigate}
            highlightedWord={highlightedWord}
            onHighlight={setHighlightedWord}
          />
        )}

        {/* Tree canvas */}
        <div className="flex-1 relative bg-stone-50 overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" />

          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm border border-stone-200 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-stone-500 hover:text-stone-700 hover:border-stone-300 transition-colors flex items-center gap-1.5"
            title={sidebarOpen ? 'Hide word list' : 'Show word list'}
          >
            <span>{sidebarOpen ? '◂' : '▸'}</span>
            <span className="hidden sm:inline">{sidebarOpen ? 'hide list' : 'word list'}</span>
          </button>

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm border border-stone-200 rounded-lg p-3 text-[10px] font-mono text-stone-500 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-stone-700 inline-block" />
              <span>root</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-800 inline-block" />
              <span>expanded</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-stone-200 border border-stone-400 inline-block opacity-60" />
              <span>frontier</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#c4b5a5', border: '1px solid #9c8879' }} />
              <span>† withered</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute top-4 right-4 text-[10px] text-stone-500 font-mono bg-white/70 backdrop-blur-sm px-2.5 py-1.5 rounded border border-stone-200">
            scroll to zoom · drag to pan · click to navigate
          </div>
        </div>
      </div>

      {/* Stats panel */}
      <StatsPanel data={data} />
    </div>
  );
}
