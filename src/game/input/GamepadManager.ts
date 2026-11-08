import { RawInputs } from '../types';

export class GamepadManager {
  private deadzone = 0.4;

  public pollGamepad(playerIndex = 0): RawInputs | null {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.getGamepads) {
      return null;
    }

    const gamepads = navigator.getGamepads();
    if (!gamepads) return null;

    // Filter connected gamepads
    const connected = Array.from(gamepads).filter((gp): gp is Gamepad => gp !== null && gp.connected);
    if (playerIndex >= connected.length) return null;

    const pad = connected[playerIndex];

    // Standard Gamepad mapping:
    // Button 0: A / Cross -> LK (Left Kick)
    // Button 1: B / Circle -> RK (Right Kick)
    // Button 2: X / Square -> LP (Left Punch)
    // Button 5: RB / R1 (or Button 4 LB) -> RP (Right Punch)
    // Button 3: Y / Triangle -> ULTIMATE (Overdrive Strike)
    const isPressed = (index: number) => {
      const btn = pad.buttons[index];
      return typeof btn === 'object' ? btn.pressed : btn > 0.5;
    };

    const dpadUp = isPressed(12);
    const dpadDown = isPressed(13);
    const dpadLeft = isPressed(14);
    const dpadRight = isPressed(15);

    const stickX = pad.axes[0] || 0;
    const stickY = pad.axes[1] || 0;

    const up = dpadUp || stickY < -this.deadzone;
    const down = dpadDown || stickY > this.deadzone;
    const left = dpadLeft || stickX < -this.deadzone;
    const right = dpadRight || stickX > this.deadzone;

    const lp = isPressed(2); // X / Square
    const rp = isPressed(5) || isPressed(4); // RB / R1 or LB
    const lk = isPressed(0); // A / Cross
    const rk = isPressed(1); // B / Circle
    const ultimate = isPressed(3); // Y / Triangle

    return {
      up,
      down,
      left,
      right,
      lp,
      rp,
      lk,
      rk,
      ultimate,
    };
  }
}
