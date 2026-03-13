import k from "../kaplayCtx";
import { makeSonic } from "../entities/sonic";
import { makeMotobug, makeMotobugPasha } from "../entities/motobug";
import { makeRing } from "../entities/ring";


const LEVELS = [
  { name: "INTERN", minScore: 0, speedBonus: 0, enemySpawnScale: 1 },
  { name: "JUNIOR", minScore: 40, speedBonus: 40, enemySpawnScale: 0.92 },
  { name: "MIDDLE", minScore: 90, speedBonus: 80, enemySpawnScale: 0.85 },
  { name: "SENIOR", minScore: 160, speedBonus: 130, enemySpawnScale: 0.78 },
  { name: "ARCHITECT", minScore: 250, speedBonus: 190, enemySpawnScale: 0.72 },
];

function getCurrentLevel(score = 0) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) return LEVELS[i];
  }
  return LEVELS[0];
}

export default function game() {
  let sanyaGameOverSound = k.play("SanyaGameOver", { volume: 0.5, loop: false });
  sanyaGameOverSound.paused = true;
  const citySfx = k.play("city", { volume: 0.5, loop: true });
  k.setGravity(3100);
  const bgPieceWidth = 1920;
  const bgPieces = [
    k.add([k.sprite("chemical-bg"), k.pos(0, 0), k.scale(2), k.opacity(0.8)]),
    k.add([
      k.sprite("chemical-bg"),
      k.pos(bgPieceWidth, 0),
      k.scale(2),
      k.opacity(0.8),
    ]),
  ];

  const platforms = [
    k.add([k.sprite("platforms"), k.pos(0, 450), k.scale(4)]),
    k.add([k.sprite("platforms"), k.pos(384, 450), k.scale(4)]),
  ];

  const sonic = makeSonic(k.vec2(200, 745));
  sonic.setControls();
  sonic.setEvents();

  const controlsText = k.add([
    k.text("Press Space/Click/Touch to Jump!", {
      font: "mania",
      size: 64,
    }),
    k.anchor("center"),
    k.pos(k.center()),
  ]);

  const dismissControlsAction = k.onButtonPress("jump", () => {
    k.destroy(controlsText);
    dismissControlsAction.cancel();
  });

  const scoreText = k.add([
    k.text("BUGS are FIXED : 0", { font: "mania", size: 72 }),
    k.pos(20, 20),
  ]);

  const levelText = k.add([
    k.text(`LEVEL: ${getCurrentLevel(0).name}`, { font: "mania", size: 32 }),
    k.pos(20, 60),
    k.z(100),
  ]);

  let score = 0;
  let scoreBeforeDeath = 0;
  let scoreMultiplier = 0;
  let survivedSeconds = 0;
  const bossTriggerSeconds = 30;
  let bossFightStarted = false;
  let bossDefeated = false;
  let bossInvulnerable = false;
  let bossEntity = null;

  const timerText = k.add([
    k.text(`SURVIVED: ${survivedSeconds}s`, { font: "mania", size: 32 }),
    k.pos(20, 100),
    k.z(100),
  ]);

  const bossHealthText = k.add([
    k.text("", { font: "mania", size: 32 }),
    k.pos(20, 140),
    k.z(100),
  ]);

  const isBossFightActive = () => bossFightStarted && !bossDefeated;

  const refreshLevelUI = () => {
    levelText.text = `LEVEL: ${getCurrentLevel(score).name}`;
  };

  const clearNormalEntities = () => {
    k.get("enemy").forEach((enemy) => {
      if (!enemy.isBoss) k.destroy(enemy);
    });
    k.get("ring").forEach((ring) => k.destroy(ring));
  };

  const startBossFight = () => {
    if (bossFightStarted) return;

    bossFightStarted = true;
    clearNormalEntities();

    const warningText = k.add([
      k.text("BOSS INCOMING!", { font: "mania", size: 72 }),
      k.anchor("center"),
      k.pos(k.center()),
      k.z(500),
    ]);
    k.wait(1.4, () => k.destroy(warningText));

    bossEntity = k.add([
      k.sprite("motobugPasha", { anim: "run" }),
      k.area({ shape: new k.Rect(k.vec2(-5, 0), 32, 32) }),
      k.scale(8),
      k.anchor("center"),
      k.pos(1600, 700),
      k.body({ jumpForce: 1500 }),
      "enemy",
      "boss",
      {
        isBoss: true,
        hp: 14,
        direction: -1,
        jumpCooldown: 0,
      },
    ]);

    bossHealthText.text = `BOSS HP: ${bossEntity.hp}`;

    bossEntity.onUpdate(() => {
      if (!bossEntity.exists()) return;

      bossEntity.move(bossEntity.direction * 460, 0);

      if (bossEntity.pos.x < 880) bossEntity.direction = 1;
      if (bossEntity.pos.x > 1800) bossEntity.direction = -1;

      if (bossEntity.isGrounded()) {
        bossEntity.jumpCooldown -= k.dt();
        if (bossEntity.jumpCooldown <= 0) {
          bossEntity.jump(1300);
          bossEntity.jumpCooldown = 1.2;
        }
      }
    });
  };

  sonic.onCollide("ring", (ring) => {
    if (sonic.invincible || isBossFightActive()) return;

    const motobugs = k.get("enemy");
    const isUnderMotobug = motobugs.some((motobug) => {
      return (
        ring.pos.x < motobug.pos.x + motobug.width &&
        ring.pos.x + ring.width > motobug.pos.x &&
        ring.pos.y < motobug.pos.y + motobug.height &&
        ring.pos.y + ring.height > motobug.pos.y
      );
    });

    if (isUnderMotobug) return;

    k.play("ring", { volume: 0.5 });
    k.destroy(ring);
    score++;
    scoreText.text = `BUGS are FIXED : ${score}`;
    refreshLevelUI();
    sonic.ringCollectUI.text = "+1 Bug Fix";
    k.wait(1, () => {
      sonic.ringCollectUI.text = "";
    });
  });

  sonic.onCollide("enemy", (enemy) => {
    if (sonic.invincible) return;

    if (!sonic.isGrounded()) {
      if (enemy.isBoss) {
        if (bossInvulnerable) return;

        k.play("destroy", { volume: 0.6 });
        sonic.play("jump");
        sonic.jump(1200);
        enemy.hp -= 1;
        bossHealthText.text = `BOSS HP: ${Math.max(0, enemy.hp)}`;
        bossInvulnerable = true;
        enemy.opacity = 0.5;

        k.wait(0.35, () => {
          bossInvulnerable = false;
          if (enemy.exists()) enemy.opacity = 1;
        });

        if (enemy.hp <= 0) {
          k.play("hyper-ring", { volume: 0.7 });
          k.destroy(enemy);
          bossEntity = null;
          bossDefeated = true;
          bossHealthText.text = "";
          score += 200;
          scoreText.text = `BUGS are FIXED : ${score}`;
          refreshLevelUI();

          const bossDefeatedText = k.add([
            k.text("BOSS FIXED! +200", { font: "mania", size: 60 }),
            k.anchor("center"),
            k.pos(k.center()),
            k.z(500),
          ]);
          k.wait(2, () => k.destroy(bossDefeatedText));
        }

        return;
      }

      k.play("destroy", { volume: 0.5 });
      k.play("hyper-ring", { volume: 0.5 });
      k.destroy(enemy);
      sonic.play("jump");
      sonic.jump();
      scoreMultiplier += 1;
      score += 10 * scoreMultiplier;
      scoreText.text = `BUGS are FIXED : ${score}`;
      refreshLevelUI();
      if (scoreMultiplier === 1)
        sonic.ringCollectUI.text = `+${10 * scoreMultiplier} BUG FIX`;
      if (scoreMultiplier > 1) sonic.ringCollectUI.text = `x${scoreMultiplier}`;
      k.wait(1, () => {
        sonic.ringCollectUI.text = "";
      });

      if (scoreMultiplier === 2) {
        k.play("toasty");
        const toasty = k.add([
          k.sprite("toastyVlad", { anim: "toasty" }),
          k.area(),
          k.anchor("botright"),
          k.pos(k.width(), k.height()),
          k.z(999),
          "toastyVladUI",
        ]);
        k.wait(1.5, () => k.destroy(toasty));
      }

      return;
    }

    if (score > 0) {
      spawnBurstRings(sonic.pos, score);
      scoreBeforeDeath = score;
      score = 0;
      scoreText.text = `BUGS are FIXED : ${score}`;
      refreshLevelUI();
      k.play("LoseRings", { volume: 0.5 });

      sonic.invincible = true;
      let blinkCount = 0;
      const blinkTotal = 4;
      const blinkInterval = 0.25;

      function blink() {
        if (!sonic.exists()) return;
        sonic.opacity = sonic.opacity === 0.5 ? 1 : 0.5;
        blinkCount++;
        if (blinkCount < blinkTotal * 2) {
          k.wait(blinkInterval, blink);
        } else {
          sonic.opacity = 1;
        }
      }

      sonic.opacity = 0.5;
      blink();

      k.wait(2, () => {
        if (!sonic.exists()) return;
        sonic.invincible = false;
        sonic.opacity = 1;
      });

      return;
    }

    k.setData("current-score", scoreBeforeDeath);
    k.go("gameover", citySfx, sanyaGameOverSound);
  });

  let gameSpeed = 300;
  k.loop(1, () => {
    gameSpeed += 50;
  });

  k.loop(1, () => {
    if (isBossFightActive()) return;

    survivedSeconds += 1;
    timerText.text = `SURVIVED: ${survivedSeconds}s`;

    if (survivedSeconds >= bossTriggerSeconds) {
      startBossFight();
    }
  });

  const currentWorldSpeed = () => {
    const level = getCurrentLevel(score);
    const scaledSpeed = gameSpeed + level.speedBonus;
    if (isBossFightActive()) return Math.max(180, scaledSpeed * 0.4);
    return scaledSpeed;
  };

  const spawnMotoBug = () => {
    if (isBossFightActive()) {
      k.wait(0.7, spawnMotoBug);
      return;
    }

    const motobug = makeMotobug(k.vec2(1950, 773));
    motobug.onUpdate(() => {
      const worldSpeed = currentWorldSpeed();
      if (gameSpeed < 3000) {
        motobug.move(-(worldSpeed + 300), 0);
        return;
      }
      motobug.move(-worldSpeed, 0);
    });

    motobug.onExitScreen(() => {
      if (motobug.pos.x < 0) k.destroy(motobug);
    });

    const level = getCurrentLevel(score);
    const waitTime = k.rand(0.5, 2.5) * level.enemySpawnScale;
    k.wait(waitTime, spawnMotoBug);
  };

  const spawnMotoBugPasha = () => {
    if (isBossFightActive()) {
      k.wait(0.7, spawnMotoBugPasha);
      return;
    }

    const motobug = makeMotobugPasha(k.vec2(1950, 773));
    motobug.onUpdate(() => {
      const worldSpeed = currentWorldSpeed();
      if (gameSpeed < 3000) {
        motobug.move(-(worldSpeed + 300), 0);
        return;
      }
      motobug.move(-worldSpeed, 0);
    });

    motobug.onExitScreen(() => {
      if (motobug.pos.x < 0) k.destroy(motobug);
    });

    const level = getCurrentLevel(score);
    const waitTime = k.rand(0.5, 2.5) * level.enemySpawnScale;
    k.wait(waitTime, spawnMotoBugPasha);
  };

  spawnMotoBug();
  spawnMotoBugPasha();

  const spawnRing = () => {
    if (isBossFightActive()) {
      k.wait(0.7, spawnRing);
      return;
    }

    const ring = makeRing(k.vec2(1950, 745));
    ring.onUpdate(() => {
      ring.move(-currentWorldSpeed(), 0);
    });
    ring.onExitScreen(() => {
      if (ring.pos.x < 0) k.destroy(ring);
    });

    const [minDelay, maxDelay] = getCurrentLevel().ringDelay;
    const waitTime = k.rand(minDelay, maxDelay);

    k.wait(waitTime, spawnRing);
  };

  spawnRing();

  k.add([
    k.rect(1920, 300),
    k.opacity(0),
    k.area(),
    k.pos(0, 832),
    k.body({ isStatic: true }),
    "platform",
  ]);

  k.onUpdate(() => {
    if (sonic.isGrounded()) scoreMultiplier = 0;

    if (bgPieces[1].pos.x < 0) {
      bgPieces[0].moveTo(bgPieces[1].pos.x + bgPieceWidth * 2, 0);
      bgPieces.push(bgPieces.shift());
    }

    bgPieces[0].move(-100, 0);
    bgPieces[1].moveTo(bgPieces[0].pos.x + bgPieceWidth * 2, 0);

    bgPieces[0].moveTo(bgPieces[0].pos.x, -sonic.pos.y / 10 - 50);
    bgPieces[1].moveTo(bgPieces[1].pos.x, -sonic.pos.y / 10 - 50);

    if (platforms[1].pos.x < 0) {
      platforms[0].moveTo(platforms[1].pos.x + platforms[1].width * 4, 450);
      platforms.push(platforms.shift());
    }

    platforms[0].move(-currentWorldSpeed(), 0);
    platforms[1].moveTo(platforms[0].pos.x + platforms[1].width * 4, 450);
  });

  let volume = k.getData("volume", 0.5);
  k.setVolume(volume);

  const volumeText = k.add([
    k.text(`VOLUME: ${Math.round(volume * 100)}%`, {
      font: "mania",
      size: 32,
    }),
    k.pos(20, 180),
    k.z(100),
  ]);

  k.onKeyPress("left", () => {
    volume = Math.max(0, volume - 0.1);
    k.setVolume(volume);
    k.setData("volume", volume);
    volumeText.text = `VOLUME: ${Math.round(volume * 100)}%`;
  });

  k.onKeyPress("right", () => {
    volume = Math.min(1, volume + 0.1);
    k.setVolume(volume);
    k.setData("volume", volume);
    volumeText.text = `VOLUME: ${Math.round(volume * 100)}%`;
  });
}

