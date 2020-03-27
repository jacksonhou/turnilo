/*
 * Copyright 2015-2016 Imply Data, Inc.
 * Copyright 2017-2019 Allegro.pl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from "react";
import { Clicker } from "../../../common/models/clicker/clicker";
import { Dimension } from "../../../common/models/dimension/dimension";
import { Essence } from "../../../common/models/essence/essence";
import { SeriesSortOn, SortOn } from "../../../common/models/sort-on/sort-on";
import { Timekeeper } from "../../../common/models/timekeeper/timekeeper";
import { mapTruthy } from "../../../common/utils/functional/functional";
import { STRINGS } from "../../config/constants";
import { DragManager } from "../../utils/drag-manager/drag-manager";
import { createTeleporter } from "../../utils/teleporter/teleporter";
import { PinboardMeasureTile } from "../pinboard-measure-tile/pinboard-measure-tile";
import { PinboardTile } from "../pinboard-tile/pinboard-tile";
import { SvgIcon } from "../svg-icon/svg-icon";
import "./pinboard-panel.scss";

export interface PinboardPanelProps {
  clicker: Clicker;
  essence: Essence;
  timekeeper: Timekeeper;
  style?: React.CSSProperties;
}

export interface PinboardPanelState {
  dragOver?: boolean;
}

const Legend = createTeleporter();

export const LegendSpot = Legend.Source;

export class PinboardPanel extends React.Component<PinboardPanelProps, PinboardPanelState> {

  constructor(props: PinboardPanelProps) {
    super(props);
    this.state = {
      dragOver: false
    };
  }

  canDrop(): boolean {
    const dimension = DragManager.draggingDimension();
    return dimension && this.isStringOrBoolean(dimension) && !this.alreadyPinned(dimension);
  }

  isStringOrBoolean({ kind }: Dimension): boolean {
    return kind === "string" || kind === "boolean";
  }

  alreadyPinned({ name }: Dimension): boolean {
    return this.props.essence.pinnedDimensions.has(name);
  }

  dragEnter = (e: React.DragEvent<HTMLElement>) => {
    if (!this.canDrop()) return;
    e.preventDefault();
    this.setState({ dragOver: true });
  };

  dragOver = (e: React.DragEvent<HTMLElement>) => {
    if (!this.canDrop()) return;
    e.preventDefault();
  };

  dragLeave = () => {
    if (!this.canDrop()) return;
    this.setState({ dragOver: false });
  };

  drop = (e: React.DragEvent<HTMLElement>) => {
    if (!this.canDrop()) return;
    e.preventDefault();
    const dimension = DragManager.draggingDimension();
    if (dimension) {
      this.props.clicker.pin(dimension);
    }
    this.setState({ dragOver: false });
  };

  onPinboardSortOnSelect = (sortOn: SortOn) => {
    const { essence: { dataCube } } = this.props;
    const measure = dataCube.getMeasure(sortOn.key);
    this.props.clicker.changePinnedSortMeasure(measure);
  };

  render() {
    const { clicker, essence, timekeeper, style } = this.props;
    const { dragOver } = this.state;
    const { dataCube, pinnedDimensions } = essence;

    const pinnedSortMeasure = essence.getPinnedSortMeasure();
    const pinnedSortSeries = pinnedSortMeasure && essence.findConcreteSeries(pinnedSortMeasure.name);
    const pinnedSortSortOn = pinnedSortSeries && new SeriesSortOn(pinnedSortSeries);
    const pinboardTiles = mapTruthy(pinnedDimensions.toArray(), dimensionName => {
      const dimension = dataCube.getDimension(dimensionName);
      if (!dimension) return null;

      return <PinboardTile
        key={dimension.name}
        clicker={clicker}
        essence={essence}
        timekeeper={timekeeper}
        dimension={dimension}
        sortOn={pinnedSortSortOn}
        onClose={clicker.unpin ? clicker.unpin.bind(clicker, dimension) : null}
      />;
    });

    const showPlaceholder = !dragOver && !pinboardTiles.length;

    return <div
      className="pinboard-panel"
      onDragEnter={this.dragEnter}
      style={style}
    >
      <Legend.Target />
      <PinboardMeasureTile
        essence={essence}
        title={STRINGS.pinboard}
        sortOn={pinnedSortSortOn}
        onSelect={this.onPinboardSortOnSelect}
      />
      {pinboardTiles}
      {dragOver && <div className="drop-indicator-tile" />}
      {showPlaceholder && <div className="placeholder">
        <SvgIcon svg={require("../../icons/preview-pin.svg")} />
        <div className="placeholder-message">{STRINGS.pinboardPlaceholder}</div>
      </div>}
      {dragOver ? <div
        className="drag-mask"
        onDragOver={this.dragOver}
        onDragLeave={this.dragLeave}
        onDragExit={this.dragLeave}
        onDrop={this.drop}
      /> : null}
    </div>;
  }
}
