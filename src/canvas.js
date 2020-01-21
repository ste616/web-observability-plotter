import React, {
  useReducer,
  useEffect,
  Fragment,
  createRef,
  useRef
} from "react";
import { Stage, Layer, Rect, Text, Line } from "react-konva/lib/ReactKonvaCore";
import {
  turnFraction,
  floatToHourLabel,
  floorz,
  decimalToSexagesimal
} from "./common";
import { formatDate } from "./date";

// Rect, Text, Circle and line as just react components
// they are not loaded into Konva namespace
// so we need to import required shapes manually
import "konva/lib/shapes/Rect";
import "konva/lib/shapes/Text";
import "konva/lib/shapes/Line";

// Routine to calculate the necessary length parameters.
const calculateLengths = function(state, action) {
  // How many lines do we want to display at the top?
  // Including the UTC line.
  const nTopLines = 2;
  // And the size of the text.
  const textSize =
    typeof state.responsiveParameters !== "undefined"
      ? state.responsiveParameters.fontSize
      : 14;
  const canvasConstants = {
    topTitleHeight: nTopLines * 1.8 * textSize,
    bottomTitleHeight: 20,
    leftLabelWidth: 100,
    rightLabelWidth: 40,
    textSize: textSize,
    sourceHeight: 70,
    siderealRatio: (23 + 56 / 60) / 24
  };
  state = { ...state, ...canvasConstants };

  // Has the number of sources changed?
  var nSources = state.nSources;
  if (typeof action.nSources !== "undefined") {
    nSources = action.nSources;
  }

  // The width of the canvas.
  const width = 0.92 * action.width;
  // The height of the canvas.
  const minHeight =
    canvasConstants.sourceHeight +
    canvasConstants.topTitleHeight +
    canvasConstants.bottomTitleHeight;
  var height =
    nSources * canvasConstants.sourceHeight +
    canvasConstants.topTitleHeight +
    canvasConstants.bottomTitleHeight;
  height = height < minHeight ? minHeight : height;
  // The width of the area in which we plot the day.
  const plotWidth =
    width - canvasConstants.leftLabelWidth - canvasConstants.rightLabelWidth;
  // And the height of that area.
  const plotHeight =
    height - canvasConstants.topTitleHeight - canvasConstants.bottomTitleHeight;
  // The width assigned to each of the hour labels at the top.
  const hourLabelWidth = plotWidth / (state.nLabelledHours - 1);
  // The x location to start the hour labels.
  const hourLabelStartX = canvasConstants.leftLabelWidth - hourLabelWidth / 2;
  // The width for each hour.
  const hourWidth = plotWidth / 24;

  var ushape = {
    width: width,
    height: height,
    hourWidth: hourWidth,
    hourLabelWidth: hourLabelWidth,
    utcFirstLabelX: hourLabelStartX,
    dayWidth: plotWidth,
    dayHeight: plotHeight,
    siderealHourWidth: canvasConstants.siderealRatio * hourWidth
  };
  return { ...state, ...ushape };
};

