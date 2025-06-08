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
  let score = 0;
  let scoreBeforeDeath = 0;
  let scoreMultiplier = 0;
  sonic.onCollide("ring", (ring) => {
    if (sonic.invincible) return; // Не подбираем кольца, если неуязвим!

    // Проверяем, не находится ли кольцо под мотобагом
    const motobugs = k.get("enemy"); // Получаем всех мотобагов на сцене (если тег "enemy" присвоен мотобагу)
    const ringBox = ring.area ? ring.area : ring; // если есть area, используем его

    // Проверяем пересечение с каждым мотобагом
    let isUnderMotobug = motobugs.some(motobug => {
      // Проверяем пересечение прямоугольников
      const bugBox = motobug.area ? motobug.area : motobug;
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
    sonic.ringCollectUI.text = "+1 Bug Fix";
    k.wait(1, () => {
      sonic.ringCollectUI.text = "";
    });
  });
  sonic.onCollide("enemy", (enemy) => {
    if (sonic.invincible) return; // Неуязвим — не реагируем!

    if (!sonic.isGrounded()) {
      // ...атака сверху, уничтожаем врага...
      k.play("destroy", { volume: 0.5 });
      k.play("hyper-ring", { volume: 0.5 });
      k.destroy(enemy);
      sonic.play("jump");
      sonic.jump();
      scoreMultiplier += 1;
      score += 10 * scoreMultiplier;
      scoreText.text = `BUGS are FIXED : ${score}`;
      if (scoreMultiplier === 1)
        sonic.ringCollectUI.text = `+${10 * scoreMultiplier} BUG FIX`;
      if (scoreMultiplier > 1) sonic.ringCollectUI.text = `x${scoreMultiplier}`;
      k.wait(1, () => {
        sonic.ringCollectUI.text = "";
      });
       
  return;
    }
    
    if (score > 0 && !sonic.invincible) {
      spawnBurstRings(sonic.pos, score);
      scoreBeforeDeath = score;
      console.log(scoreBeforeDeath);
      score = 0;
      scoreText.text = `BUGS are FIXED : ${score}`;
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
    } else {    if (score > 0 && !sonic.invincible) {
      spawnBurstRings(sonic.pos, score);
      score = 0;
      scoreText.text = `BUGS are FIXED : ${score}`;
      // Делаем Соника неуязвимым
      sonic.invincible = true;
      
    }
      // Если score == 0 — сразу gameover
      
      k.setData("current-score", scoreBeforeDeath);
      k.go("gameover", citySfx, sanyaGameOverSound);
    }
  });

  let gameSpeed = 300;
  k.loop(1, () => {
    gameSpeed += 50;
  });

  const spawnMotoBug = () => {
    const motobug = makeMotobug(k.vec2(1950, 773));
    motobug.onUpdate(() => {
      if (gameSpeed < 3000) {
        motobug.move(-(gameSpeed + 300), 0);
        return;
      }
      motobug.move(-gameSpeed, 0);
    });

    motobug.onExitScreen(() => {
      if (motobug.pos.x < 0) k.destroy(motobug);
    });

    const waitTime = k.rand(0.5, 2.5);

    k.wait(waitTime, spawnMotoBug);
  };

    const spawnMotoBugPasha = () => {
    const motobug = makeMotobugPasha(k.vec2(1950, 773));
    motobug.onUpdate(() => {
      if (gameSpeed < 3000) {
        motobug.move(-(gameSpeed + 300), 0);
        return;
      }
      motobug.move(-gameSpeed, 0);
    });

    motobug.onExitScreen(() => {
      if (motobug.pos.x < 0) k.destroy(motobug);
    });

    const waitTime = k.rand(0.5, 2.5);

    k.wait(waitTime, spawnMotoBugPasha);
  };

  spawnMotoBug();
  spawnMotoBugPasha();

  const spawnRing = () => {
    const ring = makeRing(k.vec2(1950, 745));
    ring.onUpdate(() => {
      ring.move(-gameSpeed, 0);
    });
    ring.onExitScreen(() => {
      if (ring.pos.x < 0) k.destroy(ring);
    });

    const waitTime = k.rand(0.5, 3);

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

    platforms[0].move(-gameSpeed, 0);
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


