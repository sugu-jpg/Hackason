// hooks/useBabylonGame.ts
import { useEffect, useRef } from "react";
import "@babylonjs/loaders";
import "@babylonjs/loaders/glTF";
import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  ActionManager,
  KeyboardEventTypes,
  Tools,
  Quaternion,
  Matrix,
  Color4,
  PhotoDome,
} from "@babylonjs/core";
import { ParticleEffects } from "../utils/particleEffects";
import { ApiService } from "../services/apiService";
import { BulletSystem } from "../systems/bulletSystem";
import { EnemySystem } from "../systems/enemySystem";
import { playHpHitSE } from "@/utils/playHpHitSE";
import { playShootSE } from "@/utils/playShootSE";

interface UseBabylonGameProps {
  permissionGranted: boolean;
  gameOver: boolean;
  maxEnemies: number;
  updateHp: (hp: number) => void;
  updateHits: (hits: number) => void;
  setEnemyCount: (count: number) => void;
  setOrientation: (orientation: { alpha: number; beta: number; gamma: number }) => void;
  gameOverRef: React.MutableRefObject<boolean>;
  hpRef: React.MutableRefObject<number>;
  hitsRef: React.MutableRefObject<number>;
  setGameOver: (gameOver: boolean) => void;
}

export const useBabylonGame = ({
  permissionGranted,
  gameOver,
  maxEnemies,
  updateHp,
  updateHits,
  setEnemyCount,
  setOrientation,
  gameOverRef,
  hpRef,
  hitsRef,
  setGameOver,
}: UseBabylonGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // プレイヤー移動範囲の制限設定
  const MOVEMENT_RADIUS = 40.0; // プレイヤーが移動できる水平半径
  const MAX_HEIGHT = 40.0; // 最大高度
  const MIN_HEIGHT = -40.0; // 最小高度
  const ORIGIN_POSITION = new Vector3(0, 1.6, 0); // 原点位置

  // プレイヤー位置を範囲内に制限する関数
  const constrainPlayerPosition = (camera: FreeCamera): void => {
    const currentPos = camera.position;
    
    // 水平方向の制限（X-Z平面）
    const horizontalPosition = new Vector3(currentPos.x, ORIGIN_POSITION.y, currentPos.z);
    const horizontalDistance = Vector3.Distance(horizontalPosition, ORIGIN_POSITION);
    
    if (horizontalDistance > MOVEMENT_RADIUS) {
      // 原点からプレイヤーへの水平方向ベクトルを取得
      const horizontalDirection = horizontalPosition.subtract(ORIGIN_POSITION).normalize();
      // 制限範囲内の位置に補正
      const constrainedHorizontalPos = ORIGIN_POSITION.add(horizontalDirection.scale(MOVEMENT_RADIUS));
      camera.position.x = constrainedHorizontalPos.x;
      camera.position.z = constrainedHorizontalPos.z;
    }
    
    // 垂直方向（Y軸）の制限
    if (camera.position.y > MAX_HEIGHT) {
      camera.position.y = MAX_HEIGHT;
    } else if (camera.position.y < MIN_HEIGHT) {
      camera.position.y = MIN_HEIGHT;
    }
  };

  // ゲームオーバー処理
  const handleGameOver = (finalHits: number) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    
    // ゲームオーバー時のみ状態を同期更新
    updateHits(finalHits);
    updateHp(0);
    setGameOver(true);
    
    ApiService.submitGameResult(finalHits);
  };

  useEffect(() => {
    if (!canvasRef.current || !permissionGranted || gameOver) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

        // 360度背景画像を設定
    try {
      const photoDome = new PhotoDome(
        "photoDome",
        "/image/bg4.jpg", // 360度画像のパス
        {
          resolution: 32,
          size: 1000,
          useDirectMapping: false
        },
        scene
      );
      console.log("✅ 360度背景画像を読み込みました");
    } catch (error) {
      console.warn("360度背景画像の読み込みに失敗、フォールバック背景を使用:", error);
      // 360度画像の読み込みに失敗した場合はフォールバック背景
      scene.clearColor = new Color4(0.1, 0.1, 0.3, 1.0);
    }

    // カメラとライト設定
    const camera = new FreeCamera("camera", new Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.2;
    camera.rotationQuaternion = Quaternion.Identity();

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 2.0;

    // システム初期化
    const bulletSystem = new BulletSystem(scene);
    const enemySystem = new EnemySystem(scene, bulletSystem, maxEnemies, setEnemyCount);
    
    // カメラの参照を設定（ setCameraメソッドが存在する場合のみ）
    if ('setCamera' in enemySystem && typeof (enemySystem as any).setCamera === 'function') {
      (enemySystem as any).setCamera(camera);
    }
    
    enemySystem.initialize();

    // UI更新用のインターバル（1秒ごとにヒット数とHPを更新）
    const uiUpdateInterval = setInterval(() => {
      if (!gameOverRef.current) {
        updateHits(hitsRef.current);
        updateHp(hpRef.current);
      }
    }, 1000);

    // 入力処理
    const inputMap: Record<string, boolean> = {};
    let spacePressed = false;

    scene.actionManager = new ActionManager(scene);
    scene.onKeyboardObservable.add((kbInfo) => {
      if (gameOverRef.current) return;

      const key = kbInfo.event.key.toLowerCase();
      const isKeyDown = kbInfo.type === KeyboardEventTypes.KEYDOWN;

      inputMap[key] = isKeyDown;

      if (key === " " && isKeyDown && !spacePressed) {
        spacePressed = true;
        const bulletStartPos = camera.position.clone();
        const bulletDirection = camera.getDirection(Vector3.Forward());
        bulletSystem.createPlayerBullet(bulletStartPos, bulletDirection);
        playShootSE(); // 発射音をここで再生
      } else if (key === " " && !isKeyDown) {
        spacePressed = false;
      }
    });

    // デバイス方向制御
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (gameOverRef.current) return;

      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        const alpha = Tools.ToRadians(event.alpha);
        const beta = Tools.ToRadians(event.beta);
        const gamma = Tools.ToRadians(event.gamma);

        const rotationMatrix = Matrix.RotationYawPitchRoll(
          gamma,
          -beta + Math.PI / 2,
          alpha * 0.01
        );
        camera.rotationQuaternion = Quaternion.FromRotationMatrix(rotationMatrix);

        setOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        });
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    // メインゲームループ
    scene.onBeforeRenderObservable.add(() => {
      if (gameOverRef.current) return;

      // プレイヤー移動
      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());

      // 移動前の位置を保存
      const previousPosition = camera.position.clone();

      if (inputMap["w"]) camera.position.addInPlace(forward.scale(camera.speed));
      if (inputMap["s"]) camera.position.addInPlace(forward.scale(-camera.speed));
      if (inputMap["a"]) camera.position.addInPlace(right.scale(-camera.speed));
      if (inputMap["d"]) camera.position.addInPlace(right.scale(camera.speed));

      // プレイヤー位置を制限範囲内に制約
      constrainPlayerPosition(camera);

      const playerPosition = camera.position.clone();

      // 弾丸システム更新
      const { playerBullets, enemyBullets } = bulletSystem.updateBullets(playerPosition);

      // プレイヤーの弾丸処理
      for (let i = playerBullets.length - 1; i >= 0; i--) {
        const { bullet, velocity } = playerBullets[i];
        bullet.position.addInPlace(velocity);

        // 敵との当たり判定
        const enemies = enemySystem.getEnemies();
        for (let j = enemies.length - 1; j >= 0; j--) {
          const enemy = enemies[j];
          const distance = Vector3.Distance(bullet.position, enemy.position);
          
          if (distance < 1.5) {
            ParticleEffects.createExplosion(enemy.position.clone(), scene);
            enemySystem.removeEnemy(enemy);
            hitsRef.current += 1;
            // UI更新は定期的なインターバルに任せる
            bulletSystem.removeBulletByInstance(bullet);
            break;
          }
        }

        // 敵の弾丸との当たり判定
        for (let k = enemyBullets.length - 1; k >= 0; k--) {
          const { bullet: enemyBullet } = enemyBullets[k];
          const distance = Vector3.Distance(bullet.position, enemyBullet.position);

          if (distance < 0.4) {
            bulletSystem.removeBulletByInstance(enemyBullet);
            bulletSystem.removeBulletByInstance(bullet);
            break;
          }
        }
      }

      // 敵の弾丸処理
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const { bullet: enemyBullet, velocity } = enemyBullets[i];
        enemyBullet.position.addInPlace(velocity);

        // プレイヤーとの当たり判定
        const distanceToPlayer = Vector3.Distance(enemyBullet.position, camera.position);
        if (distanceToPlayer < 1.0) {
          hpRef.current -= 1;
          playHpHitSE();
          // UI更新は定期的なインターバルに任せる
          
          if (hpRef.current <= 0 && !gameOverRef.current) {
            handleGameOver(hitsRef.current);
          }

          bulletSystem.removeBulletByInstance(enemyBullet);
          continue;
        }
      }

      // 敵システム更新
      enemySystem.updateEnemies(camera.position);

      // プレイヤーと敵の衝突チェック
      const enemies = enemySystem.getEnemies();
      enemies.forEach((enemy) => {
        const distance = Vector3.Distance(enemy.position, camera.position);
        if (distance < 2.0) {
          // 衝突時は原点にリセット
          camera.position = ORIGIN_POSITION.clone();
        }
      });
    });

    // レンダリング開始
    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener("resize", handleResize);

    // クリーンアップ
    return () => {
      clearInterval(uiUpdateInterval);
      enemySystem.dispose();
      bulletSystem.dispose();
      engine.dispose();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [permissionGranted, gameOver, maxEnemies, updateHp, updateHits, setEnemyCount, setOrientation, gameOverRef, hpRef, hitsRef, setGameOver]);

  return { canvasRef };
};