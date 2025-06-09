// hooks/useBabylonGame.ts (視点ジャンプ修正版)
import { useEffect, useRef } from "react";
import "@babylonjs/loaders";
import "@babylonjs/loaders/glTF";
import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  Color4,
  PhotoDome,
  PointerEventTypes,
  PointerInfo,
  Observer,
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
  gameOverRef,
  hpRef,
  hitsRef,
  setGameOver,
}: UseBabylonGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // プレイヤー移動範囲の制限設定
  const MOVEMENT_RADIUS = 40.0;
  const MAX_HEIGHT = 40.0;
  const MIN_HEIGHT = -40.0;
  const ORIGIN_POSITION = new Vector3(0, 1.6, 0);

  // プレイヤー位置を範囲内に制限する関数
  const constrainPlayerPosition = (camera: FreeCamera): void => {
    const currentPos = camera.position;
    
    const horizontalPosition = new Vector3(currentPos.x, ORIGIN_POSITION.y, currentPos.z);
    const horizontalDistance = Vector3.Distance(horizontalPosition, ORIGIN_POSITION);
    
    if (horizontalDistance > MOVEMENT_RADIUS) {
      const horizontalDirection = horizontalPosition.subtract(ORIGIN_POSITION).normalize();
      const constrainedHorizontalPos = ORIGIN_POSITION.add(horizontalDirection.scale(MOVEMENT_RADIUS));
      camera.position.x = constrainedHorizontalPos.x;
      camera.position.z = constrainedHorizontalPos.z;
    }
    
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
        "/image/bg4.jpg",
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
      scene.clearColor = new Color4(0.1, 0.1, 0.3, 1.0);
    }

    // カメラ設定
    const camera = new FreeCamera("camera", new Vector3(0, 1.6, 0), scene);
    camera.speed = 0.2;
    camera.inputs.clear();

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 2.0;

    // システム初期化
    const bulletSystem = new BulletSystem(scene);
    const enemySystem = new EnemySystem(scene, bulletSystem, maxEnemies, setEnemyCount);
    
    enemySystem.setCamera(camera);
    
    enemySystem.initialize();

    // 🔒 ポインターロック管理
    let isPointerLocked = false;
    let autoLockRequested = false;

    // 🔧 視点ジャンプ防止のための変数
    const ROTATION_SENSITIVITY = 0.002;
    const MAX_DELTA_MOVEMENT = 100; // 異常な大きさの移動値を制限
    let lastValidMovementX = 0;
    let lastValidMovementY = 0;
    let consecutiveLargeMoves = 0;
    const MAX_CONSECUTIVE_LARGE_MOVES = 2;

    // ポインターロック状態の変化を監視
    const handlePointerLockChange = () => {
      isPointerLocked = document.pointerLockElement === canvasRef.current;
      
      if (isPointerLocked) {
        console.log('🔒 ポインターロック開始 - 安定した視点移動が有効');
        canvasRef.current!.style.cursor = 'none';
        
        // ポインターロック開始時にカウンターをリセット
        consecutiveLargeMoves = 0;
        lastValidMovementX = 0;
        lastValidMovementY = 0;
      } else {
        console.log('🔓 ポインターロック終了');
        canvasRef.current!.style.cursor = 'default';
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // 自動ポインターロック
    const requestAutoPointerLock = () => {
      if (!autoLockRequested && canvasRef.current && !gameOverRef.current) {
        autoLockRequested = true;
        
        setTimeout(() => {
          canvasRef.current?.requestPointerLock();
          console.log('🎮 自動ポインターロック要求');
        }, 1000);
      }
    };

    requestAutoPointerLock();

    // キャンバスクリックでもポインターロック
    const handleCanvasClick = () => {
      if (!isPointerLocked && !gameOverRef.current) {
        canvasRef.current?.requestPointerLock();
        console.log('🖱️ クリックによるポインターロック要求');
      }
    };

    canvasRef.current.addEventListener('click', handleCanvasClick);

    // 🔧 視点ジャンプを防ぐ安全なポインター制御
    const pointerObserver: Observer<PointerInfo> = scene.onPointerObservable.add(
      (pointerInfo: PointerInfo) => {
        if (gameOverRef.current) return;
        
        // マウス移動による視点制御（ポインターロック時のみ）
        if (pointerInfo.type === PointerEventTypes.POINTERMOVE && isPointerLocked) {
          const event = pointerInfo.event as MouseEvent;
          
          // 🔧 movementX/Y の値を検証（異常に大きい値を除外）
          let deltaX = event.movementX || 0;
          let deltaY = event.movementY || 0;
          
          // 異常に大きい移動値を検出
          const isLargeMovement = Math.abs(deltaX) > MAX_DELTA_MOVEMENT || Math.abs(deltaY) > MAX_DELTA_MOVEMENT;
          
          if (isLargeMovement) {
            consecutiveLargeMoves++;
            console.warn(`🚨 異常な移動値を検出: deltaX=${deltaX}, deltaY=${deltaY}`);
            
            // 連続して異常な値が続く場合は完全に無視
            if (consecutiveLargeMoves > MAX_CONSECUTIVE_LARGE_MOVES) {
              console.warn('🚫 連続する異常な移動値を無視');
              return;
            }
            
            // 最後の有効な値で制限
            deltaX = Math.sign(deltaX) * Math.min(Math.abs(deltaX), Math.abs(lastValidMovementX) + 10);
            deltaY = Math.sign(deltaY) * Math.min(Math.abs(deltaY), Math.abs(lastValidMovementY) + 10);
          } else {
            // 正常な値の場合、カウンターをリセット
            consecutiveLargeMoves = 0;
            lastValidMovementX = deltaX;
            lastValidMovementY = deltaY;
          }
          
          // 🔧 追加の安全チェック：極小値も無視
          if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
            return; // 無意味な小さい値は無視
          }
          
          // 🔧 deltaの値をさらに制限（念のため）
          deltaX = Math.max(-50, Math.min(50, deltaX));
          deltaY = Math.max(-50, Math.min(50, deltaY));
          
          // 回転を適用
          camera.rotation.y += deltaX * ROTATION_SENSITIVITY;
          camera.rotation.x += deltaY * ROTATION_SENSITIVITY;
          
          // 垂直回転制限
          camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
        
        // 弾丸発射
        else if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          const event = pointerInfo.event as MouseEvent;
          
          if (event.button === 0) { // 左クリック
            const bulletStartPos = camera.position.clone();
            const bulletDirection = camera.getDirection(Vector3.Forward());
            bulletSystem.createPlayerBullet(bulletStartPos, bulletDirection);
            playShootSE();
            
            console.log('🔫 マウス左クリックで弾丸発射');
          }
        }
      }
    );

    // UI更新用のインターバル
    const uiUpdateInterval = setInterval(() => {
      if (!gameOverRef.current) {
        updateHits(hitsRef.current);
        updateHp(hpRef.current);
      }
    }, 1000);

    // カスタムキーボード制御
    const inputMap: Record<string, boolean> = {};
    let spacePressed = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOverRef.current) return;
      
      const key = event.key.toLowerCase();
      inputMap[key] = true;

      if (key === " " && !spacePressed) {
        spacePressed = true;
        const bulletStartPos = camera.position.clone();
        const bulletDirection = camera.getDirection(Vector3.Forward());
        bulletSystem.createPlayerBullet(bulletStartPos, bulletDirection);
        playShootSE();
        
        console.log('⌨️ 左クリックで弾丸発射');
        event.preventDefault();
      }

      if (key === "escape") {
        document.exitPointerLock();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      inputMap[key] = false;

      if (key === " ") {
        spacePressed = false;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // メインゲームループ
    scene.onBeforeRenderObservable.add(() => {
      if (gameOverRef.current) return;

      // WASD移動
      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());
      const moveSpeed = camera.speed;

      if (inputMap["w"]) camera.position.addInPlace(forward.scale(moveSpeed));
      if (inputMap["s"]) camera.position.addInPlace(forward.scale(-moveSpeed));
      if (inputMap["a"]) camera.position.addInPlace(right.scale(-moveSpeed));
      if (inputMap["d"]) camera.position.addInPlace(right.scale(moveSpeed));

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

        const distanceToPlayer = Vector3.Distance(enemyBullet.position, camera.position);
        if (distanceToPlayer < 1.0) {
          hpRef.current -= 1;
          playHpHitSE();
          
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
      
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      canvasRef.current?.removeEventListener('click', handleCanvasClick);
      
      if (pointerObserver) {
        scene.onPointerObservable.remove(pointerObserver);
      }
      
      if (document.pointerLockElement === canvasRef.current) {
        document.exitPointerLock();
      }
      
      enemySystem.dispose();
      bulletSystem.dispose();
      engine.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, [permissionGranted, gameOver]);

  return { canvasRef };
};