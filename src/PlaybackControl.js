import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const PlaybackControl = ({
  totalTime,
  currentTime,
  onPlayPause,
  onSeek,
  isPlaying,
  playbackSpeed,
  onSpeedChange,
  eventMarks,
}) => {
  const handleSliderChange = (value) => {
    onSeek(value);
  };

  return (
    <div className="playback-control">
      <button onClick={onPlayPause}>{isPlaying ? "Pause" : "Play"}</button>

      <Slider
        min={0}
        max={totalTime}
        value={currentTime}
        onChange={handleSliderChange}
        marks={eventMarks}
        railStyle={{ backgroundColor: "lightgreen" }}
      />

      <label>
        Speed:
        <input
          type="number"
          value={playbackSpeed}
          onChange={(e) => onSpeedChange(e.target.value)}
          min="1"
          max="100"
          step="1"
        />
      </label>
    </div>
  );
};

export default PlaybackControl;
