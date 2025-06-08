// systems/enemySystem.ts
import {
  Scene,
  Vector3,
  Mesh,
  SceneLoader,
  FreeCamera,
} from "@babylonjs/core";
import { BulletSystem } from "./bulletSystem";

export class EnemySystem {
  private enemies: Mesh[] = [];
  private enemyStates = new Map<Mesh, Vector3>();
  private enemyInitialPositions = new Map<Mesh, Vector3>();
  private enemyAttackTimers = new Map<Mesh, number>();
  private enemyMovePatterns = new Map<Mesh, string>(); // 移動パターン
  private enemyTargetPositions = new Map<Mesh, Vector3>(); // 目標位置
  private enemyChangeDirectionTimers = new Map<Mesh, number>(); // 方向転換タイマー
  private spawnInterval?: NodeJS.Timeout;
  private moveInterval?: NodeJS.Timeout;
  private shootingInterval?: NodeJS.Timeout;
  private camera?: FreeCamera;

  // プレイヤーと同じ移動範囲
  private readonly MOVEMENT_RADIUS = 40.0;
  private readonly MAX_HEIGHT = 40.0;
  private readonly MIN_HEIGHT = -40.0;
  private readonly ORIGIN_POSITION = new Vector3(0, 1.6, 0);

  constructor(
    private scene: Scene,
    private bulletSystem: BulletSystem,
    private maxEnemies: number = 3,
    private onEnemyCountChange: (count: number) => void
  ) {}

  // カメラの参照を設定するメソッド
  setCamera(camera: FreeCamera): void {
    this.camera = camera;
  }

  initialize(): void {
    // 初期敵を生成
    for (let i = 0; i < this.maxEnemies; i++) {
      this.spawnEnemy();
    }

    this.startIntervals();
  }

  private startIntervals(): void {
    // 敵の移動方向をより頻繁に更新（500msごと）
    this.moveInterval = setInterval(() => {
      this.enemies.forEach((enemy) => {
        this.updateEnemyMovementPattern(enemy);
      });
    }, 500);

    // 敵の数チェック
    this.spawnInterval = setInterval(() => {
      if (this.enemies.length < this.maxEnemies) {
        const spawnCount = Math.min(2, this.maxEnemies - this.enemies.length);
        for (let i = 0; i < spawnCount; i++) {
          this.spawnEnemy();
        }
      }
    }, 2500);

    // 敵の攻撃処理
    this.shootingInterval = setInterval(() => {
      this.processEnemyShooting();
    }, 200);
  }

  private getRandomPositionInBounds(): Vector3 {
    // プレイヤーの移動範囲内でランダムな位置を生成
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * this.MOVEMENT_RADIUS * 0.8; // 少し内側に制限
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = Math.random() * (this.MAX_HEIGHT - this.MIN_HEIGHT) + this.MIN_HEIGHT;
    
    return new Vector3(x, y, z);
  }

