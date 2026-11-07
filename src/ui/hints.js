export function parHint(par) {
  const moves = Number.isInteger(par) && par > 0 ? par : 0;
  return `Par is ${moves} ${moves === 1 ? "move" : "moves"}. Every rotation counts.`;
}
