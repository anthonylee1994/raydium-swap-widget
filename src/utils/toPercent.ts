import { BigNumberish, Fraction, Percent } from "@raydium-io/raydium-sdk";
import BN from "bn.js";

const parseNumberInfo = (
  n: BigNumberish | Fraction | undefined
): {
  denominator: string;
  numerator: string;
} => {
  if (n === undefined) return { denominator: "1", numerator: "0" };
  if (n instanceof BN) {
    return { numerator: n.toString(), denominator: "1" };
  }

  if (n instanceof Fraction) {
    return {
      denominator: n.denominator.toString(),
      numerator: n.numerator.toString(),
    };
  }

  const s = String(n);
  const [, sign = "", int = "", dec = ""] = s.match(/(-?)(\d*)\.?(\d*)/) ?? [];
  const denominator = "1" + "0".repeat(dec.length);
  const numerator = sign + (int === "0" ? "" : int) + dec || "0";
  return { denominator, numerator };
};

export function toPercent(
  n: BigNumberish,
  options?: { /* usually used for backend data */ alreadyDecimaled?: boolean }
) {
  const { numerator, denominator } = parseNumberInfo(n);
  return new Percent(
    new BN(numerator),
    new BN(denominator).mul(options?.alreadyDecimaled ? new BN(100) : new BN(1))
  );
}
