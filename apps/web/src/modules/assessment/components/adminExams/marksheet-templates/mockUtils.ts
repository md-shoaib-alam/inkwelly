function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export const getDeterministicId = (seed: string, min: number, max: number) => {
  const hash = hashCode(seed);
  return min + (hash % (max - min + 1));
};
