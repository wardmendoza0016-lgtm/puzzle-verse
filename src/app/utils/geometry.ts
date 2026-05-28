const vEdges = [
  [1, -1, 1],
  [-1, 1, -1],
  [1, -1, 1],
  [-1, 1, -1]
];

const hEdges = [
  [1, -1, 1, -1],
  [-1, 1, -1, 1],
  [1, -1, 1, -1]
];

export function getPiecePath(c: number, r: number): string {
  let path = "M 0 0 ";
  if (r === 0) path += "L 100 0 ";
  else {
    const dir = hEdges[r - 1][c];
    if (dir === -1) path += "L 37.5 0 C 37.5 -22, 62.5 -22, 62.5 0 L 100 0 ";
    else path += "L 37.5 0 C 37.5 22, 62.5 22, 62.5 0 L 100 0 ";
  }
  if (c === 3) path += "L 100 100 ";
  else {
    const dir = vEdges[r][c];
    if (dir === 1) path += "L 100 37.5 C 122 37.5, 122 62.5, 100 62.5 L 100 100 ";
    else path += "L 100 37.5 C 78 37.5, 78 62.5, 100 62.5 L 100 100 ";
  }
  if (r === 3) path += "L 0 100 ";
  else {
    const dir = hEdges[r][c];
    if (dir === 1) path += "L 62.5 100 C 62.5 122, 37.5 122, 37.5 100 L 0 100 ";
    else path += "L 62.5 100 C 62.5 78, 37.5 78, 37.5 100 L 0 100 ";
  }
  if (c === 0) path += "L 0 0 ";
  else {
    const dir = vEdges[r][c - 1];
    if (dir === -1) path += "L 0 62.5 C -22 62.5, -22 37.5, 0 37.5 L 0 0 ";
    else path += "L 0 62.5 C 22 62.5, 22 37.5, 0 37.5 L 0 0 ";
  }
  return path + "Z";
}