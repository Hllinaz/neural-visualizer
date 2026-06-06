import type { Node } from "./Node"

export class Connection {
  constructor(
    public origin: Node,
    public target: Node,
    public weight: number
  ) {}

  gradient: number = 0
}