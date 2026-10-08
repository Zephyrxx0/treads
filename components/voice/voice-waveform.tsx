'use client';

import React, { useEffect, useRef } from 'react';

export interface VoiceWaveformProps {
  analyser?: AnalyserNode | null;
  isRecording?: boolean;
  className?: string;
}

export function VoiceWaveform({
  analyser,
  isRecording = false,
  className = '',
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const barCount = 28;
    const barWidth = 3;
    const barGap = 3;

    // Buffer for analyser data if active
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isRecording && analyser) {
        analyser.getByteFrequencyData(dataArray);
      }

      // Center the equalizer bars horizontally
      const totalWidth = barCount * (barWidth + barGap) - barGap;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4; // Baseline height

        if (isRecording && analyser) {
          // Sample across frequency spectrum with weighting
          const index = Math.floor((i / barCount) * (bufferLength / 2));
          const val = dataArray[index] || 0;
          barHeight = Math.max(4, (val / 255) * (height - 8));
        } else if (isRecording) {
          // Simulated subtle movement if analyser is warming up
          barHeight = 4 + Math.sin(Date.now() / 200 + i) * 6;
        }

        const x = startX + i * (barWidth + barGap);
        const y = (height - barHeight) / 2;

        // Gradient from #F35C2B (terracotta) to #FF8C66
        const gradient = ctx.createLinearGradient(0, y + barHeight, 0, y);
        gradient.addColorStop(0, '#F35C2B');
        gradient.addColorStop(1, '#FF8C66');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Draw rounded pill bar
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={48}
      className={`w-full max-w-[220px] h-12 ${className}`}
    />
  );
}
