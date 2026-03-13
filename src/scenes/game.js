import k from "../kaplayCtx";
import { makeSonic } from "../entities/sonic";
import { makeMotobug, makeMotobugPasha } from "../entities/motobug";
import { makeRing } from "../entities/ring";

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
  const levels = [
    {
      title: "LEVEL 1: INTERN",
      requiredScore: 0,
      speedBoost: 0,
      motobugDelay: [1.3, 2.8],
      motobugPashaDelay: [1.5, 3],
      ringDelay: [0.8, 2.8],
    },
    {
      title: "LEVEL 2: JUNIOR",
      requiredScore: 40,
      speedBoost: 140,
      motobugDelay: [1, 2.2],
      motobugPashaDelay: [1.2, 2.6],
      ringDelay: [0.7, 2.4],
    },
    {
      title: "LEVEL 3: MIDDLE",
      requiredScore: 100,
      speedBoost: 260,
      motobugDelay: [0.8, 1.8],
      motobugPashaDelay: [0.9, 2],
      ringDelay: [0.6, 2.1],
    },
    {
      title: "LEVEL 4: SENIOR",
      requiredScore: 180,
      speedBoost: 400,
      motobugDelay: [0.6, 1.4],
      motobugPashaDelay: [0.7, 1.5],
      ringDelay: [0.5, 1.8],
    },
    {
      title: "LEVEL 5: ARCHITECT",
      requiredScore: 280,
      speedBoost: 560,
      motobugDelay: [0.5, 1.1],
      motobugPashaDelay: [0.55, 1.2],
      ringDelay: [0.4, 1.5],
    },
  ];
  let currentLevel = 0;
  const levelText = k.add([
    k.text(levels[currentLevel].title, { font: "mania", size: 40 }),
    k.pos(20, 180),
    k.z(100),
  ]);
  let score = 0;
  let scoreBeforeDeath = 0;
  let scoreMultiplier = 0;
  let survivedSeconds = 0;
  const bossFightDelay = 30;
  let bossFightStarted = false;
  let bossFightWon = false;
  let bossInvulnerable = false;
  let boss = null;

  const timerText = k.add([
    k.text(`SURVIVED: ${survivedSeconds}s`, { font: "mania", size: 32 }),
    k.pos(20, 140),
    k.z(100),
  ]);

  const bossHealthText = k.add([
    k.text("", { font: "mania", size: 36 }),
    k.pos(20, 220),
    k.z(100),
  ]);

  const getLevelIndexByScore = (currentScore) => {
    let levelIndex = 0;
    levels.forEach((level, index) => {
      if (currentScore >= level.requiredScore) levelIndex = index;
    });
    return levelIndex;
  };

  const getCurrentLevel = () => levels[currentLevel];

  const isBossFightActive = () => bossFightStarted && !bossFightWon;

  const updateLevelByScore = () => {
    const nextLevel = getLevelIndexByScore(score);
    if (nextLevel === currentLevel) return;
    const leveledUp = nextLevel > currentLevel;
    currentLevel = nextLevel;
    levelText.text = levels[currentLevel].title;

    if (leveledUp) {
      k.play("hyper-ring", { volume: 0.4 });
      const levelUpText = k.add([
        k.text(`NEW ${levels[currentLevel].title}!`, { font: "mania", size: 60 }),
        k.anchor("center"),
        k.pos(k.center()),
        k.z(500),
      ]);
      k.wait(1.2, () => k.destroy(levelUpText));
    }
  };
  sonic.onCollide("ring", (ring) => {
    if (sonic.invincible) return; // Не подбираем кольца, если неуязвим!

    // Проверяем, не находится ли кольцо под мотобагом
    const motobugs = k.get("enemy"); // Получаем всех мотобагов на сцене (если тег "enemy" присвоен мотобагу)
    // Проверяем пересечение с каждым мотобагом
    let isUnderMotobug = motobugs.some(motobug => {
      // Проверяем пересечение прямоугольников
      return (
        ring.pos.x < motobug.pos.x + motobug.width &&
        ring.pos.x + ring.width > motobug.pos.x &&
        ring.pos.y < motobug.pos.y + motobug.height &&
        ring.pos.y + ring.height > motobug.pos.y
      );
    });

    if (isUnderMotobug) {
      // Кольцо под мотобагом — не подбираем!
      return;
    }

    // Если не под мотобагом — обычная логика
    k.play("ring", { volume: 0.5 });
    k.destroy(ring);
    score++;
    scoreText.text = `BUGS are FIXED : ${score}`;
    updateLevelByScore();
    sonic.ringCollectUI.text = "+1 Bug Fix";
    k.wait(1, () => {
      sonic.ringCollectUI.text = "";
    });
  });
  sonic.onCollide("enemy", (enemy) => {
    if (sonic.invincible) return; // Неуязвим — не реагируем!

    if (!sonic.isGrounded()) {
      if (enemy.isBoss) {
        if (bossInvulnerable) return;

        k.play("destroy", { volume: 0.6 });
        sonic.play("jump");
        sonic.jump(1200);
        enemy.hp -= 1;
        bossHealthText.text = `BOSS HP: ${enemy.hp}`;
        bossInvulnerable = true;
        enemy.opacity = 0.6;

        k.wait(0.35, () => {
          bossInvulnerable = false;
          if (enemy.exists()) enemy.opacity = 1;
        });

        if (enemy.hp <= 0) {
          k.play("hyper-ring", { volume: 0.7 });
          k.destroy(enemy);
          bossFightWon = true;
          boss = null;
          bossHealthText.text = "";
          score += 150;
          scoreText.text = `BUGS are FIXED : ${score}`;
          updateLevelByScore();

          const bossDefeatedText = k.add([
            k.text("BOSS FIXED! +150", { font: "mania", size: 64 }),
            k.anchor("center"),
            k.pos(k.center()),
            k.z(500),
          ]);
          k.wait(2, () => k.destroy(bossDefeatedText));
        }

        return;
      }

      // ...атака сверху, уничтожаем врага...
      k.play("destroy", { volume: 0.5 });
      k.play("hyper-ring", { volume: 0.5 });
      k.destroy(enemy);
      sonic.play("jump");
      sonic.jump();
      scoreMultiplier += 1;
      score += 10 * scoreMultiplier;
      scoreText.text = `BUGS are FIXED : ${score}`;
      updateLevelByScore();
      if (scoreMultiplier === 1)
        sonic.ringCollectUI.text = `+${10 * scoreMultiplier} BUG FIX`;
      if (scoreMultiplier > 1) sonic.ringCollectUI.text = `x${scoreMultiplier}`;
      k.wait(1, () => {
        sonic.ringCollectUI.text = "";
      });

      // --- Показываем toastyVlad при scoreMultiplier === 3 ---
      if (scoreMultiplier === 2) {
        k.play("toasty");
        const toasty = k.add([
          k.sprite("toastyVlad", { anim: "toasty" }),
          k.area(),
          k.anchor("botright"), // якорь — правый нижний угол спрайта
          k.pos(k.width(), k.height()), // позиция — правый нижний угол экрана
          k.z(999),
          "toastyVladUI",
        ]);
        // Убираем через 1.5 секунды
        k.wait(1.5, () => k.destroy(toasty));
      }

      return;
    }
    
    if (score > 0 && !sonic.invincible) {
      spawnBurstRings(sonic.pos, score);
      scoreBeforeDeath = score;
      score = 0;
      scoreText.text = `BUGS are FIXED : ${score}`;
      updateLevelByScore();
      k.play("LoseRings", { volume: 0.5 });

      // Делаем Соника неуязвимым
      sonic.invincible = true;
      let blinkCount = 0;
      const blinkTotal = 4;
      const blinkInterval = 0.25; // секунды

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

      // Через 2 секунды возвращаем смертность и дефолтный вид
      k.wait(2, () => {
        if (!sonic.exists()) return;
        sonic.invincible = false;
        sonic.opacity = 1;
      });

      return;
    }

    // Если score == 0 — сразу gameover
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

    if (survivedSeconds >= bossFightDelay && !bossFightStarted) {
      bossFightStarted = true;

      k.get("enemy").forEach((enemy) => {
        if (!enemy.isBoss) k.destroy(enemy);
      });
      k.get("ring").forEach((ring) => k.destroy(ring));

      const warningText = k.add([
        k.text("BOSS INCOMING!", { font: "mania", size: 74 }),
        k.anchor("center"),
        k.pos(k.center()),
        k.z(500),
      ]);
      k.wait(1.5, () => k.destroy(warningText));

      boss = k.add([
        k.sprite("motobugPasha", { anim: "run" }),
        k.area({ shape: new k.Rect(k.vec2(-5, 0), 32, 32) }),
        k.scale(8),
        k.anchor("center"),
        k.pos(1500, 700),
        k.body({ jumpForce: 1450 }),
        "enemy",
        "boss",
        {
          isBoss: true,
          hp: 12,
          direction: -1,
          jumpCooldown: 0,
        },
      ]);

      bossHealthText.text = `BOSS HP: ${boss.hp}`;

      boss.onUpdate(() => {
        if (!boss.exists()) return;

        boss.move(boss.direction * 450, 0);

        if (boss.pos.x < 900) boss.direction = 1;
        if (boss.pos.x > 1780) boss.direction = -1;

        if (boss.isGrounded()) {
          boss.jumpCooldown -= k.dt();
          if (boss.jumpCooldown <= 0) {
            boss.jump(1350);
            boss.jumpCooldown = 1.3;
          }
        }
      });
    }
  });

  const getAdjustedGameSpeed = () => {
    if (isBossFightActive()) return Math.max(180, gameSpeed * 0.35);
    return gameSpeed + getCurrentLevel().speedBoost;
  };

  const spawnMotoBug = () => {
    if (isBossFightActive()) {
      k.wait(0.8, spawnMotoBug);
      return;
    }

    const motobug = makeMotobug(k.vec2(1950, 773));
    motobug.onUpdate(() => {
      const adjustedGameSpeed = getAdjustedGameSpeed();
      if (gameSpeed < 3000) {
        motobug.move(-(adjustedGameSpeed + 300), 0);
        return;
      }
      motobug.move(-adjustedGameSpeed, 0);
    });

    motobug.onExitScreen(() => {
      if (motobug.pos.x < 0) k.destroy(motobug);
    });

    const [minDelay, maxDelay] = getCurrentLevel().motobugDelay;
    const waitTime = k.rand(minDelay, maxDelay);

    k.wait(waitTime, spawnMotoBug);
  };

  const spawnMotoBugPasha = () => {
    if (isBossFightActive()) {
      k.wait(0.8, spawnMotoBugPasha);
      return;
    }

    const motobug = makeMotobugPasha(k.vec2(1950, 773));
    motobug.onUpdate(() => {
      const adjustedGameSpeed = getAdjustedGameSpeed();
      if (gameSpeed < 3000) {
        motobug.move(-(adjustedGameSpeed + 300), 0);
        return;
      }
      motobug.move(-adjustedGameSpeed, 0);
    });

    motobug.onExitScreen(() => {
      if (motobug.pos.x < 0) k.destroy(motobug);
    });

    const [minDelay, maxDelay] = getCurrentLevel().motobugPashaDelay;
    const waitTime = k.rand(minDelay, maxDelay);

    k.wait(waitTime, spawnMotoBugPasha);
  };

  spawnMotoBug();
  spawnMotoBugPasha();

  const spawnRing = () => {
    if (isBossFightActive()) {
      k.wait(0.8, spawnRing);
      return;
    }

    const ring = makeRing(k.vec2(1950, 745));
    ring.onUpdate(() => {
      ring.move(-getAdjustedGameSpeed(), 0);
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

    // for jump effect
    bgPieces[0].moveTo(bgPieces[0].pos.x, -sonic.pos.y / 10 - 50);
    bgPieces[1].moveTo(bgPieces[1].pos.x, -sonic.pos.y / 10 - 50);

    if (platforms[1].pos.x < 0) {
      platforms[0].moveTo(platforms[1].pos.x + platforms[1].width * 4, 450);
      platforms.push(platforms.shift());
    }

    platforms[0].move(-getAdjustedGameSpeed(), 0);
    platforms[1].moveTo(platforms[0].pos.x + platforms[1].width * 4, 450);
  });

  let volume = k.getData("volume", 0.5); // Получаем сохраненную громкость или используем 0.5
  k.setVolume(volume);
  
  const volumeText = k.add([
    k.text(`VOLUME: ${Math.round(volume * 100)}%`, { 
      font: "mania", 
      size: 32 
    }),
    k.pos(20, 100), // Располагаем под счетом
    k.z(100),
  ]);

  k.onKeyPress("left", () => {
    volume = Math.max(0, volume - 0.1); // Уменьшаем громкость на 10%
    k.setVolume(volume);
    k.setData("volume", volume); // Сохраняем значение
    volumeText.text = `VOLUME: ${Math.round(volume * 100)}%`;
  });

  k.onKeyPress("right", () => {
    volume = Math.min(1, volume + 0.1); // Увеличиваем громкость на 10%
    k.setVolume(volume);
    k.setData("volume", volume); // Сохраняем значение
    volumeText.text = `VOLUME: ${Math.round(volume * 100)}%`;
  });
}

// Функция для анимации разлетающихся колец
function spawnBurstRings(origin, count = score) {
  let t = 0;
  let angle = 101.25;
  let n = false;
  let speed = 1200;
  const bounce = 0.7; // коэффициент упругости

  // Получаем платформы и bgPieces для проверки столкновений
  const platforms = k.get("platform");

  while (t < count) {
    const ring = k.add([
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

          // Отскок от платформы
          platforms.forEach(platform => {
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

          // Отскок от верхней границы экрана
          if (this.pos.y <= 0 && this.vy < 0) {
            this.pos.y = 0;
            this.vy = -this.vy * bounce;
          }

          // --- МИГАНИЕ в последние 2 секунды (120 кадров) ---
          if (this.life <= 120) {
            // Мигаем каждые 10 кадров
            this.opacity = (Math.floor(this.life / 10) % 2 === 0) ? 0.3 : 1;
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

