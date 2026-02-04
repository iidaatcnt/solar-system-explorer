'use client';

import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

type PlanetKey = 'sun' | 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

interface Planet {
  name: string;
  color: string;
  radius: number;
  distance: number;
  angle: number;
  speed: number;
  info: string;
  gravity: string;
  diameter: string;
  temperature: string;
}

const PLANETS_DATA: Record<PlanetKey, Planet> = {
  sun: { name: '☀️ 太陽', color: '#ffaa00', radius: 25, distance: 0, angle: 0, speed: 0, info: '太陽系の中心。全ての命の源。', gravity: '274.0 m/s² (27.96 G)', diameter: '1,392,700 km', temperature: '約 5,500 °C' },
  mercury: { name: '🟤 水星', color: '#a9a9a9', radius: 4, distance: 60, angle: 0, speed: 0.04, info: '太陽に最も近い惑星。大気はほとんどない。', gravity: '3.7 m/s² (0.38 G)', diameter: '4,879 km', temperature: '-170 ~ 430 °C' },
  venus: { name: '🟡 金星', color: '#e6e6fa', radius: 7, distance: 100, angle: 2, speed: 0.015, info: '最も高温な惑星。厚い雲に覆われている。', gravity: '8.87 m/s² (0.91 G)', diameter: '12,104 km', temperature: '約 462 °C' },
  earth: { name: '🔵 地球', color: '#1e90ff', radius: 7, distance: 140, angle: 4, speed: 0.01, info: '生命が存在する唯一の惑星。私たちの故郷。', gravity: '9.80 m/s² (1.00 G)', diameter: '12,742 km', temperature: '平均 15 °C' },
  mars: { name: '🔴 火星', color: '#ff4500', radius: 5, distance: 180, angle: 1, speed: 0.008, info: '赤い惑星。かつて水が存在した痕跡がある。', gravity: '3.71 m/s² (0.38 G)', diameter: '6,779 km', temperature: '平均 -63 °C' },
  jupiter: { name: '🟠 木星', color: '#daa520', radius: 18, distance: 260, angle: 3, speed: 0.003, info: '太陽系最大の巨大ガス惑星。', gravity: '24.79 m/s² (2.53 G)', diameter: '139,820 km', temperature: '平均 -110 °C' },
  saturn: { name: '🟡 土星', color: '#f4a460', radius: 15, distance: 340, angle: 5, speed: 0.002, info: '美しい環を持つ惑星。ガスでできている。', gravity: '10.44 m/s² (1.07 G)', diameter: '116,460 km', temperature: '平均 -140 °C' },
  uranus: { name: '🔷 天王星', color: '#00ced1', radius: 10, distance: 400, angle: 2, speed: 0.0015, info: '氷の巨大惑星。自転軸が横倒しになっている。', gravity: '8.69 m/s² (0.89 G)', diameter: '50,724 km', temperature: '平均 -195 °C' },
  neptune: { name: '🔵 海王星', color: '#00008b', radius: 10, distance: 460, angle: 6, speed: 0.001, info: '最も遠い惑星。強い嵐が吹き荒れている。', gravity: '11.15 m/s² (1.14 G)', diameter: '49,244 km', temperature: '平均 -200 °C' }
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game State Refs (High frequency updates)
  const spaceshipRef = useRef({ x: 160, y: 0, vx: 0, vy: 1.5, angle: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const mouseRef = useRef({ x: 0, y: 0 });
  const planetsRef = useRef(JSON.parse(JSON.stringify(PLANETS_DATA))); // Deep copy for mutable state
  const gameStateRef = useRef({
    isPaused: false,
    timeScale: 1,
    elapsedDays: 0,
    thrust: 50,
    zoom: 1,
    centerX: 0,
    centerY: 0,
    selectedPlanet: 'earth' as PlanetKey | null,
  });

  // UI State (Low frequency updates)
  const [selectedPlanetInfo, setSelectedPlanetInfo] = useState<Planet | null>(PLANETS_DATA.earth);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timeScale, setTimeScale] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const dayCountRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      gameStateRef.current.centerX = canvas.width / 2;
      gameStateRef.current.centerY = canvas.height / 2;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Input Handling
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) - gameStateRef.current.centerX;
      mouseRef.current.y = (e.clientY - rect.top) - gameStateRef.current.centerY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseRef.current.x = (touch.clientX - rect.left) - gameStateRef.current.centerX;
      mouseRef.current.y = (touch.clientY - rect.top) - gameStateRef.current.centerY;
      keysRef.current['w'] = true; // Auto thrust on touch
    };
    const handleTouchEnd = () => { keysRef.current['w'] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    // Game Loop
    let animationFrameId: number;

    const updateSpaceship = () => {
      if (gameStateRef.current.isPaused) return;

      const spaceship = spaceshipRef.current;
      const thrust = gameStateRef.current.thrust / 100 * 0.1;

      // Mouse Aiming
      const worldMouseX = mouseRef.current.x / gameStateRef.current.zoom;
      const worldMouseY = mouseRef.current.y / gameStateRef.current.zoom;
      spaceship.angle = Math.atan2(worldMouseY - spaceship.y, worldMouseX - spaceship.x);

      // Controls
      if (keysRef.current['w']) {
        spaceship.vx += Math.cos(spaceship.angle) * thrust;
        spaceship.vy += Math.sin(spaceship.angle) * thrust;
      }
      if (keysRef.current['s']) {
        spaceship.vx -= Math.cos(spaceship.angle) * thrust * 0.5;
        spaceship.vy -= Math.sin(spaceship.angle) * thrust * 0.5;
      }
      if (keysRef.current[' ']) {
        spaceship.vx *= 0.95;
        spaceship.vy *= 0.95;
      }

      // Gravity
      const currentPlanets = planetsRef.current;
      for (const key in currentPlanets) {
        const p = currentPlanets[key];
        const px = p.distance * Math.cos(p.angle);
        const py = p.distance * Math.sin(p.angle);
        const distX = px - spaceship.x;
        const distY = py - spaceship.y;
        const dist = Math.sqrt(distX * distX + distY * distY);

        if (dist > p.radius) {
          const gravityStrength = (p.radius * 20) / (dist * dist);
          spaceship.vx += (distX / dist) * gravityStrength;
          spaceship.vy += (distY / dist) * gravityStrength;
        }
      }

      spaceship.x += spaceship.vx;
      spaceship.y += spaceship.vy;
    };

    const updatePlanets = () => {
      if (gameStateRef.current.isPaused) return;
      gameStateRef.current.elapsedDays += gameStateRef.current.timeScale * 0.05;

      const currentPlanets = planetsRef.current;
      for (const key in currentPlanets) {
        if (key !== 'sun') {
          currentPlanets[key].angle += currentPlanets[key].speed * gameStateRef.current.timeScale * 0.1;
        }
      }
    };

    const draw = () => {
      // Clear
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const state = gameStateRef.current; // access current state

      // Stars
      const spaceship = spaceshipRef.current;
      const parallaxX = -spaceship.x * 0.1 * state.zoom + state.centerX;
      const parallaxY = -spaceship.y * 0.1 * state.zoom + state.centerY;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let i = 0; i < 150; i++) {
        const starX = ((i * 101 + parallaxX) % canvas.width + canvas.width) % canvas.width;
        const starY = ((i * 202 + parallaxY) % canvas.height + canvas.height) % canvas.height;
        const size = (i % 5 === 0) ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.arc(starX, starY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(state.centerX, state.centerY);
      ctx.scale(state.zoom, state.zoom);

      const currentPlanets = planetsRef.current;

      // Orbits
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
      ctx.lineWidth = 1 / state.zoom;
      for (const key in currentPlanets) {
        if (key !== 'sun') {
          const p = currentPlanets[key];
          ctx.beginPath();
          ctx.arc(0, 0, p.distance, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Planets
      for (const key in currentPlanets) {
        const p = currentPlanets[key];
        const x = p.distance * Math.cos(p.angle);
        const y = p.distance * Math.sin(p.angle);

        // Selection Line
        if (state.selectedPlanet === key) {
          ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
          ctx.lineWidth = 1 / state.zoom;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(x, y);
          ctx.stroke();
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        if (state.selectedPlanet === key) {
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2 / state.zoom;
          ctx.beginPath();
          ctx.arc(x, y, p.radius + 5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#fff';
          ctx.font = `${10 / state.zoom}px Arial`;
          ctx.fillText(p.name.split(' ')[1], x + p.radius + 8, y + 3);
        }
      }

      // Spaceship
      ctx.save();
      ctx.translate(spaceship.x, spaceship.y);
      ctx.rotate(spaceship.angle);

      // Jet
      if (keysRef.current['w']) {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(-6, -3);
        ctx.lineTo(-15 - Math.random() * 10, 0);
        ctx.lineTo(-6, 3);
        ctx.closePath();
        ctx.fill();
      }

      // Body
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-2, 0, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // restore spaceship rotation
      ctx.restore(); // restore global transform

      // UI Info Overlay on Canvas
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(state.isPaused ? '⏸️ PAUSED' : '▶️ PLAYING', canvas.width - 20, canvas.height - 20);
    };

    const loop = () => {
      updateSpaceship();
      updatePlanets();
      draw();

      // Update DOM Text directly for performance
      if (dayCountRef.current) {
        dayCountRef.current.innerText = `経過日数: ${Math.floor(gameStateRef.current.elapsedDays)}日`;
      }

      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // UI Handlers
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTimeScale(val);
    gameStateRef.current.timeScale = val;
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setZoomLevel(val);
    gameStateRef.current.zoom = val;
  };

  const togglePause = () => {
    const nextText = !isPaused;
    setIsPaused(nextText);
    gameStateRef.current.isPaused = nextText;
  };

  const handleReset = () => {
    gameStateRef.current.elapsedDays = 0;
    spaceshipRef.current = { x: 160, y: 0, vx: 0, vy: 1.5, angle: 0 };
    gameStateRef.current.zoom = 1;
    setZoomLevel(1);
  };

  const handleSelectPlanet = (key: PlanetKey) => {
    gameStateRef.current.selectedPlanet = key;
    setSelectedPlanetInfo({
      ...PLANETS_DATA[key],
      // Use live planet data for calculations if needed, but static data is fine for info panel
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a1a] text-white font-sans overflow-hidden">
      <Head>
        <title>太陽系探索</title>
      </Head>

      <header className="flex-shrink-0 bg-[#0a0e27]/95 border-b-[3px] border-[#00d4ff] p-4 flex justify-between items-center z-10">
        <div>
          <h1 className="text-2xl text-[#00d4ff] font-bold">🚀 太陽系探索シミュレーター</h1>
          <p className="text-xs text-[#00ff88]">マウスで宇宙船を操縦しよう！ [W]加速 [S]減速 [Space]ブレーキ</p>
        </div>
      </header>

      <main className="flex-1 flex gap-4 p-4 min-w-0 overflow-hidden relative">
        <div ref={containerRef} className="flex-1 min-w-0 border-2 border-[#00d4ff] rounded-xl bg-black shadow-[0_0_20px_rgba(0,212,255,0.2)] overflow-hidden relative">
          <canvas ref={canvasRef} id="canvas" className="block w-full h-full cursor-crosshair touch-none" />
        </div>

        <div className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto z-10">

          {/* Time Control Panel */}
          <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/30 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-[#00ff88] text-sm mb-2 border-b border-[#00ff88]/20 pb-1">⏱️ 時間制御</h3>
            <label className="block text-xs text-[#00d4ff] font-bold mb-1">
              時間速度: <span>{timeScale.toFixed(1)}</span>x
            </label>
            <input
              type="range"
              min="0.1" max="20" step="0.1"
              value={timeScale}
              onChange={handleTimeChange}
              className="w-full h-1.5 mb-4 cursor-pointer accent-[#00ff88] bg-white/10 rounded-full"
            />
            <div className="text-[11px] text-[#00d4ff] text-center mb-2 p-1 bg-[#00d4ff]/10 rounded">
              <span ref={dayCountRef}>経過日数: 0日</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff] rounded-md text-xs font-bold hover:bg-[#00d4ff] hover:text-black transition-colors">
                🔄 リセット
              </button>
              <button onClick={togglePause} className="flex-1 py-2 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff] rounded-md text-xs font-bold hover:bg-[#00d4ff] hover:text-black transition-colors">
                {isPaused ? '▶️ 再開' : '⏸️ 一時停止'}
              </button>
            </div>
          </div>

          {/* Planet Selection Panel */}
          <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/30 rounded-xl p-4 backdrop-blur-sm flex-1 flex flex-col">
            <h3 className="text-[#00ff88] text-sm mb-2 border-b border-[#00ff88]/20 pb-1">🪐 惑星選択</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Object.keys(PLANETS_DATA).map((key) => {
                const p = PLANETS_DATA[key as PlanetKey];
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectPlanet(key as PlanetKey)}
                    className="text-[10px] h-12 flex flex-col items-center justify-center gap-0.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/50 rounded hover:bg-[#00d4ff] hover:text-black transition-all"
                  >
                    <span>{p.name.split(' ')[0]}</span>
                    <span>{p.name.split(' ')[1]}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[#eeefff] bg-black/30 p-3 rounded border-l-2 border-[#00ff88] min-h-[80px]">
              {selectedPlanetInfo ? (
                <>
                  <div className="font-bold mb-1" style={{ color: selectedPlanetInfo.color }}>{selectedPlanetInfo.name}</div>
                  <div className="mb-2 leading-relaxed opacity-90">{selectedPlanetInfo.info}</div>
                  <div className="text-[10px] opacity-70 border-t border-white/10 pt-1 leading-tight flex flex-col gap-0.5">
                    <div className="flex justify-between"><span>太陽距離:</span> <span>{selectedPlanetInfo.distance * 100}万km</span></div>
                    <div className="flex justify-between"><span>公転周期:</span> <span>{selectedPlanetInfo.speed > 0 ? (365 / (selectedPlanetInfo.speed / 0.01)).toFixed(0) : '---'}日</span></div>
                    <div className="flex justify-between"><span>直径:</span> <span>{selectedPlanetInfo.diameter}</span></div>
                    <div className="flex justify-between"><span>重力:</span> <span>{selectedPlanetInfo.gravity}</span></div>
                    <div className="flex justify-between"><span>表面温度:</span> <span>{selectedPlanetInfo.temperature}</span></div>
                  </div>
                </>
              ) : '惑星を選択してください'}
            </div>
          </div>

          {/* Zoom Panel */}
          <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/30 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-[#00ff88] text-sm mb-2 border-b border-[#00ff88]/20 pb-1">📊 ズーム</h3>
            <label className="block text-xs text-[#00d4ff] font-bold mb-1">
              ズーム: <span>{zoomLevel.toFixed(1)}</span>x
            </label>
            <input
              type="range"
              min="0.2" max="3" step="0.1"
              value={zoomLevel}
              onChange={handleZoomChange}
              className="w-full h-1.5 cursor-pointer accent-[#00ff88] bg-white/10 rounded-full"
            />
          </div>

        </div>
      </main>
    </div>
  );
}
