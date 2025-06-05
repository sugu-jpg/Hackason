"use client";

import "@babylonjs/loaders";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { useEffect, useRef, useState } from "react";
import "@babylonjs/loaders/glTF";
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
  Tools,
  Quaternion,
  Matrix,
} from "@babylonjs/core";

const BabylonScene = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [orientation, setOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !permissionGranted) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera", new Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.2;
    camera.rotationQuaternion = Quaternion.Identity();

    const makeBox = (name: string, color: Color3, pos: Vector3) => {
      const box = MeshBuilder.CreateBox(name, { size: 20 }, scene);
      const mat = new StandardMaterial(`${name}-mat`, scene);
      mat.diffuseColor = color;
      box.material = mat;
      box.position = pos;
    };

    makeBox("front", Color3.Red(), new Vector3(0, 0, 30));
    makeBox("right", Color3.Green(), new Vector3(30, 0, 0));
    makeBox("left", Color3.Yellow(), new Vector3(-30, 0, 0));
    makeBox("back", Color3.Blue(), new Vector3(0, 0, -30));
    makeBox("top", Color3.White(), new Vector3(0, 30, 0));

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 2.0;

    const enemies: Mesh[] = [];
    const enemyStates = new Map<Mesh, Vector3>(); // 敵ごとの移動方向
    const enemyInitialPositions = new Map<Mesh, Vector3>(); // 敵の初期位置

    const radius = 10;
    const center = new Vector3(0, 1.6, 0);
    const minY = 0.5;
    const maxY = 3.5;

    for (let i = 0; i < 25; i++) {
      // X, Zは円周上に近いランダム位置
      const theta = Math.random() * 2 * Math.PI;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);

      // Y軸の高さだけランダムにする
      const y = Math.random() * (maxY - minY) + minY;

      SceneLoader.ImportMesh(
        "",
        "/models/",
        "ojisan3.glb",
        scene,
        (meshes) => {
          const enemy = meshes[0] as Mesh;
          enemy.position = new Vector3(x, y, z); // 高さをバラバラに設定
          enemy.scaling = new Vector3(2.0, 2.0, 2.0);
          enemy.lookAt(center);
          enemies.push(enemy);
          enemyStates.set(enemy, Vector3.Zero());
          enemyInitialPositions.set(enemy, enemy.position.clone());
        },
        undefined,
        (error) => {
          console.error("ojisan.glb 読み込み失敗:", error);
        }
      );
    }

    // 敵の移動方向を1秒ごとに更新
    setInterval(() => {
      enemies.forEach((enemy) => {
        const newDir = new Vector3(
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 0.8, // Y方向にもふらつかせる
          (Math.random() - 0.5) * 2.0
        );

        enemyStates.set(enemy, newDir);
      });
    }, 1000);

    const inputMap: Record<string, boolean> = {};
    scene.actionManager = new ActionManager(scene);
    scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      inputMap[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;
    });

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        const alpha = Tools.ToRadians(event.alpha);
        const beta = Tools.ToRadians(event.beta);
        const gamma = Tools.ToRadians(event.gamma);

        const rotationMatrix = Matrix.RotationYawPitchRoll(
          gamma,
          -beta + Math.PI / 2,
          alpha * 0.01
        );
        camera.rotationQuaternion =
          Quaternion.FromRotationMatrix(rotationMatrix);

        setOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        });
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    scene.onBeforeRenderObservable.add(() => {
      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());

      if (inputMap["w"])
        camera.position.addInPlace(forward.scale(camera.speed));
      if (inputMap["s"])
        camera.position.addInPlace(forward.scale(-camera.speed));
      if (inputMap["a"]) camera.position.addInPlace(right.scale(-camera.speed));
      if (inputMap["d"]) camera.position.addInPlace(right.scale(camera.speed));

      const playerPosition = new Vector3(0, 1.6, 0);

      enemies.forEach((enemy) => {
        const distance = Vector3.Distance(enemy.position, playerPosition);

        if (distance < 2.0) {
          camera.position = new Vector3(0, 1.6, 0);
          alert("敵にぶつかりました！");
          return;
        }

        const moveVec = enemyStates.get(enemy);
        if (moveVec) {
          enemy.position.addInPlace(moveVec.scale(0.02));

          // 高さ制限を追加（プレイヤー真上に来ないように）
          const maxHeight = 6.0;
          const minHeight = -1.2;
          if (enemy.position.y > maxHeight) enemy.position.y = maxHeight;
          if (enemy.position.y < minHeight) enemy.position.y = minHeight;

          // 近づきすぎたら離れ、遠すぎたら少し戻る
          if (distance < 8.0) {
            const away = enemy.position.subtract(playerPosition).normalize();
            const strength = 0.04 * (8.0 - distance);
            enemy.position.addInPlace(away.scale(strength));
          } else if (distance > 14.0) {
            const toCenter = playerPosition
              .subtract(enemy.position)
              .normalize();
            const strength = 0.007 * (distance - 14.0);
            enemy.position.addInPlace(toCenter.scale(strength));
          }

          enemy.lookAt(playerPosition); // 常に原点を向く
        }
      });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      engine.dispose();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [permissionGranted]);

  const requestPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const result = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (result === "granted") {
          setPermissionGranted(true);
        } else {
          alert("センサーの使用が拒否されました。");
        }
      } catch (err) {
        console.error("Permission error:", err);
        alert("センサーの許可に失敗しました。");
      }
    } else {
      setPermissionGranted(true);
    }
  };

  return (
    <>
      {!permissionGranted && (
        <button
          onClick={requestPermission}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "1em 2em",
            fontSize: "16px",
            zIndex: 20,
          }}
        >
          センサーを有効にする
        </button>
      )}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "10px",
          fontSize: "14px",
          borderRadius: "8px",
          zIndex: 10,
        }}
      >
        <div>Alpha（ヨー）: {orientation.alpha.toFixed(1)}°</div>
        <div>Beta（ピッチ）: {orientation.beta.toFixed(1)}°</div>
        <div>Gamma（ロール）: {orientation.gamma.toFixed(1)}°</div>
      </div>
    </>
  );
};

export default BabylonScene;