  private updateEnemyMovementPattern(enemy: Mesh): void {
    const currentTime = Date.now();
    const changeDirectionTime = this.enemyChangeDirectionTimers.get(enemy) || 0;
    
    // 2-4秒ごとに移動パターンを変更
    if (currentTime > changeDirectionTime) {
      const patterns = ['aggressive', 'evasive', 'circular', 'random', 'stalking'];
      const newPattern = patterns[Math.floor(Math.random() * patterns.length)];
      this.enemyMovePatterns.set(enemy, newPattern);
      
      // 新しい目標位置を設定
      this.enemyTargetPositions.set(enemy, this.getRandomPositionInBounds());
      
      // 次の方向転換時間を設定（2-4秒後）
      const nextChangeTime = currentTime + (Math.random() * 2000 + 2000);
      this.enemyChangeDirectionTimers.set(enemy, nextChangeTime);
    }
    
    const pattern = this.enemyMovePatterns.get(enemy) || 'random';
    const playerPosition = this.camera ? this.camera.position : this.ORIGIN_POSITION;
    
    let moveVector = Vector3.Zero();
    
    switch (pattern) {
      case 'aggressive':
        // プレイヤーに向かって積極的に移動
        moveVector = playerPosition.subtract(enemy.position).normalize().scale(0.8);
        break;
        
      case 'evasive':
        // プレイヤーから逃げるように移動
        moveVector = enemy.position.subtract(playerPosition).normalize().scale(0.6);
        // ランダムな横移動を追加
        const sideVector = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        moveVector.addInPlace(sideVector.scale(0.4));
        break;
        
      case 'circular':
        // プレイヤーの周りを円を描くように移動
        const toPlayer = playerPosition.subtract(enemy.position);
        const distance = toPlayer.length();
        const perpendicular = new Vector3(-toPlayer.z, toPlayer.y, toPlayer.x).normalize();
        moveVector = perpendicular.scale(0.5);
        // 距離を一定に保つ
        if (distance < 8) {
          moveVector.addInPlace(enemy.position.subtract(playerPosition).normalize().scale(0.3));
        } else if (distance > 15) {
          moveVector.addInPlace(playerPosition.subtract(enemy.position).normalize().scale(0.3));
        }
        break;
        
      case 'stalking':
        // 一定距離を保ちながら追跡
        const distanceToPlayer = Vector3.Distance(enemy.position, playerPosition);
        const idealDistance = 10;
        if (distanceToPlayer < idealDistance - 2) {
          moveVector = enemy.position.subtract(playerPosition).normalize().scale(0.4);
        } else if (distanceToPlayer > idealDistance + 2) {
          moveVector = playerPosition.subtract(enemy.position).normalize().scale(0.4);
        }
        // 横方向の移動を追加
        const lateralMove = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        moveVector.addInPlace(lateralMove.scale(0.3));
        break;
        
      case 'random':
      default:
        // 目標位置に向かって移動
        const targetPos = this.enemyTargetPositions.get(enemy);
        if (targetPos) {
          const distanceToTarget = Vector3.Distance(enemy.position, targetPos);
          if (distanceToTarget > 2) {
            moveVector = targetPos.subtract(enemy.position).normalize().scale(0.6);
          } else {
            // 目標に到達したら新しい目標を設定
            this.enemyTargetPositions.set(enemy, this.getRandomPositionInBounds());
          }
        }
        break;
    }
    
    // より大きなランダム要素を追加
    const randomFactor = new Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.0,
      (Math.random() - 0.5) * 1.5
    );
    moveVector.addInPlace(randomFactor);
    
