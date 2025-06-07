// utils/particleEffects.ts
import {
  Scene,
  Vector3,
  ParticleSystem,
  Texture,
  Color4,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Animation,
} from "@babylonjs/core";
import { playExplosionSE } from "./playExplosionSE";

export class ParticleEffects {
  static createExplosion(position: Vector3, scene: Scene): void {

    playExplosionSE();

    // シンプルな爆破パーティクル
    const explosionParticles = new ParticleSystem("explosionParticles", 30, scene);
    explosionParticles.particleTexture = new Texture("https://playground.babylonjs.com/textures/flare.png", scene);
    explosionParticles.emitter = position;
    explosionParticles.minEmitBox = new Vector3(-0.2, -0.2, -0.2);
    explosionParticles.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
    explosionParticles.color1 = new Color4(1, 0.7, 0.3, 1.0);
    explosionParticles.color2 = new Color4(0.8, 0.4, 0.1, 1.0);
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

    // フラッシュのアニメーション
    Animation.CreateAndStartAnimation(
      "flashAnim",
      flashSphere,
      "scaling",
      60,
      15,
      new Vector3(0.3, 0.3, 0.3),
      new Vector3(1.2, 1.2, 1.2),
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    Animation.CreateAndStartAnimation(
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
      
      setTimeout(() => {
        explosionParticles.dispose();
      }, 1000);
    }, 800);
  }
}