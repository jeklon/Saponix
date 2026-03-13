import k from "../kaplayCtx";

export function makeSonic(pos) {
  const sonic = k.add([
    k.sprite("sonic", { anim: "run" }),
    k.scale(4),
    k.area(),
    k.anchor("center"),
    k.pos(pos.x, pos.y),
    k.body({ jumpForce: 1700 }),
    {
      ringCollectUI: null,
      horizontalMovementEnabled: false,
      horizontalSpeed: 720,
      setControls() {
        k.onButtonPress("jump", () => {
          if (this.isGrounded()) {
            this.play("jump");
            this.jump();
            k.play("jump", { volume: 0.5 });
          }
        });

        k.onKeyDown("a", () => {
          if (!this.horizontalMovementEnabled) return;
          this.move(-this.horizontalSpeed, 0);
        });

        k.onKeyDown("d", () => {
          if (!this.horizontalMovementEnabled) return;
          this.move(this.horizontalSpeed, 0);
        });
      },
      setEvents() {
        this.onGround(() => {
          this.play("run");
        });

        this.onUpdate(() => {
          if (!this.horizontalMovementEnabled) return;
          if (this.pos.x < 80) this.pos.x = 80;
          if (this.pos.x > k.width() - 80) this.pos.x = k.width() - 80;
        });
      },
    },
  ]);

  sonic.ringCollectUI = sonic.add([
    k.text("", { font: "mania", size: 24 }),
    k.color(255, 255, 0),
    k.anchor("center"),
    k.pos(30, -10),
  ]);

  return sonic;
}
