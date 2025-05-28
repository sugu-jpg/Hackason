'use client';

import { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  ActionManager,
  KeyboardEventTypes,
  Mesh,
} from '@babylonjs/core';

const BabylonScene = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    // カメラ設定
    const camera = new FreeCamera('camera', new Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.2;

    // ライト
    new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    // 敵生成（カメラの周囲にランダム配置）
    const enemyCount = 30;
    const radius = 10;
    const enemies: Mesh[] = [];

    for (let i = 0; i < enemyCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.random() * Math.PI;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const enemy = MeshBuilder.CreateSphere(`enemy-${i}`, { diameter: 1 }, scene);
      enemy.position = new Vector3(x, y, z);

      const mat = new StandardMaterial(`mat-${i}`, scene);
      mat.diffuseColor = Color3.Red();
      enemy.material = mat;

      enemies.push(enemy);
    }

    // キー操作
    const inputMap: Record<string, boolean> = {};
    scene.actionManager = new ActionManager(scene);

    scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        inputMap[key] = true;
      } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
        inputMap[key] = false;
      }
    });

    // 毎フレーム処理
    scene.onBeforeRenderObservable.add(() => {
      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());

      if (inputMap['w']) camera.position.addInPlace(forward.scale(camera.speed));
      if (inputMap['s']) camera.position.addInPlace(forward.scale(-camera.speed));
      if (inputMap['a']) camera.position.addInPlace(right.scale(-camera.speed));
      if (inputMap['d']) camera.position.addInPlace(right.scale(camera.speed));

      // 衝突判定（各敵とカメラとの距離チェック）
      for (const enemy of enemies) {
        const dist = Vector3.Distance(enemy.position, camera.position);
        if (dist < 1.0) {
          camera.position = new Vector3(0, 1.6, 0);
          alert('敵にぶつかりました！');
          break;
        }
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener('resize', () => engine.resize());

    return () => {
      engine.dispose();
      window.removeEventListener('resize', () => engine.resize());
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block' }} />;
};

export default BabylonScene;