function spawnBurstRings(origin, count = 0) {
  let t = 0;
  let angle = 101.25;
  let n = false;
  let speed = 1200;
  const bounce = 0.7;

  const platforms = k.get("platform");

  while (t < count) {
    k.add([
      k.sprite("ring"),
      k.scale(2),
      k.pos(origin.x, origin.y),
      k.z(200),
      {
        vx: Math.cos((angle * Math.PI) / 180) * speed * (n ? -1 : 1),
        vy: -Math.sin((angle * Math.PI) / 180) * speed,
        life: 360,
        update() {
          this.move(this.vx, this.vy);
          this.vy += 0.4;

          platforms.forEach((platform) => {
            const platTop = platform.pos.y;
            const platLeft = platform.pos.x;
            const platRight = platform.pos.x + (platform.width || 1920);
            if (
              this.pos.y + this.height >= platTop &&
              this.pos.y + this.height <= platTop + Math.abs(this.vy) + 2 &&
              this.pos.x + this.width > platLeft &&
              this.pos.x < platRight &&
              this.vy > 0
            ) {
              this.pos.y = platTop - this.height;
              this.vy = -this.vy * bounce;
            }
          });

          if (this.pos.y <= 0 && this.vy < 0) {
            this.pos.y = 0;
            this.vy = -this.vy * bounce;
          }

          if (this.life <= 120) {
            this.opacity = Math.floor(this.life / 10) % 2 === 0 ? 0.3 : 1;
          } else {
            this.opacity = 1;
          }

          this.life--;
          if (this.life <= 0) k.destroy(this);
        },
      },
    ]);

    if (n) {
      angle += 22.5;
    }
    n = !n;
    t++;
    if (t === 16) {
      speed = 600;
      angle = 101.25;
    }
  }
}
