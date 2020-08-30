import { Buffer } from 'buffer/'

export interface PageInfo {
  hasPreviousPage: boolean
  hasNextPage: boolean
  startCursor: string
  endCursor: string
}

export interface Edge<Node> {
  cursor: string
  node: Node
}

export interface Connection<Node> {
  edges: Array<Edge<Node>>
  nodes: Array<Node>
  pageInfo: PageInfo
}

type ConnectionArgs = {
  first?: number | null
  last?: number | null
  after?: string | null
  before?: string | null
}

type ValidatedConnectionArgs =
  | {
      first: number
      after?: string | null
    }
  | {
      last: number
      before?: string | null
    }

interface CreateConnectionResolverOptions<Node, AdditionalArgs extends {}> {
  cursorFromNode: (node: Node) => string
  nodes: (args: ValidatedConnectionArgs & AdditionalArgs) => Promise<Node[]>
  onError?: (error: Error) => void
}
export function createConnectionResolver<Node, AdditionalArgs extends {} = {}>({
  cursorFromNode,
  nodes,
  onError,
}: CreateConnectionResolverOptions<Node, AdditionalArgs>): (
  args: ConnectionArgs & AdditionalArgs
) => Promise<Connection<Node> | null> {
  return async function connectionResolver(args) {
    if (args.first && args.last) {
      onError?.(
        new Error('args.first and args.last cannot be used at the same time')
      )
      return null
    }

    let _nodes: Node[] = []

    try {
      if (args.first) {
        _nodes = await nodes({
          ...args,
          first: args.first,
          after: args.after && decodeCursor(args.after),
        })
      }
      if (args.last) {
        _nodes = await nodes({
          ...args,
          last: args.last,
          before: args.before && decodeCursor(args.before),
        })
      }
    } catch (error) {
      onError?.(error)
      return null
    }

    if (_nodes.length === 0) {
      return null
    }

    if (args.first) {
      const hasNextPage = _nodes.length > args.first
      const hasPreviousPage = !!args.after

      _nodes = _nodes.filter((_, i) => i < args.first!)

      const pageInfo: PageInfo = {
        hasNextPage,
        hasPreviousPage,
        startCursor: encodeCursor(cursorFromNode(_nodes[0])),
        endCursor: encodeCursor(cursorFromNode(last(_nodes)!)),
      }

      return {
        edges: _nodes.map((node) => ({
          node,
          cursor: encodeCursor(cursorFromNode(node)),
        })),
        nodes: _nodes,
        pageInfo,
      }
    }

    if (args.last) {
      const hasNextPage = !!args.before
      const hasPreviousPage = _nodes.length > args.last

      _nodes = _nodes.filter((_, i) => i < args.last!)

      const pageInfo: PageInfo = {
        hasNextPage,
        hasPreviousPage,
        startCursor: encodeCursor(cursorFromNode(_nodes[0])),
        endCursor: encodeCursor(cursorFromNode(last(_nodes)!)),
      }

      return {
        edges: _nodes.map((node) => ({
          node,
          cursor: encodeCursor(cursorFromNode(node)),
        })),
        nodes: _nodes,
        pageInfo,
      }
    }

    return null
  }
}

export function encodeCursor(plaintext: string) {
  return Buffer.from(plaintext, 'utf-8').toString('base64')
}

export function decodeCursor(base64text: string) {
  return Buffer.from(base64text, 'base64').toString('utf-8')
}

function last<Item>(array: Item[]): Item | undefined {
  const length = array == null ? 0 : array.length
  return length ? array[length - 1] : undefined
}