const Source = function(props) {
  // This is a way to output different types of source graphics.

  // Parameters controlling the appearance of the source bars.
  // How thick to make the horizontal line for the source.
  const lineWidth = 6;
  // How thick to make the line at each elevation indicator.
  const barWidth = 3;
  // An indicative height for the elevation indicator plus text
  // on top and bottom.
  const barHeight = 30;
  // A minimum spacing between labels.
  const minLabelSpace = 10;

  // COMPUTED: the level for the top part of the elevation
  // indicator lines.
  const barTop = props.middleLevel - barHeight / 3;
  // COMPUTED: the level for the bottom part of the elevation
  // indicator lines.
  const barBottom = props.middleLevel + barHeight / 3;
  // COMPUTED: the level for the top time label.
  const timeLabelTop = props.middleLevel - barHeight;
  // COMPUTED: the level for the bottom time label.
  const timeLabelBottom = props.middleLevel + barHeight / 2;

  // We keep references for our time labels so we can move them
  // around later on.
  const riseUTCRefs = useRef([0, 0, 0].map(() => createRef()));
  const riseLSTRefs = useRef([0, 0, 0].map(() => createRef()));
  const setUTCRefs = useRef([0, 0, 0].map(() => createRef()));
  const setLSTRefs = useRef([0, 0, 0].map(() => createRef()));

  useEffect(() => {
    // This effect is to move the labels around after they're drawn.
    const getBox = function(ref) {
      if (ref !== null) {
        return {
          p: ref.absolutePosition(),
          w: ref.width()
        };
      } else {
        return {
          p: { x: 0, y: 0 },
          w: 0
        };
      }
    };

    const spaceLabel = function(ref, plotX, idx1, idx2, dir) {
      var b0 = getBox(ref.current[idx1].current);
      var b1 = getBox(ref.current[idx2].current);
      if (b0.w === 0 || b1.w === 0) {
        return;
      }
      // Check they're in the right order.
      if (
        (dir === "left" && plotX[idx2] < plotX[idx1]) ||
        (dir === "right" && plotX[idx1] < plotX[idx2])
      ) {
        return;
      }
      var dx = b1.p.x - b1.w / 2 - (b0.p.x + b0.w / 2);
      if (dir === "right") {
        dx = b0.p.x - b0.w / 2 - (b1.p.x + b1.w / 2);
      }
      dx -= minLabelSpace;
      if (dx < 0) {
        if (dir === "right") {
          dx *= -1;
        }
        ref.current[idx1].current.move({ x: dx, y: 0 });
      }
    };

    const shiftLabel = function(ref, plotX, dir) {
      // First, move these labels by half their width to align them,
      // if required.
      if (ref.current[0].current) {
        ref.current.forEach((r, i) => {
          var b = getBox(r.current);
          if (b.w > 0 && b.p.x === plotX[i]) {
            var dx = -b.w / 2;
            r.current.move({ x: dx, y: 0 });
          }
        });
        // Next, move the labels if they overlap.
        if (ref.current.length > 1) {
          // Move the outermost label.
          spaceLabel(ref, plotX, 0, 1, dir);
          if (ref.current.length > 2) {
            spaceLabel(ref, plotX, 2, 1, dir === "left" ? "right" : "left");
          }
        }
      }
    };

    shiftLabel(riseUTCRefs, props.riseX, "left");
    shiftLabel(riseLSTRefs, props.riseX, "left");
    shiftLabel(setUTCRefs, props.setX, "right");
    shiftLabel(setLSTRefs, props.setX, "right");
  });

  if (props.setX === props.riseX) {
    return null;
  }

  if (props.name === "Sun") {
    var sunFillColour = "#666666";
    var sunFillOpacity = 0.5;
    // We plot the night time as a partially transparent rectangle.
    if (props.setX[0] < props.riseX[0]) {
      return (
        <Rect
          x={props.setX[0]}
          y={props.topLevel}
          width={props.riseX[0] - props.setX[0]}
          height={props.fullHeight}
          fill={sunFillColour}
          opacity={sunFillOpacity}
          key="sunRect0"
        />
      );
    } else {
      return (
        <Fragment key="sunGroup">
          <Rect
            x={props.setX[0]}
            y={props.topLevel}
            width={props.rightSide - props.setX[0]}
            height={props.fullHeight}
            fill={sunFillColour}
            opacity={sunFillOpacity}
            key="sunRect0"
          />
          <Rect
            x={props.leftSide}
            y={props.topLevel}
            width={props.riseX[0] - props.leftSide}
            height={props.fullHeight}
            fill={sunFillColour}
            opacity={sunFillOpacity}
            key="sunRect1"
          />
        </Fragment>
      );
    }
  } else {
    const caps = (
      <Fragment key={"riseCapsGroup" + props.name}>
        {props.riseX.map((x, i) => (
          <Fragment key={"riseCaps" + props.name + "_" + i}>
            <Line
              points={[x, barTop, x, barBottom]}
              stroke={props.colors[i]}
              strokeWidth={barWidth}
              key={"sourceRiseBar" + i}
            />
            <Line
              points={[props.setX[i], barTop, props.setX[i], barBottom]}
              stroke={props.colors[i]}
              strokeWidth={barWidth}
              key={"sourceSetBar" + i}
            />
            <Text
              x={x}
              y={timeLabelBottom}
              text={floatToHourLabel(props.riseLST[i])}
              align="center"
              fontSize={props.fontSize}
              key={"sourceRiseLabelLST" + i}
              fill={props.colors[i]}
              ref={riseLSTRefs.current[i]}
            />
            <Text
              x={props.setX[i]}
              y={timeLabelBottom}
              text={floatToHourLabel(props.setLST[i])}
              align="center"
              fontSize={props.fontSize}
              key={"sourceSetLabelLST" + i}
              fill={props.colors[i]}
              ref={setLSTRefs.current[i]}
            />
            <Text
              x={x}
              y={timeLabelTop}
              text={floatToHourLabel(props.riseTime[i])}
              align="center"
              height={barHeight / 2}
              fontSize={props.fontSize}
              verticalAlign="top"
              key={"sourceRiseLabelUTC" + i}
              fill={props.colors[i]}
              ref={riseUTCRefs.current[i]}
            />
            <Text
              x={props.setX[i]}
              y={timeLabelTop}
              text={floatToHourLabel(props.setTime[i])}
              align="center"
              height={barHeight / 2}
              fontSize={props.fontSize}
              verticalAlign="top"
              key={"sourceSetLabelUTC" + i}
              fill={props.colors[i]}
              ref={setUTCRefs.current[i]}
            />
          </Fragment>
        ))}
      </Fragment>
    );
    const bars = (
      <Fragment key={"barsGroup" + props.name}>
        {props.riseX.map((r, i) => {
          if (props.riseX[i] < props.setX[i]) {
            return (
              <Line
                points={[
                  props.riseX[i],
                  props.middleLevel,
                  props.setX[i],
                  props.middleLevel
                ]}
                stroke={props.colors[i]}
                strokeWidth={lineWidth}
                key={"src" + props.name + "el" + i}
              />
            );
          } else {
            return (
              <Fragment key={"barsDouble" + props.name + "_" + i}>
                <Line
                  points={[
                    props.leftSide,
                    props.middleLevel,
                    props.setX[i],
                    props.middleLevel
                  ]}
                  stroke={props.colors[i]}
                  strokeWidth={lineWidth}
                  key={"src" + props.name + "el" + i + "seg0"}
                />
                <Line
                  points={[
                    props.riseX[i],
                    props.middleLevel,
                    props.rightSide,
                    props.middleLevel
                  ]}
                  stroke={props.colors[i]}
                  strokeWidth={lineWidth}
                  key={"src" + props.name + "el" + i + "seg1"}
                />
              </Fragment>
            );
          }
        })}
      </Fragment>
    );
    // Text in the margins.
    const marginText = (
      <Fragment key={"nameTextGroup" + props.name}>
        <Text
          x={0}
          y={props.middleLevel - props.fontSize / 2}
          text={props.name}
          draggable={true}
          onDragEnd={props.reorderFunction}
          fontSize={props.fontSize}
          width={props.leftSide - props.fontSize / 5}
          align="right"
          height={props.fontSize}
          verticalAlign="middle"
          key={"sourcenameText" + props.name}
        />
      </Fragment>
    );
    return [bars, caps, marginText];
  }
};

