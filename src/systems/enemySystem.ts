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
  private spawnInterval?: NodeJS.Timeout;
  private moveInterval?: NodeJS.Timeout;
  private shootingInterval?: NodeJS.Timeout;
  private camera?: FreeCamera;

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
    // 敵の移動方向を1秒ごとに更新
    this.moveInterval = setInterval(() => {
      this.enemies.forEach((enemy) => {
        const newDir = new Vector3(
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 2.0
        );
        this.enemyStates.set(enemy, newDir);
      });
    }, 1000);

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

  private spawnEnemy(): void {
    const radius = 10;
    const minY = 0.5;
    const maxY = 3.5;
    
    const theta = Math.random() * 2 * Math.PI;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
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
        enemy.lookAt(new Vector3(0, 1.6, 0));
        
        this.enemies.push(enemy);
        this.enemyStates.set(enemy, Vector3.Zero());
        this.enemyInitialPositions.set(enemy, enemy.position.clone());
        
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
        // カメラが設定されている場合は現在のプレイヤー位置を取得、そうでなければ固定位置
        const currentPlayerPosition = this.camera ? this.camera.position : new Vector3(0, 1.6, 0);
        const directionToPlayer = currentPlayerPosition.subtract(enemy.position).normalize();
        this.bulletSystem.createEnemyBullet(enemy.position, directionToPlayer);
        
        // 次の攻撃時間を設定
        const nextAttackDelay = Math.random() * 3000 + 3000;
        this.enemyAttackTimers.set(enemy, currentTime + nextAttackDelay);
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
      enemy.dispose();
      this.onEnemyCountChange(this.enemies.length);
    }
  }

  updateEnemies(playerPosition: Vector3): void {
    this.enemies.forEach((enemy) => {
      const distance = Vector3.Distance(enemy.position, playerPosition);

      // プレイヤーに近すぎる場合はプレイヤーをリセット
      if (distance < 2.0) {
        return;
      }

      const moveVec = this.enemyStates.get(enemy);
      if (moveVec) {
        enemy.position.addInPlace(moveVec.scale(0.02));

        // 高さ制限
        const maxHeight = 6.0;
        const minHeight = -1.2;
        if (enemy.position.y > maxHeight) enemy.position.y = maxHeight;
        if (enemy.position.y < minHeight) enemy.position.y = minHeight;

        // 距離に応じた行動
        if (distance < 8.0) {
          const away = enemy.position.subtract(playerPosition).normalize();
          const strength = 0.04 * (8.0 - distance);
          enemy.position.addInPlace(away.scale(strength));
        } else if (distance > 14.0) {
          const toCenter = playerPosition.subtract(enemy.position).normalize();
          const strength = 0.007 * (distance - 14.0);
          enemy.position.addInPlace(toCenter.scale(strength));
        }

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
  }
}