    this.enemyStates.set(enemy, moveVector);
  }

  private constrainEnemyPosition(enemy: Mesh): void {
    // 敵の位置をプレイヤーと同じ範囲内に制限
    const currentPos = enemy.position;
    
    // 水平方向の制限
    const horizontalPosition = new Vector3(currentPos.x, this.ORIGIN_POSITION.y, currentPos.z);
    const horizontalDistance = Vector3.Distance(horizontalPosition, this.ORIGIN_POSITION);
    
    if (horizontalDistance > this.MOVEMENT_RADIUS) {
      const horizontalDirection = horizontalPosition.subtract(this.ORIGIN_POSITION).normalize();
      const constrainedHorizontalPos = this.ORIGIN_POSITION.add(horizontalDirection.scale(this.MOVEMENT_RADIUS));
      enemy.position.x = constrainedHorizontalPos.x;
      enemy.position.z = constrainedHorizontalPos.z;
    }
    
    // 垂直方向の制限
    if (enemy.position.y > this.MAX_HEIGHT) {
      enemy.position.y = this.MAX_HEIGHT;
    } else if (enemy.position.y < this.MIN_HEIGHT) {
      enemy.position.y = this.MIN_HEIGHT;
    }
  }

  private spawnEnemy(): void {
    // より広い範囲でスポーン
    const spawnRadius = 15 + Math.random() * 10; // 15-25の範囲
    const minY = this.MIN_HEIGHT + 5;
    const maxY = this.MAX_HEIGHT - 5;
    
    const theta = Math.random() * 2 * Math.PI;
    const x = spawnRadius * Math.cos(theta);
    const z = spawnRadius * Math.sin(theta);
    const y = Math.random() * (maxY - minY) + minY;

    SceneLoader.ImportMesh(
      "",
      "/models/",
      "ojisan3.glb",
      this.scene,
      (meshes) => {
        const enemy = meshes[0] as Mesh;
        enemy.position = new Vector3(x, y, z);
        enemy.scaling = new Vector3(2.0, 2.0, 2.0);
        enemy.lookAt(this.ORIGIN_POSITION);
        
        this.enemies.push(enemy);
        this.enemyStates.set(enemy, Vector3.Zero());
        this.enemyInitialPositions.set(enemy, enemy.position.clone());
        
        // 初期移動パターンを設定
        const patterns = ['aggressive', 'evasive', 'circular', 'random', 'stalking'];
        const initialPattern = patterns[Math.floor(Math.random() * patterns.length)];
        this.enemyMovePatterns.set(enemy, initialPattern);
        this.enemyTargetPositions.set(enemy, this.getRandomPositionInBounds());
        this.enemyChangeDirectionTimers.set(enemy, Date.now() + Math.random() * 2000);
        
        // 初期攻撃遅延
        const initialDelay = Math.random() * 2000 + 2500;
        this.enemyAttackTimers.set(enemy, Date.now() + initialDelay);
        
        this.onEnemyCountChange(this.enemies.length);
      },
      undefined,
      (error) => {
        console.error("ojisan.glb 読み込み失敗:", error);
      }
    );
  }

  private processEnemyShooting(): void {
    const currentTime = Date.now();
    
    this.enemies.forEach((enemy) => {
      const lastAttackTime = this.enemyAttackTimers.get(enemy);
      if (lastAttackTime && currentTime >= lastAttackTime) {
        const currentPlayerPosition = this.camera ? this.camera.position : this.ORIGIN_POSITION;
        const directionToPlayer = currentPlayerPosition.subtract(enemy.position).normalize();
        this.bulletSystem.createEnemyBullet(enemy.position, directionToPlayer);
        
        // 移動パターンに応じて攻撃間隔を調整
        const pattern = this.enemyMovePatterns.get(enemy);
        let attackDelay = 1000;
        
        switch (pattern) {
          case 'aggressive':
            attackDelay = 800; // 積極的な敵は攻撃間隔が短い
            break;
          case 'evasive':
            attackDelay = 1500; // 回避型は攻撃間隔が長い
            break;
          case 'circular':
            attackDelay = 1200;
            break;
          case 'stalking':
            attackDelay = 1000;
            break;
          default:
            attackDelay = 1000 + Math.random() * 500;
        }
        
        this.enemyAttackTimers.set(enemy, currentTime + attackDelay);
      }
    });
  }

  removeEnemy(enemy: Mesh): void {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
      this.enemyStates.delete(enemy);
      this.enemyInitialPositions.delete(enemy);
      this.enemyAttackTimers.delete(enemy);
      this.enemyMovePatterns.delete(enemy);
      this.enemyTargetPositions.delete(enemy);
      this.enemyChangeDirectionTimers.delete(enemy);
      enemy.dispose();
      this.onEnemyCountChange(this.enemies.length);
    }
  }

  updateEnemies(playerPosition: Vector3): void {
    this.enemies.forEach((enemy) => {
      const distance = Vector3.Distance(enemy.position, playerPosition);

      // プレイヤーに近すぎる場合の処理は維持
      if (distance < 2.0) {
        // 敵を少し押し戻す
        const pushBack = enemy.position.subtract(playerPosition).normalize().scale(0.5);
        enemy.position.addInPlace(pushBack);
      }

      const moveVec = this.enemyStates.get(enemy);
      if (moveVec) {
        // より大きな移動量でダイナミックに
        enemy.position.addInPlace(moveVec.scale(0.05));

        // 敵の位置を制限範囲内に制約
        this.constrainEnemyPosition(enemy);

        // プレイヤーを向く
        enemy.lookAt(playerPosition);
      }
    });
  }

  getEnemies(): Mesh[] {
    return this.enemies;
  }

  dispose(): void {
    if (this.moveInterval) clearInterval(this.moveInterval);
    if (this.spawnInterval) clearInterval(this.spawnInterval);
    if (this.shootingInterval) clearInterval(this.shootingInterval);
    
    this.enemies.forEach(enemy => enemy.dispose());
    this.enemies = [];
    this.enemyStates.clear();
    this.enemyInitialPositions.clear();
    this.enemyAttackTimers.clear();
    this.enemyMovePatterns.clear();
    this.enemyTargetPositions.clear();
    this.enemyChangeDirectionTimers.clear();
  }
}