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
import Link from "next/link";

const BabylonScene = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [orientation, setOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [enemyCount, setEnemyCount] = useState(0);
  const [hp, setHp] = useState(10);
  const [hits, setHits] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const gameOverRef = useRef(false); // 重複防止用のref
  const maxEnemies = 8;

  // ゲーム結果をAPIに送信する関数
  const submitGameResult = async (finalHits: number) => {
    if (isSubmitting) return; // 重複送信防止

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hits: finalHits,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("ゲーム結果が保存されました:", data);
      } else {
        console.error("ゲーム結果の保存に失敗:", data.error);
      }
    } catch (error) {
      console.error("APIエラー:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ゲームオーバー処理
  const handleGameOver = (finalHits: number) => {
    if (gameOverRef.current) return; // 既にゲームオーバー処理が実行済みの場合は何もしない

    gameOverRef.current = true;
    setGameOver(true);
    submitGameResult(finalHits);
  };

  useEffect(() => {
    if (!canvasRef.current || !permissionGranted || gameOver) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera", new Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.2;
    camera.rotationQuaternion = Quaternion.Identity();

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 2.0;

    const enemies: Mesh[] = [];
    const enemyStates = new Map<Mesh, Vector3>();
    const enemyInitialPositions = new Map<Mesh, Vector3>();

    // 弾丸関連
    const bullets: Mesh[] = [];
    const bulletVelocities = new Map<Mesh, Vector3>();

    // 敵の弾丸関連
    const enemyBullets: Mesh[] = [];
    const enemyBulletVelocities = new Map<Mesh, Vector3>();

    const radius = 10;
    const center = new Vector3(0, 1.6, 0);
    const minY = 0.5;
    const maxY = 3.5;

    // 敵をスポーンする関数
    const spawnEnemy = () => {
      if (gameOver) return; // ゲームオーバー時はスポーンしない

      const theta = Math.random() * 2 * Math.PI;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      const y = Math.random() * (maxY - minY) + minY;

      SceneLoader.ImportMesh(
        "",
        "/models/",
        "ojisan3.glb",
        scene,
        (meshes) => {
          if (gameOver) {
            // ゲームオーバー後にロードが完了した場合は即座に削除
            meshes.forEach((mesh) => mesh.dispose());
            return;
          }

          const enemy = meshes[0] as Mesh;
          enemy.position = new Vector3(x, y, z);
          enemy.scaling = new Vector3(2.0, 2.0, 2.0);
          enemy.lookAt(center);
          enemies.push(enemy);
          enemyStates.set(enemy, Vector3.Zero());
          enemyInitialPositions.set(enemy, enemy.position.clone());
          setEnemyCount(enemies.length);
        },
        undefined,
        (error) => {
          console.error("ojisan.glb 読み込み失敗:", error);
        }
      );
    };

    // 初期敵を生成
    for (let i = 0; i < maxEnemies; i++) {
      spawnEnemy();
    }

    // 弾丸を作成する関数
    const createBullet = (position: Vector3, direction: Vector3) => {
      if (gameOver) return;

      const bullet = MeshBuilder.CreateSphere(
        "bullet",
        { diameter: 0.2 },
        scene
      );
      const bulletMaterial = new StandardMaterial("bullet-mat", scene);
      bulletMaterial.diffuseColor = Color3.Red();
      bulletMaterial.emissiveColor = Color3.Red();
      bullet.material = bulletMaterial;
      bullet.position = position.clone();

      const bulletSpeed = 0.5;
      const velocity = direction.normalize().scale(bulletSpeed);

      bullets.push(bullet);
      bulletVelocities.set(bullet, velocity);

      setTimeout(() => {
        const index = bullets.indexOf(bullet);
        if (index > -1) {
          bullets.splice(index, 1);
          bulletVelocities.delete(bullet);
          bullet.dispose();
        }
      }, 5000);
    };

    // 敵の弾丸を作成する関数
    const createEnemyBullet = (position: Vector3, direction: Vector3) => {
      if (gameOver) return;

      const enemyBullet = MeshBuilder.CreateSphere(
        "enemyBullet",
        { diameter: 0.3 },
        scene
      );
      const enemyBulletMaterial = new StandardMaterial(
        "enemyBullet-mat",
        scene
      );
      enemyBulletMaterial.diffuseColor = Color3.Yellow();
      enemyBulletMaterial.emissiveColor = Color3.Yellow();
      enemyBullet.material = enemyBulletMaterial;
      enemyBullet.position = position.clone();

      const enemyBulletSpeed = 0.08;
      const velocity = direction.normalize().scale(enemyBulletSpeed);

      enemyBullets.push(enemyBullet);
      enemyBulletVelocities.set(enemyBullet, velocity);

      setTimeout(() => {
        const index = enemyBullets.indexOf(enemyBullet);
        if (index > -1) {
          enemyBullets.splice(index, 1);
          enemyBulletVelocities.delete(enemyBullet);
          enemyBullet.dispose();
        }
      }, 10000);
    };

    // 敵の移動方向を1秒ごとに更新
    const enemyMoveInterval = setInterval(() => {
      if (gameOver) {
        clearInterval(enemyMoveInterval);
        return;
      }

      enemies.forEach((enemy) => {
        const newDir = new Vector3(
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 2.0
        );
        enemyStates.set(enemy, newDir);
      });
    }, 1000);

    // 敵の数をチェックして新しい敵をスポーンさせる
    const spawnInterval = setInterval(() => {
      if (gameOver) {
        clearInterval(spawnInterval);
        return;
      }

      if (enemies.length < maxEnemies) {
        const spawnCount = Math.min(2, maxEnemies - enemies.length);
        for (let i = 0; i < spawnCount; i++) {
          spawnEnemy();
        }
      }
    }, 3000);

    // 敵が弾丸を発射
    const shootingInterval = setInterval(() => {
      if (gameOver || enemies.length === 0) {
        clearInterval(shootingInterval);
        return;
      }

      if (enemies.length > 0) {
        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        const directionToPlayer = camera.position
          .subtract(randomEnemy.position)
          .normalize();
        createEnemyBullet(randomEnemy.position, directionToPlayer);
      }
    }, Math.random() * 2000 + 2000);

    const inputMap: Record<string, boolean> = {};
    let spacePressed = false;

    scene.actionManager = new ActionManager(scene);
    scene.onKeyboardObservable.add((kbInfo) => {
      if (gameOver) return;

      const key = kbInfo.event.key.toLowerCase();
      const isKeyDown = kbInfo.type === KeyboardEventTypes.KEYDOWN;

      inputMap[key] = isKeyDown;

      if (key === " " && isKeyDown && !spacePressed) {
        spacePressed = true;
        const bulletStartPos = camera.position.clone();
        const bulletDirection = camera.getDirection(Vector3.Forward());
        createBullet(bulletStartPos, bulletDirection);
      } else if (key === " " && !isKeyDown) {
        spacePressed = false;
      }
    });

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (gameOver) return;

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
      if (gameOver) return;

      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());

      if (inputMap["w"])
        camera.position.addInPlace(forward.scale(camera.speed));
      if (inputMap["s"])
        camera.position.addInPlace(forward.scale(-camera.speed));
      if (inputMap["a"]) camera.position.addInPlace(right.scale(-camera.speed));
      if (inputMap["d"]) camera.position.addInPlace(right.scale(camera.speed));

      const playerPosition = new Vector3(0, 1.6, 0);

      // 弾丸の移動処理
      for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const velocity = bulletVelocities.get(bullet);

        if (velocity) {
          bullet.position.addInPlace(velocity);

          // 弾丸が敵に当たったかチェック
          for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const distance = Vector3.Distance(bullet.position, enemy.position);

            if (distance < 1.5) {
              enemies.splice(j, 1);
              enemyStates.delete(enemy);
              enemyInitialPositions.delete(enemy);
              enemy.dispose();
              setEnemyCount(enemies.length);
              setHits((prevHits) => prevHits + 1);

              bullets.splice(i, 1);
              bulletVelocities.delete(bullet);
              bullet.dispose();

              break;
            }
          }

          // プレイヤーの弾丸が敵の弾丸に当たったかチェック
          for (let k = enemyBullets.length - 1; k >= 0; k--) {
            const enemyBullet = enemyBullets[k];
            const distance = Vector3.Distance(
              bullet.position,
              enemyBullet.position
            );

            if (distance < 0.4) {
              enemyBullets.splice(k, 1);
              enemyBulletVelocities.delete(enemyBullet);
              enemyBullet.dispose();

              bullets.splice(i, 1);
              bulletVelocities.delete(bullet);
              bullet.dispose();

              break;
            }
          }

          if (Vector3.Distance(bullet.position, playerPosition) > 50) {
            bullets.splice(i, 1);
            bulletVelocities.delete(bullet);
            bullet.dispose();
          }
        }
      }

      // 敵の弾丸の移動処理
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const enemyBullet = enemyBullets[i];
        const velocity = enemyBulletVelocities.get(enemyBullet);

        if (velocity) {
          enemyBullet.position.addInPlace(velocity);

          // 敵の弾丸がプレイヤーに当たったかチェック
          const distanceToPlayer = Vector3.Distance(
            enemyBullet.position,
            camera.position
          );
          if (distanceToPlayer < 1.0) {
            setHp((prevHp) => {
              const newHp = prevHp - 1;
              console.log("HP reduced to:", newHp);
              if (newHp <= 0) {
                // HPが0になったらゲームオーバー処理を実行（一度だけ）
                if (!gameOverRef.current) {
                  setHits((currentHits) => {
                    handleGameOver(currentHits);
                    return currentHits;
                  });
                }
              }
              return newHp;
            });

            enemyBullets.splice(i, 1);
            enemyBulletVelocities.delete(enemyBullet);
            enemyBullet.dispose();
            continue;
          }

          if (Vector3.Distance(enemyBullet.position, playerPosition) > 50) {
            enemyBullets.splice(i, 1);
            enemyBulletVelocities.delete(enemyBullet);
            enemyBullet.dispose();
          }
        }
      }

      enemies.forEach((enemy) => {
        const distance = Vector3.Distance(enemy.position, playerPosition);

        if (distance < 2.0) {
          camera.position = new Vector3(0, 1.6, 0);
          return;
        }

        const moveVec = enemyStates.get(enemy);
        if (moveVec) {
          enemy.position.addInPlace(moveVec.scale(0.02));

          const maxHeight = 6.0;
          const minHeight = -1.2;
          if (enemy.position.y > maxHeight) enemy.position.y = maxHeight;
          if (enemy.position.y < minHeight) enemy.position.y = minHeight;

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

          enemy.lookAt(playerPosition);
        }
      });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      // クリーンアップ時にインターバルをクリア
      clearInterval(enemyMoveInterval);
      clearInterval(spawnInterval);
      clearInterval(shootingInterval);

      engine.dispose();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [permissionGranted, gameOver]);

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

  // ゲームリスタート機能
  const restartGame = () => {
    gameOverRef.current = false; // refもリセット
    setHp(10);
    setHits(0);
    setGameOver(false);
    setIsSubmitting(false);
    setEnemyCount(0);
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

      {gameOver && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "2em",
            borderRadius: "10px",
            zIndex: 30,
            textAlign: "center",
          }}
        >
          <h2>ゲームオーバー！</h2>
          <p>ヒット数: {hits}</p>
          {isSubmitting ? (
            <p>結果を保存中...</p>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                onClick={restartGame}
                style={{
                  padding: "1em 2em",
                  fontSize: "16px",
                  marginTop: "1em",
                  cursor: "pointer",
                }}
              >
                もう一度プレイ
              </button>
              <Link href="/ranking">
                <button
                  onClick={restartGame}
                  style={{
                    padding: "1em 2em",
                    fontSize: "16px",
                    marginTop: "1em",
                    cursor: "pointer",
                  }}
                >
                  ランキングへ
                </button>
              </Link>
              <Link href="/mypage">
                <button
                  onClick={restartGame}
                  style={{
                    padding: "1em 2em",
                    fontSize: "16px",
                    marginTop: "1em",
                    cursor: "pointer",
                  }}
                >
                  マイページへ
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100vh", display: "block" }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 15,
          pointerEvents: "none",
          backgroundColor: "transparent",
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
        className="relative"
      >
        <div className="absolute left-[20%] top-[3vw]">
          <img
            src={"image/hits.webp"}
            alt="ヒット数画像"
            style={{
              width: "20vw",
              pointerEvents: "none",
            }}
          />
          <div className="absolute md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl top-[20%] right-12">
            {hits}
          </div>
        </div>

        <img
          src={"image/" + hp + ".webp"}
          alt="HP画像"
          style={{
            width: "20vw",
            objectFit: "cover",
            pointerEvents: "none",
          }}
          className="absolute right-[20%] top-[3vw]"
        />
        <img
          src="image/pit.webp"
          alt="オーバーレイ画像"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
        />
      </div>
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
        <div style={{ marginTop: "10px", fontSize: "12px" }}>
          <div>操作方法:</div>
          <div>WASD: 移動</div>
          <div>スペース: 弾丸発射</div>
          <div>
            敵数: {enemyCount}/{maxEnemies}
          </div>
          {gameOver && <div style={{ color: "red" }}>ゲームオーバー</div>}
        </div>
      </div>
    </>
  );
};

export default BabylonScene;
