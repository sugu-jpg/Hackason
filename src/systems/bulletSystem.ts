// systems/BulletSystem.ts
import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Mesh,
} from "@babylonjs/core";

export class BulletSystem {
  private bullets: Mesh[] = [];
  private bulletVelocities = new Map<Mesh, Vector3>();
  private bulletStartPositions = new Map<Mesh, Vector3>(); // 弾丸の発射位置を記録
  private enemyBullets: Mesh[] = [];
  private enemyBulletVelocities = new Map<Mesh, Vector3>();

  // 弾丸の最大射程距離
  private readonly MAX_BULLET_RANGE = 20.0;

  constructor(private scene: Scene) {}

  createPlayerBullet(position: Vector3, direction: Vector3): void {
    const bullet = MeshBuilder.CreateSphere(
      "bullet",
      { diameter: 0.2 },
      this.scene
    );
    const bulletMaterial = new StandardMaterial("bullet-mat", this.scene);
    bulletMaterial.diffuseColor = Color3.Red();
    bulletMaterial.emissiveColor = Color3.Red();
    bullet.material = bulletMaterial;
    bullet.position = position.clone();

    const bulletSpeed = 1;
    const velocity = direction.normalize().scale(bulletSpeed);

    this.bullets.push(bullet);
    this.bulletVelocities.set(bullet, velocity);
    this.bulletStartPositions.set(bullet, position.clone()); // 発射位置を記録

    // 5秒後に削除（バックアップ）
    setTimeout(() => {
      this.removeBullet(bullet);
    }, 5000);
  }

  createEnemyBullet(position: Vector3, direction: Vector3): void {
    const enemyBullet = MeshBuilder.CreateSphere(
      "enemyBullet",
      { diameter: 0.3 },
      this.scene
    );
    const enemyBulletMaterial = new StandardMaterial(
      "enemyBullet-mat",
      this.scene
    );
    enemyBulletMaterial.diffuseColor = Color3.Yellow();
    enemyBulletMaterial.emissiveColor = Color3.Yellow();
    enemyBullet.material = enemyBulletMaterial;
    enemyBullet.position = position.clone();

    const enemyBulletSpeed = 0.5;
    const velocity = direction.normalize().scale(enemyBulletSpeed);

    this.enemyBullets.push(enemyBullet);
    this.enemyBulletVelocities.set(enemyBullet, velocity);

    // 10秒後に削除
    setTimeout(() => {
      this.removeEnemyBullet(enemyBullet);
    }, 10000);
  }

  private removeBullet(bullet: Mesh): void {
    const index = this.bullets.indexOf(bullet);
    if (index > -1) {
      this.bullets.splice(index, 1);
      this.bulletVelocities.delete(bullet);
      this.bulletStartPositions.delete(bullet); // 発射位置の記録も削除
      bullet.dispose();
    }
  }

  private removeEnemyBullet(enemyBullet: Mesh): void {
    const index = this.enemyBullets.indexOf(enemyBullet);
    if (index > -1) {
      this.enemyBullets.splice(index, 1);
      this.enemyBulletVelocities.delete(enemyBullet);
      enemyBullet.dispose();
    }
  }

  updateBullets(playerPosition: Vector3): {
    playerBullets: { bullet: Mesh; velocity: Vector3 }[];
    enemyBullets: { bullet: Mesh; velocity: Vector3 }[];
  } {
    const playerBulletsData = this.bullets
      .map(bullet => ({
        bullet,
        velocity: this.bulletVelocities.get(bullet)!
      }))
      .filter(data => data.velocity);

    const enemyBulletsData = this.enemyBullets
      .map(bullet => ({
        bullet,
        velocity: this.enemyBulletVelocities.get(bullet)!
      }))
      .filter(data => data.velocity);

    // プレイヤーの弾丸の射程チェック
    this.bullets.forEach(bullet => {
      const startPos = this.bulletStartPositions.get(bullet);
      if (startPos) {
        const travelDistance = Vector3.Distance(bullet.position, startPos);
        if (travelDistance > this.MAX_BULLET_RANGE) {
          this.removeBullet(bullet);
        }
      }
    });

    // 距離チェックと削除（既存のロジック）
    [...this.bullets, ...this.enemyBullets].forEach(bullet => {
      if (Vector3.Distance(bullet.position, playerPosition) > 30) {
        if (this.bullets.includes(bullet)) {
          this.removeBullet(bullet);
        } else {
          this.removeEnemyBullet(bullet);
        }
      }
    });

    return {
      playerBullets: playerBulletsData,
      enemyBullets: enemyBulletsData
    };
  }

  removeBulletByInstance(bullet: Mesh): void {
    if (this.bullets.includes(bullet)) {
      this.removeBullet(bullet);
    } else if (this.enemyBullets.includes(bullet)) {
      this.removeEnemyBullet(bullet);
    }
  }

  dispose(): void {
    [...this.bullets, ...this.enemyBullets].forEach(bullet => bullet.dispose());
    this.bullets = [];
    this.enemyBullets = [];
    this.bulletVelocities.clear();
    this.bulletStartPositions.clear();
    this.enemyBulletVelocities.clear();
  }
}