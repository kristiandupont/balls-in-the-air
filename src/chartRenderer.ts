import * as d3 from "d3";
import type { Ball } from "./storage";
import { calculateRadius, getBallColors, calculateTextSize } from "./storage";

export interface ChartRenderer {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  updateSelection: (selectedBall: Ball | null) => void;
  updateBalls: (balls: Ball[], selectedBall?: Ball | null) => void;
  destroy: () => void;
}

export const createChartRenderer = (
  balls: Ball[],
  width: number,
  height: number,
  onBallClick: (ballId: string | null) => void,
  onBallDragStart?: () => void,
  onBallDragEnd?: () => void
): ChartRenderer => {
  const chartWidth = width;
  const chartHeight = height;

  // Create the SVG container
  const svg = d3
    .create("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("viewBox", [0, 0, chartWidth, chartHeight])
    .attr("style", "width: 100%; height: auto; font: 14px sans-serif;")
    .style("background", "#f9fafb");

  // Initialize ball positions if not set
  balls.forEach((ball) => {
    if (ball.x === undefined || ball.y === undefined) {
      ball.x = chartWidth / 2 + (Math.random() - 0.5) * 100;
      ball.y = chartHeight / 2 + (Math.random() - 0.5) * 100;
      ball.vx = (Math.random() - 0.5) * 2;
      ball.vy = (Math.random() - 0.5) * 2;
    }
  });

  // Create force simulation for dynamic movement
  const forceSimulation = d3
    .forceSimulation(balls)
    .force(
      "collision",
      d3.forceCollide<Ball>().radius((d) => calculateRadius(d) + 2)
    )
    .force("x", d3.forceX(chartWidth / 2).strength(0.05))
    .force("y", d3.forceY(chartHeight / 2).strength(0.05))
    .force("charge", d3.forceManyBody<Ball>().strength(-30))
    .force("boundary", () => {
      // Custom containment force to keep balls within viewport
      const padding = 10;
      const nodes = forceSimulation.nodes();
      nodes.forEach((ball) => {
        const r = calculateRadius(ball);
        if (ball.x! < r + padding) {
          ball.x = r + padding;
          ball.vx = Math.abs(ball.vx || 0) * 0.5;
        }
        if (ball.x! > chartWidth - r - padding) {
          ball.x = chartWidth - r - padding;
          ball.vx = -Math.abs(ball.vx || 0) * 0.5;
        }
        if (ball.y! < r + padding) {
          ball.y = r + padding;
          ball.vy = Math.abs(ball.vy || 0) * 0.5;
        }
        if (ball.y! > chartHeight - r - padding) {
          ball.y = chartHeight - r - padding;
          ball.vy = -Math.abs(ball.vy || 0) * 0.5;
        }
      });
    })
    .alpha(1)
    .alphaDecay(0.001)
    .velocityDecay(0.8)
    .on("tick", tick);

  // Track drag distance to distinguish click from drag
  let isDragging = false;
  let dragDistance = 0;
  let dragStartTime = 0;
  let justClickedBall = false;

  // Drag behavior
  const drag = d3
    .drag<SVGGElement, Ball>()
    .on("start", function (event, d) {
      isDragging = false;
      dragDistance = 0;
      dragStartTime = Date.now();
      // Immediately pause simulation to prevent ball movement during click
      forceSimulation.alphaTarget(0).alpha(0.05);
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", function (event, d) {
      dragDistance += Math.abs(event.dx) + Math.abs(event.dy);
      if (dragDistance > 5) {
        // Only start actual dragging if moved more than 5 pixels
        if (!isDragging) {
          isDragging = true;
          if (onBallDragStart) onBallDragStart();
          forceSimulation.alphaTarget(0.3).restart();
        }
        d.fx = event.x;
        d.fy = event.y;
      }
    })
    .on("end", function (event, d) {
      const clickDuration = Date.now() - dragStartTime;

      console.log("Drag end:", {
        isDragging,
        dragDistance,
        clickDuration,
        ballName: d.name,
        willClick: !isDragging && clickDuration < 300,
      });

      if (isDragging) {
        if (onBallDragEnd) onBallDragEnd();
        forceSimulation.alphaTarget(0);
        d.fx = undefined;
        d.fy = undefined;
        isDragging = false;
      } else {
        // Release fixed position
        d.fx = undefined;
        d.fy = undefined;
        // Restart simulation gently
        forceSimulation.alphaTarget(0).alpha(0.3).restart();

        // If we didn't really drag AND it was quick (< 300ms), treat it as a click
        if (clickDuration < 300) {
          console.log("Calling onBallClick for:", d.name, d.id);
          justClickedBall = true;
          onBallClick(d.id);
          // Reset flag after a short delay (after SVG click event would have fired)
          setTimeout(() => {
            justClickedBall = false;
          }, 10);
        }
      }
      dragDistance = 0;
    });

  // Create ball groups
  let ballGroups = svg
    .selectAll<SVGGElement, Ball>("g.ball")
    .data(balls, (d) => d.id)
    .join("g")
    .attr("class", "ball")
    .style("cursor", "grab")
    .call(drag);

  // Add clip paths for each ball
  ballGroups
    .append("clipPath")
    .attr("id", (d) => `clip-${d.id}`)
    .append("circle")
    .attr("r", (d) => calculateRadius(d));

  // Add circles
  const circles = ballGroups
    .append("circle")
    .attr("r", (d) => calculateRadius(d))
    .attr("fill", (d) => getBallColors(d).fill)
    .attr("stroke", (d) => getBallColors(d).stroke)
    .attr("stroke-width", 2);

  // Add labels
  const labels = ballGroups
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("clip-path", (d) => `url(#clip-${d.id})`)
    .style("pointer-events", "none")
    .style("fill", (d) => getBallColors(d).text)
    .style("font-weight", "600")
    .style("font-size", (d) => `${calculateTextSize(d)}px`)
    .each(function (d) {
      const lines = d.name.split('\n');
      const lineHeight = 1.2;
      const startY = -(lines.length - 1) * lineHeight / 2;

      d3.select(this)
        .selectAll('tspan')
        .data(lines)
        .join('tspan')
        .attr('x', 0)
        .attr('y', (_, i) => `${startY + i * lineHeight}em`)
        .text((line) => line);
    });

  function tick() {
    svg
      .selectAll<SVGGElement, Ball>("g.ball")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  // Click background to deselect
  svg.on("click", () => {
    console.log("SVG background clicked, justClickedBall:", justClickedBall);
    if (!justClickedBall) {
      onBallClick(null);
    }
  });

  const updateSelection = (selectedBall: Ball | null) => {
    svg
      .selectAll<SVGCircleElement, Ball>("g.ball circle")
      .transition()
      .duration(200)
      .attr("fill", (d) => getBallColors(d, d === selectedBall).fill)
      .attr("stroke", (d) => getBallColors(d, d === selectedBall).stroke)
      .attr("stroke-width", (d) => (d === selectedBall ? 4 : 2));

    svg
      .selectAll<SVGTextElement, Ball>("g.ball text")
      .transition()
      .duration(200)
      .style("fill", (d) => getBallColors(d, d === selectedBall).text);
  };

  const updateBalls = (newBalls: Ball[], selectedBall?: Ball | null) => {
    // Initialize positions for any new balls
    newBalls.forEach((ball) => {
      if (ball.x === undefined || ball.y === undefined) {
        ball.x = chartWidth / 2 + (Math.random() - 0.5) * 100;
        ball.y = chartHeight / 2 + (Math.random() - 0.5) * 100;
        ball.vx = (Math.random() - 0.5) * 2;
        ball.vy = (Math.random() - 0.5) * 2;
      }
    });

    // Update simulation nodes
    forceSimulation.nodes(newBalls);

    // Update collision force with new radii
    forceSimulation.force(
      "collision",
      d3.forceCollide<Ball>().radius((d) => calculateRadius(d) + 2)
    );

    // Update visual elements
    const updatedGroups = svg
      .selectAll<SVGGElement, Ball>("g.ball")
      .data(newBalls, (d) => d.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "ball")
            .attr("transform", (d) => `translate(${d.x},${d.y})`);

          // Add clip path for new balls
          g.append("clipPath")
            .attr("id", (d) => `clip-${d.id}`)
            .append("circle")
            .attr("r", (d) => calculateRadius(d));

          return g;
        },
        (update) => update,
        (exit) => exit.remove()
      )
      .style("cursor", "grab")
      .call(drag);

    // Update clip path radii
    updatedGroups.selectAll<SVGCircleElement, Ball>("clipPath circle")
      .transition()
      .duration(300)
      .ease(d3.easeBackOut)
      .attr("r", (d) => calculateRadius(d));

    // Update circles with smooth transition
    const circles = updatedGroups.selectAll<SVGCircleElement, Ball>("circle:not(clipPath circle)");
    const circlesData = circles.data((d) => [d]);

    circlesData.join(
      (enter) =>
        enter
          .append("circle")
          .attr("r", (d) => calculateRadius(d))
          .attr("fill", (d) => getBallColors(d, d === selectedBall).fill)
          .attr("stroke", (d) => getBallColors(d, d === selectedBall).stroke)
          .attr("stroke-width", (d) => (d === selectedBall ? 4 : 2)),
      (update) =>
        update
          .transition()
          .duration(300)
          .ease(d3.easeBackOut)
          .attr("r", (d) => calculateRadius(d))
          .attr("fill", (d) => getBallColors(d, d === selectedBall).fill)
          .attr("stroke", (d) => getBallColors(d, d === selectedBall).stroke)
          .attr("stroke-width", (d) => (d === selectedBall ? 4 : 2))
    );

    // Update text
    const texts = updatedGroups.selectAll<SVGTextElement, Ball>("text");
    const textsData = texts.data((d) => [d]);

    textsData.join(
      (enter) =>
        enter
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("clip-path", (d) => `url(#clip-${d.id})`)
          .style("pointer-events", "none")
          .style("fill", (d) => getBallColors(d, d === selectedBall).text)
          .style("font-weight", "600")
          .style("font-size", (d) => `${calculateTextSize(d)}px`)
          .each(function (d) {
            const lines = d.name.split('\n');
            const lineHeight = 1.2;
            const startY = -(lines.length - 1) * lineHeight / 2;

            d3.select(this)
              .selectAll('tspan')
              .data(lines)
              .join('tspan')
              .attr('x', 0)
              .attr('y', (_, i) => `${startY + i * lineHeight}em`)
              .text((line) => line);
          }),
      (update) =>
        update
          .transition()
          .duration(300)
          .ease(d3.easeBackOut)
          .style("fill", (d) => getBallColors(d, d === selectedBall).text)
          .style("font-size", (d) => `${calculateTextSize(d)}px`)
          .on("end", function (d) {
            const lines = d.name.split('\n');
            const lineHeight = 1.2;
            const startY = -(lines.length - 1) * lineHeight / 2;

            d3.select(this)
              .selectAll('tspan')
              .data(lines)
              .join('tspan')
              .attr('x', 0)
              .attr('y', (_, i) => `${startY + i * lineHeight}em`)
              .text((line) => line);
          })
    );

    forceSimulation.alpha(1).restart();
  };

  const destroy = () => {
    forceSimulation.stop();
    svg.remove();
  };

  return {
    svg: svg as d3.Selection<SVGSVGElement, unknown, null, undefined>,
    updateSelection,
    updateBalls,
    destroy,
  };
};
