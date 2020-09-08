import { Buffer } from 'buffer/'

type ResolverTypeWrapper<T> = Promise<T> | T

export interface Connection<Node> {
  edges: Array<Edge<Node>>
  nodes: Array<Node>
  pageInfo: PageInfo
}
export interface Edge<Node> {
  cursor: string
  node: Node
}
export interface PageInfo {
  hasPreviousPage: boolean
  hasNextPage: boolean
  startCursor: string | null
  endCursor: string | null
}

type ConnectionArgs = {
  first?: number | null
  last?: number | null
  after?: string | null
  before?: string | null
}

export function connection<Parent, Args extends ConnectionArgs, Context, Node>({
  cursorFromNode: getCursorFromNode,
  nodes: getNodes,
}: {
  cursorFromNode: (node: Node) => string
  nodes: (parent: Parent, args: Args, context: Context) => Promise<Node[]>
}): (
  parent: Parent,
  args: Args,
  context: Context
) => Promise<Connection<ResolverTypeWrapper<Node>>> {
  return async (parent, args, context) => {
    if (args.first && args.last) {
      throw new Error(
        'args.first and args.last cannot be used at the same time'
      )
    }

    let nodes: Node[] = []

    if (args.first) {
      nodes = await getNodes(
        parent,
        {
          ...args,
          first: args.first,
          after: args.after && decodeCursor(args.after),
        },
        context
      )
    }
    if (args.last) {
      nodes = await getNodes(
        parent,
        {
          ...args,
          last: args.last,
          before: args.before && decodeCursor(args.before),
        },
        context
      )
    }

    if (args.first) {
      const hasNextPage = nodes.length > args.first
      const hasPreviousPage = !!args.after

      nodes = nodes.filter((_, i) => i < args.first!)

      const startCursor =
        nodes.length > 0 ? encodeCursor(getCursorFromNode(nodes[0])) : null
      const endCursor =
        nodes.length > 0 ? encodeCursor(getCursorFromNode(last(nodes)!)) : null

      const pageInfo: PageInfo = {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor,
      }

      return {
        edges: nodes.map((node) => ({
          node,
          cursor: encodeCursor(getCursorFromNode(node)),
        })),
        nodes,
        pageInfo,
      }
    }

    if (args.last) {
      const hasNextPage = !!args.before
      const hasPreviousPage = nodes.length > args.last

      nodes = nodes.filter((_, i) => i < args.last!)

      const startCursor =
        nodes.length > 0 ? encodeCursor(getCursorFromNode(nodes[0])) : null
      const endCursor =
        nodes.length > 0 ? encodeCursor(getCursorFromNode(last(nodes)!)) : null

      const pageInfo: PageInfo = {
        hasNextPage,
        hasPreviousPage,
        startCursor,
        endCursor,
      }

      return {
        edges: nodes.map((node) => ({
          node,
          cursor: encodeCursor(getCursorFromNode(node)),
        })),
        nodes,
        pageInfo,
      }
    }

    return {
      edges: [],
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    }
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