const DayPlotter = function(props) {
  // The list of all the hours that we label.
  var hours = [];
  var allHours = [];
  var hourSpacing = 2;
  for (var i = 0; i <= 24; i++) {
    if (i < 24) {
      allHours.push(i);
    }
    if (i % hourSpacing === 0) {
      hours.push(i);
    }
  }

  const [canvasParameters, canvasDispatch] = useReducer(calculateLengths, {
    width: props.width,
    height: 0,
    nLabelledHours: hours.length,
    hourWidth: 0,
    hourLabelWidth: 0,
    utcFirstLabelX: 0,
    dayWidth: 0,
    dayHeight: 0,
    siderealHourWidth: 0,
    topTitleHeight: 0,
    bottomTitleHeight: 0,
    leftLabelWidth: 0,
    rightLabelWidth: 0,
    textSize: 0,
    sourceHeight: 0,
    siderealRatio: 0
  });

  const LSTToX = function(l) {
    if (!Array.isArray(l)) {
      var dh = turnFraction(l / 24 - props.skyTime.zeroLST);
      return (
        canvasParameters.leftLabelWidth +
          24 * dh * canvasParameters.siderealHourWidth || 0.0
      );
    } else {
      dh = l.map(a => turnFraction(a / 24 - props.skyTime.zeroLST));
      return dh.map(
        a =>
          canvasParameters.leftLabelWidth +
            24 * a * canvasParameters.siderealHourWidth || 0.0
      );
    }
  };

  const LSTToTime = function(l) {
    // This routine makes use of the fact that 0 in whatever
    // time frame we've been asked to plot is on our left edge.
    var x = LSTToX(l);
    if (!Array.isArray(x)) {
      var dx = x - canvasParameters.leftLabelWidth;
      return (24 * dx) / canvasParameters.dayWidth;
    } else {
      dx = x.map(a => a - canvasParameters.leftLabelWidth);
      return dx.map(a => (24 * a) / canvasParameters.dayWidth);
    }
  };

  var sourceHeights = {};

  const reorderSources = function(e) {
    // This function is called if the user drags a source name somewhere
    // on the canvas, expecting to reorder the plot.
    // What position would this now be in?
    var dy = floorz(
      (e.currentTarget._lastPos.y - sourceHeights[e.target.attrs.text]) /
        canvasParameters.sourceHeight
    );
    if (dy === 0) {
      // No change.
      return;
    }
    var usources = [...props.sources];
    usources.shift();
    var cidx = -1;
    for (var i = 0; i < usources.length; i++) {
      if (usources[i].name === e.target.attrs.text) {
        cidx = i;
      }
    }
    if (cidx >= 0) {
      var nidx = cidx + dy;
      if (nidx < 0) {
        nidx = 0;
      }
      if (nidx >= usources.length) {
        nidx = usources.length - 1;
      }
      var o = usources.splice(cidx, 1);
      usources.splice(nidx, 0, o[0]);
      // Move the label to the correct place in X.
      e.currentTarget.move({ x: -e.currentTarget._lastPos.x, y: 0 });
      props.setUserSources(usources);
    }
  };

  useEffect(() => {
    // Work out the number of non-hidden sources.
    canvasDispatch({
      width: props.width,
      nSources: props.sources.reduce((t, s) => (s.hidden ? t : t + 1), 0)
    });
  }, [props.width, props.sources]);

  var nHidden = 0;
  return (
    <Stage width={canvasParameters.width} height={canvasParameters.height}>
      <Layer>
        <Rect
          x={0}
          y={0}
          width={canvasParameters.width}
          height={canvasParameters.height}
          fill="white"
        />
        <Rect
          x={canvasParameters.leftLabelWidth}
          y={canvasParameters.topTitleHeight}
          width={canvasParameters.dayWidth}
          height={canvasParameters.dayHeight}
          stroke="black"
          strokeWidth={2}
        />
        <Rect
          x={0}
          y={0}
          width={canvasParameters.width - 4}
          height={
            canvasParameters.topTitleHeight - 1.2 * canvasParameters.textSize
          }
          stroke="black"
          strokeWidth={2}
        />
        <Text
          x={5}
          y={2}
          height={1.1 * canvasParameters.textSize}
          verticalAlign="middle"
          fontSize={canvasParameters.textSize}
          text={"Observatory: " + props.location.name}
        />
        <Text
          x={canvasParameters.width - 150}
          y={2}
          height={1.1 * canvasParameters.textSize}
          verticalAlign="middle"
          fontSize={canvasParameters.textSize}
          text={formatDate(props.date)}
          width={142}
          align="right"
        />
        <Text
          x={5}
          y={1.2 * canvasParameters.textSize}
          height={1.1 * canvasParameters.textSize}
          verticalAlign="middle"
          fontSize={canvasParameters.textSize}
          text={
            "  Sun rise (" +
            props.sourceDetails[0].elLimits[0].elevation +
            "°): " +
            floatToHourLabel(LSTToTime(props.sourceDetails[0].rise[0])) +
            " (" +
            floatToHourLabel(props.sourceDetails[0].rise[0]) +
            ")" +
            " set: " +
            floatToHourLabel(LSTToTime(props.sourceDetails[0].set[0])) +
            " (" +
            floatToHourLabel(props.sourceDetails[0].set[0]) +
            ") UTC (LST)"
          }
        />
        <Text
          x={0}
          y={canvasParameters.topTitleHeight - 1.1 * canvasParameters.textSize}
          text="UTC"
          height={canvasParameters.textSize}
          verticalAlign="middle"
          fontSize={canvasParameters.textSize}
        />
        {props.sourceDetails.length > 1 ? (
          <Fragment>
            <Text
              x={0}
              y={canvasParameters.topTitleHeight}
              text={"EL:"}
              fontSize={canvasParameters.textSize}
              width={canvasParameters.leftLabelWidth / 4}
              align="left"
            />
            {props.sourceDetails[1].elLimits.map((c, i) => (
              <Text
                x={((i + 1) * canvasParameters.leftLabelWidth) / 4}
                y={canvasParameters.topTitleHeight}
                text={c.elevation + "°"}
                width={canvasParameters.leftLabelWidth / 4}
                align="left"
                fill={c.color}
                fontSize={canvasParameters.textSize}
                key={"ellimitText" + i}
              />
            ))}
          </Fragment>
        ) : null}
        <Text
          x={0}
          y={canvasParameters.topTitleHeight + canvasParameters.dayHeight}
          text="LST"
          height={canvasParameters.bottomTitleHeight}
          verticalAlign="middle"
          fontSize={canvasParameters.textSize}
        />
        {hours.map((h, i) => (
          <Text
            x={
              canvasParameters.utcFirstLabelX +
              i * canvasParameters.hourLabelWidth
            }
            y={
              canvasParameters.topTitleHeight - 1.1 * canvasParameters.textSize
            }
            key={"utcHour" + h}
            text={"" + h}
            height={canvasParameters.textSize}
            width={canvasParameters.hourLabelWidth}
            verticalAlign="middle"
            align="center"
            fontSize={canvasParameters.textSize}
          />
        ))}
        {allHours.map((h, i) => (
          <Rect
            x={canvasParameters.leftLabelWidth + i * canvasParameters.hourWidth}
            y={canvasParameters.topTitleHeight}
            width={canvasParameters.hourWidth}
            height={canvasParameters.dayHeight}
            fill={i % 2 ? "#eaeaea" : "#ffffff"}
            stroke="black"
            strokeWidth={0}
            key={"hourShade" + i}
          />
        ))}
        {hours.map((h, i) =>
          h < 24 ? (
            <Fragment key={"hoursGroup" + i}>
              <Text
                x={LSTToX(h) - canvasParameters.hourLabelWidth / 2}
                y={canvasParameters.topTitleHeight + canvasParameters.dayHeight}
                text={"" + h}
                width={canvasParameters.hourLabelWidth}
                height={canvasParameters.bottomTitleHeight}
                verticalAlign="middle"
                align="center"
                fontSize={canvasParameters.textSize}
                key={"lstHour" + h}
              />
              <Line
                points={[
                  LSTToX(h),
                  canvasParameters.topTitleHeight,
                  LSTToX(h),
                  canvasParameters.topTitleHeight + canvasParameters.dayHeight
                ]}
                strokeWidth={1}
                stroke="black"
                dash={[11, 11]}
                key={"lstHourLine" + h}
              />
            </Fragment>
          ) : null
        )}
        {props.sourceDetails.map((d, i) => {
          if (
            Array.isArray(d.rise) &&
            Array.isArray(d.set) &&
            i < props.sources.length &&
            !props.sources[i].hidden
          ) {
            var midLevel =
              canvasParameters.topTitleHeight +
              (i - 1 - nHidden) * canvasParameters.sourceHeight +
              canvasParameters.sourceHeight / 2;
            sourceHeights[props.sources[i].name] = midLevel;
            return (
              <Source
                name={props.sources[i].name}
                key={"source_" + props.sources[i].name}
                riseX={LSTToX(d.rise)}
                riseLST={d.rise}
                riseTime={LSTToTime(d.rise)}
                setX={LSTToX(d.set)}
                setLST={d.set}
                setTime={LSTToTime(d.set)}
                colors={d.colors}
                topLevel={canvasParameters.topTitleHeight}
                fullHeight={canvasParameters.dayHeight}
                fullWidth={canvasParameters.dayWidth}
                rightSide={
                  canvasParameters.leftLabelWidth + canvasParameters.dayWidth
                }
                leftSide={canvasParameters.leftLabelWidth}
                sourceHeight={canvasParameters.sourceHeight}
                middleLevel={midLevel}
                fontSize={canvasParameters.textSize}
                reorderFunction={reorderSources}
              />
            );
          } else if (i < props.sources.length && props.sources[i].hidden) {
            nHidden++;
            return null;
          } else {
            return null;
          }
        })}
      </Layer>
    </Stage>
  );
};

export { DayPlotter };
