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
  ParticleSystem,
  Texture,
  Color4,
  Animation,
} from "@babylonjs/core";

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
  const maxEnemies = 8;

  useEffect(() => {
    if (!canvasRef.current || !permissionGranted) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera", new Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.2;
    camera.rotationQuaternion = Quaternion.Identity();

    // const makeBox = (name: string, color: Color3, pos: Vector3) => {
    //   const box = MeshBuilder.CreateBox(name, { size: 20 }, scene);
    //   const mat = new StandardMaterial(`${name}-mat`, scene);
    //   mat.diffuseColor = color;
    //   box.material = mat;
    //   box.position = pos;
    // };

    // makeBox("front", Color3.Red(), new Vector3(0, 0, 30));
    // makeBox("right", Color3.Green(), new Vector3(30, 0, 0));
    // makeBox("left", Color3.Yellow(), new Vector3(-30, 0, 0));
    // makeBox("back", Color3.Blue(), new Vector3(0, 0, -30));
    // makeBox("top", Color3.White(), new Vector3(0, 30, 0));

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 2.0;

    const enemies: Mesh[] = [];
    const enemyStates = new Map<Mesh, Vector3>(); // 敵ごとの移動方向
    const enemyInitialPositions = new Map<Mesh, Vector3>(); // 敵の初期位置

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

    // 爆破エフェクトを作成する関数
    const createExplosion = (position: Vector3) => {
      // シンプルな爆破パーティクル
      const explosionParticles = new ParticleSystem("explosionParticles", 30, scene);
      explosionParticles.particleTexture = new Texture("https://playground.babylonjs.com/textures/flare.png", scene);
      explosionParticles.emitter = position;
      explosionParticles.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
      explosionParticles.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
      explosionParticles.color1 = new Color4(1, 0.7, 0.3, 1.0); // 薄いオレンジ
      explosionParticles.color2 = new Color4(0.8, 0.4, 0.1, 1.0); // 薄い赤
      explosionParticles.colorDead = new Color4(0.3, 0.3, 0.3, 0.0);
      explosionParticles.minSize = 0.1;
      explosionParticles.maxSize = 0.4;
      explosionParticles.minLifeTime = 0.2;
      explosionParticles.maxLifeTime = 0.5;
      explosionParticles.emitRate = 100;
      explosionParticles.blendMode = ParticleSystem.BLENDMODE_ONEONE;
      explosionParticles.gravity = new Vector3(0, -5, 0);
      explosionParticles.direction1 = new Vector3(-1, 0.5, -1);
      explosionParticles.direction2 = new Vector3(1, 2, 1);
      explosionParticles.minEmitPower = 1;
      explosionParticles.maxEmitPower = 3;
      explosionParticles.updateSpeed = 0.02;

      // 小さなフラッシュ効果
      const flashSphere = MeshBuilder.CreateSphere("flash", { diameter: 1 }, scene);
      const flashMaterial = new StandardMaterial("flashMat", scene);
      flashMaterial.emissiveColor = new Color3(1, 0.9, 0.7);
      flashMaterial.alpha = 0.6;
      flashSphere.material = flashMaterial;
      flashSphere.position = position;

      // フラッシュのアニメーション（小さく短く）
      const flashAnimation = Animation.CreateAndStartAnimation(
        "flashAnim",
        flashSphere,
        "scaling",
        60,
        15,
        new Vector3(0.3, 0.3, 0.3),
        new Vector3(1.2, 1.2, 1.2),
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const alphaAnimation = Animation.CreateAndStartAnimation(
        "alphaAnim",
        flashMaterial,
        "alpha",
        60,
        15,
        0.6,
        0,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // パーティクルを開始
      explosionParticles.start();

      // 0.8秒後にパーティクルとフラッシュを削除
      setTimeout(() => {
        explosionParticles.stop();
        flashSphere.dispose();
        
        // パーティクルシステムを完全に削除
        setTimeout(() => {
          explosionParticles.dispose();
        }, 1000);
      }, 800);
    };

    // 敵をスポーンする関数
    const spawnEnemy = () => {
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
          setEnemyCount(enemies.length); // 敵数を更新
        },
        undefined,
        (error) => {
          console.error("ojisan.glb 読み込み失敗:", error);
        }
      );
    };

    // 初期敵を生成（数を減らす）
    for (let i = 0; i < maxEnemies; i++) {
      spawnEnemy();
    }

    // 弾丸を作成する関数
    const createBullet = (position: Vector3, direction: Vector3) => {
      const bullet = MeshBuilder.CreateSphere("bullet", { diameter: 0.2 }, scene);
      const bulletMaterial = new StandardMaterial("bullet-mat", scene);
      bulletMaterial.diffuseColor = Color3.Red();
      bulletMaterial.emissiveColor = Color3.Red();
      bullet.material = bulletMaterial;
      bullet.position = position.clone();
      
      // 弾丸の速度を設定
      const bulletSpeed = 0.5;
      const velocity = direction.normalize().scale(bulletSpeed);
      
      bullets.push(bullet);
      bulletVelocities.set(bullet, velocity);
      
      // 5秒後に弾丸を自動削除
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
      const enemyBullet = MeshBuilder.CreateSphere("enemyBullet", { diameter: 0.3 }, scene);
      const enemyBulletMaterial = new StandardMaterial("enemyBullet-mat", scene);
      enemyBulletMaterial.diffuseColor = Color3.Yellow();
      enemyBulletMaterial.emissiveColor = Color3.Yellow();
      enemyBullet.material = enemyBulletMaterial;
      enemyBullet.position = position.clone();
      
      // 敵の弾丸の速度を設定（かなり遅く）
      const enemyBulletSpeed = 0.08;
      const velocity = direction.normalize().scale(enemyBulletSpeed);
      
      enemyBullets.push(enemyBullet);
      enemyBulletVelocities.set(enemyBullet, velocity);
      
      // 10秒後に敵の弾丸を自動削除
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

    // 敵の数をチェックして新しい敵をスポーンさせる
    setInterval(() => {
      if (enemies.length < maxEnemies) {
        const spawnCount = Math.min(2, maxEnemies - enemies.length);
        for (let i = 0; i < spawnCount; i++) {
          spawnEnemy();
        }
      }
    }, 3000); // 3秒ごとにチェック

    // 敵が弾丸を発射（2-4秒ごとにランダムで発射）
    const startEnemyShooting = () => {
      const shootingInterval = setInterval(() => {
        if (enemies.length === 0) {
          clearInterval(shootingInterval);
          return;
        }
        
        // ランダムに選んだ敵が発射
        if (enemies.length > 0) {
          const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
          const directionToPlayer = camera.position.subtract(randomEnemy.position).normalize();
          createEnemyBullet(randomEnemy.position, directionToPlayer);
        }
      }, Math.random() * 2000 + 2000); // 2-4秒間隔
    };
    
    startEnemyShooting();

    const inputMap: Record<string, boolean> = {};
    let spacePressed = false;

    scene.actionManager = new ActionManager(scene);
    scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      const isKeyDown = kbInfo.type === KeyboardEventTypes.KEYDOWN;
      
      inputMap[key] = isKeyDown;
      
      // スペースキーで弾丸発射（連射防止）
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
            
            if (distance < 1.5) { // 当たり判定の距離
              // 爆破エフェクトを作成
              createExplosion(enemy.position.clone());
              
              // 敵を削除
              enemies.splice(j, 1);
              enemyStates.delete(enemy);
              enemyInitialPositions.delete(enemy);
              enemy.dispose();
              setEnemyCount(enemies.length); // 敵数を更新
              setHits(prevHits => prevHits + 1); // ヒット数を増加
              
              // 弾丸を削除
              bullets.splice(i, 1);
              bulletVelocities.delete(bullet);
              bullet.dispose();
              
              break; // 一つの弾丸は一つの敵にしか当たらない
            }
          }
          
          // プレイヤーの弾丸が敵の弾丸に当たったかチェック
          for (let k = enemyBullets.length - 1; k >= 0; k--) {
            const enemyBullet = enemyBullets[k];
            const distance = Vector3.Distance(bullet.position, enemyBullet.position);
            
            if (distance < 0.4) { // 弾丸同士の当たり判定
              // 敵の弾丸を削除
              enemyBullets.splice(k, 1);
              enemyBulletVelocities.delete(enemyBullet);
              enemyBullet.dispose();
              
              // プレイヤーの弾丸を削除
              bullets.splice(i, 1);
              bulletVelocities.delete(bullet);
              bullet.dispose();
              
              break;
            }
          }
          
          // 弾丸が範囲外に出たら削除
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
          const distanceToPlayer = Vector3.Distance(enemyBullet.position, camera.position);
          if (distanceToPlayer < 1.0) {
            setHp(prevHp => {
              const newHp = prevHp - 1;
              console.log("HP reduced to:", newHp);
              if (newHp <= 0) {
                alert("ゲームオーバー！");
              }
              return newHp;
            });
            
            // 敵の弾丸を削除
            enemyBullets.splice(i, 1);
            enemyBulletVelocities.delete(enemyBullet);
            enemyBullet.dispose();
            continue;
          }
          
          // 敵の弾丸が範囲外に出たら削除
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
          src={"image/hits.webp"} // ヒット数の画像
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
          src={"image/"+hp+".webp"} // HP画像
          alt="HP画像"
          style={{
            width: "20vw",
            objectFit: "cover",
            pointerEvents: "none",
          }}
          className="absolute right-[20%] top-[3vw]"
        />
        <img
          src="image/pit.webp" // 実際のPNG画像のパスに変更
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
          <div>敵数: {enemyCount}/{maxEnemies}</div>
        </div>
      </div>
    </>
  );
};

export default BabylonScene;