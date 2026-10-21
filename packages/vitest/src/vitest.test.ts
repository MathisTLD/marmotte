import { beforeAll, describe, test, expect, afterAll } from "vitest";

function wait(t: number) {
  return new Promise((resolve) => setTimeout(resolve, t));
}

describe("hooks ordering", () => {
  const res: number[] = [];
  beforeAll(async () => {
    await wait(200);
    res.push(0);
  });
  beforeAll(async () => {
    await wait(100);
    res.push(1);
  });
  beforeAll(() => {
    res.push(2);
  });

  afterAll(async () => {
    expect(res).toEqual([0, 1, 2, 2, 1, 0]);
  });
  afterAll(async () => {
    await wait(1000);
    res.push(0);
  });
  afterAll(async () => {
    await wait(500);
    res.push(1);
  });
  afterAll(() => {
    res.push(2);
  });

  test("beforeAll run sequentially", () => {
    expect(res).toEqual([0, 1, 2]);
  });
});
