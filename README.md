# 🔗 GraphQL Connection Resolver
![](https://img.shields.io/npm/v/graphql-connection-resolver)
![](https://img.shields.io/bundlephobia/min/graphql-connection-resolver)

Helps to easily implement the relay connection specification (inspired by [Nexus.js Connection Plugin](https://nexus.js.org/docs/plugin-connection))

## What is the `Connection`?
- [GraphQL Cursor Connection Specification](https://relay.dev/graphql/connections.htm)

## Install

```bash
$ yarn add graphql-connection-resolver
```

## Example
### Schema
```graphql
scalar DateTime

type Query {
  chatRoom(id: String!): ChatRoom
}

type ChatRoom {
  id: ID!

  # if messages empty, returns null
  messages(
    first: Int
    last: Int
    before: Int
    after: Int
  ): ChatMessageConnection
}

type ChatMessage {
  id: ID!
  createdAt: DateTime!
}

type ChatMessageConnection {
  edges: [ChatMessageEdge!]!
  pageInfo: PageInfo!
}

type ChatMessageEdge {
  node: ChatMessage!
  cursor: String!
}

type PageInfo {
  hasPreviousPage: Boolean!
  hasNextPage: Boolean!
  startCursor: String!
  endCursor: String!
}
```

### Resolver

```typescript
export interface ModelChatMessage {
  id: string
  createdAt: Date
}
```
```typescript
import { createConnectionResolver } from 'graphql-connection-resolver'
import { ModelChatMessage } from '../models'

const resolveMessagesConnection = createConnectionResolver<
  /**
   * The first type parameter is a model type.
   */
  ModelChatMessage,

  /**
   * The second type parameter is an additional arguments type.
   * If you need additional arguments to run the resolver, put them here.
   */ 
  { chatRoom: string }
>({
  async nodes(args) {
    /**
     * returns a list of the model via `args.first`, `args.after`,
     * `args.last`, `args.before` and additional args
     */

    return [
      /* ... */
    ]
  },
  /**
   * Extract a string to be used as a cursor from node.
   * It automatically performs base64 encoding and decoding inside,
   * so just return plain text.
   */ 
  cursorFromNode(node) {
    return node.createdAt.toISOString()
  },
  onError(e) {
    /**
     * If an error occurs, generated resolver function returns `Promise.resolve(null)` and the given `onError` function is executed.
     * so, depending on the error received, you can throw a custom error here.
     */
    throw new ApolloError(e.message, '12345')
  }
})

export const ChatRoom = {
  messages(parent, args, context) {
    return resolveMessagesConnection({
      first: args.first,
      last: args.last,
      before: args.before,
      after: args.after,
      chatRoom: parent.id,
    })
  },
}
```

## Note
This library was created assuming that all fields in `Connection`, `Edge`, and `PageInfo` are required.

```graphql
type ChatMessageConnection {
  edges: [ChatMessageEdge!]!
  pageInfo: PageInfo!
}

type ChatMessageEdge {
  node: ChatMessage!
  cursor: String!
}

type PageInfo {
  hasPreviousPage: Boolean!
  hasNextPage: Boolean!
  startCursor: String!
  endCursor: String!
}
```

```typescript
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
```

## References
- [Nexus.js Connection Plugin](https://nexus.js.org/docs/plugin-connection)
- [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm)

> If you have a feature request or a bug, please create a new issue. And also, pull requests are always welcome 🙏
